import random
import copy
from typing import List, Dict, Optional, Tuple, Set
from app.models.courses import Course
from app.models.faculty import Faculty
from app.models.infrastructure import Room
from app.models.programs import Program, Batch, Section


class Gene:
    __slots__ = ("course_id", "faculty_id", "room_id", "batch_id", "section_id", "day", "period", "is_practical")

    def __init__(self, course_id: str, faculty_id: str, room_id: str, batch_id: str, day: str, period: int, is_practical: bool = False, section_id: str = ""):
        self.course_id = course_id
        self.faculty_id = faculty_id
        self.room_id = room_id
        self.batch_id = batch_id
        self.section_id = section_id
        self.day = day
        self.period = period
        self.is_practical = is_practical

    def __repr__(self):
        return f"{self.day} P{self.period} - {self.course_id} ({'P' if self.is_practical else 'L'}) in {self.room_id} [sec:{self.section_id}]"


class Chromosome:
    def __init__(self, genes: List[Gene]):
        self.genes = genes
        self.fitness = 0.0
        self.conflicts: List[str] = []


class TimetableGenerator:
    def __init__(self, courses: List[Course], faculty: List[Faculty], rooms: List[Room], batches: List[Batch], sections: List[Section] | None = None):
        self.courses = courses
        self.faculty = faculty
        self.rooms = rooms
        self.batches = batches
        # Sections are the real scheduling units; if none provided, create a virtual one per batch
        self.sections: List[dict] = []
        if sections:
            for s in sections:
                # Find which batch this section belongs to
                parent_batch_id = ""
                for b in batches:
                    for link in (b.sections or []):
                        sid = None
                        if isinstance(link, Section):
                            sid = str(link.id)
                        elif hasattr(link, "ref"):
                            sid = str(link.ref.id) if hasattr(link.ref, "id") else str(link.ref)
                        elif hasattr(link, "id"):
                            sid = str(link.id)
                        if sid == str(s.id):
                            parent_batch_id = str(b.id)
                            break
                    if parent_batch_id:
                        break
                self.sections.append({"id": str(s.id), "name": s.name, "batch_id": parent_batch_id or str(batches[0].id) if batches else ""})
        else:
            # Legacy: no sections, treat each batch as a single section
            for b in batches:
                self.sections.append({"id": str(b.id), "name": "default", "batch_id": str(b.id)})

        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        self.periods = list(range(1, 9))  # 8 periods per day
        self.all_slots: List[Tuple[str, int]] = [(d, p) for d in self.days for p in self.periods]

        # --- GA parameters (tuned for convergence) ---
        self.population_size = 150
        self.generations = 500
        self.mutation_rate = 0.35
        self.elite_size = 6
        self.tournament_size = 5

        # --- Pre-process lookups ---
        self.faculty_busy_map: Dict[str, Set[Tuple[str, int]]] = {}
        for f in self.faculty:
            busy: Set[Tuple[str, int]] = set()
            for slot in (f.busy_slots or []):
                for p in (slot.periods or []):
                    busy.add((slot.day, p))
            self.faculty_busy_map[str(f.id)] = busy

        self.faculty_map = {str(f.id): f for f in self.faculty}
        self.room_map = {str(r.id): r for r in self.rooms}
        self.course_map = {str(c.id): c for c in self.courses}

        # Separate rooms by type for smart assignment
        self.lab_rooms = [r for r in self.rooms if (r.type or "").lower() == "lab"]
        self.lecture_rooms = [r for r in self.rooms if (r.type or "").lower() != "lab"]
        if not self.lecture_rooms:
            self.lecture_rooms = self.rooms  # fallback
        if not self.lab_rooms:
            self.lab_rooms = self.rooms  # fallback

    # ─── Helpers ──────────────────────────────────────────────────

    @staticmethod
    def _extract_link_id(link) -> str | None:
        if link is None:
            return None
        if hasattr(link, "id"):
            return str(link.id)
        if hasattr(link, "ref"):
            ref = link.ref
            return str(ref.id) if hasattr(ref, "id") else str(ref)
        return None

    def _get_faculty_for_course(self, course_id: str) -> List[Faculty]:
        capable = []
        for f in self.faculty:
            for c in (f.can_teach or []):
                if self._extract_link_id(c) == course_id:
                    capable.append(f)
                    break
        return capable if capable else self.faculty

    def _valid_slots_for_faculty(self, faculty_id: str) -> List[Tuple[str, int]]:
        busy = self.faculty_busy_map.get(faculty_id, set())
        return [s for s in self.all_slots if s not in busy]

    def _pick_room(self, is_practical: bool) -> Room:
        return random.choice(self.lab_rooms if is_practical else self.lecture_rooms)

    # ─── Smart Initialization ────────────────────────────────────

    def _build_session_list(self) -> List[dict]:
        """Expand courses into individual sessions (one per period needed) per section."""
        sessions = []
        for sec in self.sections:
            sec_id = sec["id"]
            batch_id = sec["batch_id"]
            for course in self.courses:
                cid = str(course.id)
                comp = course.components
                # Lectures
                for _ in range(comp.lecture):
                    sessions.append({"course_id": cid, "batch_id": batch_id, "section_id": sec_id, "practical": False})
                # Tutorials (treat as lecture-room sessions)
                for _ in range(comp.tutorial):
                    sessions.append({"course_id": cid, "batch_id": batch_id, "section_id": sec_id, "practical": False})
                # Practicals
                for _ in range(comp.practical):
                    sessions.append({"course_id": cid, "batch_id": batch_id, "section_id": sec_id, "practical": True})
        return sessions

    def initialize_population(self) -> List[Chromosome]:
        sessions = self._build_session_list()
        population: List[Chromosome] = []

        for _ in range(self.population_size):
            genes: List[Gene] = []
            # Track what's booked per slot to reduce initial hard-conflicts
            batch_booked: Dict[str, Set[Tuple[str, int]]] = {}
            faculty_booked: Dict[str, Set[Tuple[str, int]]] = {}
            room_booked: Dict[str, Set[Tuple[str, int]]] = {}

            # Shuffle to get diversity across chromosomes
            random.shuffle(sessions)

            for sess in sessions:
                cid = sess["course_id"]
                bid = sess["section_id"]  # Use section_id as scheduling unit
                is_prac = sess["practical"]
                batch_id = sess["batch_id"]
                section_id = sess["section_id"]

                capable = self._get_faculty_for_course(cid)
                random.shuffle(capable)

                placed = False
                for fac in capable:
                    fid = str(fac.id)
                    available_slots = self._valid_slots_for_faculty(fid)
                    random.shuffle(available_slots)

                    for slot in available_slots:
                        # Check batch not already at this slot
                        if slot in batch_booked.get(bid, set()):
                            continue
                        # Check faculty not already at this slot
                        if slot in faculty_booked.get(fid, set()):
                            continue

                        # Pick appropriate room type
                        room_pool = self.lab_rooms if is_prac else self.lecture_rooms
                        random.shuffle(room_pool)
                        room_found = None
                        for room in room_pool:
                            rid = str(room.id)
                            if slot not in room_booked.get(rid, set()):
                                room_found = room
                                break

                        if room_found is None:
                            continue  # no free room at this slot, try next

                        rid = str(room_found.id)
                        # Book it
                        batch_booked.setdefault(bid, set()).add(slot)
                        faculty_booked.setdefault(fid, set()).add(slot)
                        room_booked.setdefault(rid, set()).add(slot)

                        genes.append(Gene(cid, fid, rid, batch_id, slot[0], slot[1], is_prac, section_id))
                        placed = True
                        break  # found a valid slot for this faculty

                    if placed:
                        break

                if not placed:
                    # Fallback: random placement (will cause conflicts, GA will fix)
                    fac = random.choice(capable)
                    fid = str(fac.id)
                    slot = random.choice(self.all_slots)
                    room = self._pick_room(is_prac)
                    genes.append(Gene(cid, fid, str(room.id), batch_id, slot[0], slot[1], is_prac, section_id))

            population.append(Chromosome(genes))
        return population

    # ─── Fitness ─────────────────────────────────────────────────

    def calculate_fitness(self, chromosome: Chromosome) -> float:
        score = 0.0
        conflicts: List[str] = []

        faculty_at: Dict[Tuple[str, int], Set[str]] = {}
        room_at: Dict[Tuple[str, int], Set[str]] = {}
        batch_at: Dict[Tuple[str, int], Set[str]] = {}  # keyed by section_id
        batch_schedule: Dict[str, Dict[str, List[int]]] = {
            sec["id"]: {d: [] for d in self.days} for sec in self.sections
        }

        for gene in chromosome.genes:
            slot = (gene.day, gene.period)

            # ── Hard: Faculty clash ──
            fset = faculty_at.setdefault(slot, set())
            if gene.faculty_id in fset:
                score -= 100
                conflicts.append(f"Hard: Faculty {gene.faculty_id} clashing at {slot}")
            else:
                fset.add(gene.faculty_id)

            # ── Hard: Faculty busy slot ──
            if slot in self.faculty_busy_map.get(gene.faculty_id, set()):
                score -= 100
                conflicts.append(f"Hard: Faculty {gene.faculty_id} scheduled in busy slot {slot}")

            # ── Hard: Room clash ──
            rset = room_at.setdefault(slot, set())
            if gene.room_id in rset:
                score -= 100
                conflicts.append(f"Hard: Room {gene.room_id} clashing at {slot}")
            else:
                rset.add(gene.room_id)

            # ── Hard: Section clash (a section can only be in one place at a time) ──
            section_key = gene.section_id or gene.batch_id
            bset = batch_at.setdefault(slot, set())
            if section_key in bset:
                score -= 100
                conflicts.append(f"Hard: Section {section_key} clashing at {slot}")
            else:
                bset.add(section_key)

            # ── Soft: Room-type mismatch ──
            if gene.is_practical:
                room = self.room_map.get(gene.room_id)
                if room and (room.type or "").lower() != "lab":
                    score -= 10
                    course = self.course_map.get(gene.course_id)
                    cname = course.name if course else gene.course_id
                    conflicts.append(f"Soft: Practical {cname} in non-lab room {room.name}")

            # Track for gap analysis
            if section_key in batch_schedule:
                batch_schedule[section_key][gene.day].append(gene.period)

        # ── Soft: Gap & consecutive analysis ──
        for bid, schedule in batch_schedule.items():
            for day, periods in schedule.items():
                if len(periods) < 2:
                    continue
                periods.sort()

                for i in range(len(periods) - 1):
                    gap = periods[i + 1] - periods[i]
                    if gap > 1:
                        score -= (gap - 1) * 2
                        conflicts.append(f"Soft: Batch {bid} has a {gap - 1}h gap on {day}")

                # Consecutive stretch > 4
                consec = 1
                for i in range(len(periods) - 1):
                    if periods[i + 1] - periods[i] == 1:
                        consec += 1
                    else:
                        consec = 1
                    if consec > 4:
                        score -= 3
                        conflicts.append(f"Soft: Batch {bid} has >4 consecutive classes on {day}")
                        break

        # ── Soft: Spread classes across days (avoid overloading one day) ──
        for bid, schedule in batch_schedule.items():
            counts = [len(ps) for ps in schedule.values()]
            if counts:
                avg = sum(counts) / len(counts)
                for cnt in counts:
                    diff = abs(cnt - avg)
                    if diff > 2:
                        score -= diff

        chromosome.fitness = score
        chromosome.conflicts = conflicts
        return score

    # ─── Mutation (multi-strategy) ───────────────────────────────

    def mutate(self, chromosome: Chromosome) -> Chromosome:
        if not chromosome.genes:
            return chromosome

        for _ in range(random.randint(1, 3)):  # 1-3 mutations per call
            if random.random() > self.mutation_rate:
                continue
            idx = random.randint(0, len(chromosome.genes) - 1)
            gene = chromosome.genes[idx]
            strategy = random.random()

            if strategy < 0.45:
                # Strategy 1: Move to a different valid time slot
                valid = self._valid_slots_for_faculty(gene.faculty_id)
                if valid:
                    gene.day, gene.period = random.choice(valid)

            elif strategy < 0.70:
                # Strategy 2: Change room (fix room-type mismatch)
                room = self._pick_room(gene.is_practical)
                gene.room_id = str(room.id)

            elif strategy < 0.90:
                # Strategy 3: Change faculty
                capable = self._get_faculty_for_course(gene.course_id)
                if capable:
                    new_fac = random.choice(capable)
                    gene.faculty_id = str(new_fac.id)
                    # Also re-slot to valid time for new faculty
                    valid = self._valid_slots_for_faculty(gene.faculty_id)
                    if valid:
                        gene.day, gene.period = random.choice(valid)

            else:
                # Strategy 4: Swap two genes' time slots
                idx2 = random.randint(0, len(chromosome.genes) - 1)
                g2 = chromosome.genes[idx2]
                gene.day, gene.period, g2.day, g2.period = g2.day, g2.period, gene.day, gene.period

        return chromosome

    # ─── Crossover (uniform) ─────────────────────────────────────

    def crossover(self, p1: Chromosome, p2: Chromosome) -> Chromosome:
        # Uniform crossover: for each gene, pick from parent1 or parent2
        min_len = min(len(p1.genes), len(p2.genes))
        child_genes: List[Gene] = []
        for i in range(min_len):
            src = p1.genes[i] if random.random() < 0.5 else p2.genes[i]
            child_genes.append(Gene(src.course_id, src.faculty_id, src.room_id,
                                    src.batch_id, src.day, src.period, src.is_practical, src.section_id))
        # Append remaining genes from the longer parent
        longer = p1.genes if len(p1.genes) >= len(p2.genes) else p2.genes
        for i in range(min_len, len(longer)):
            g = longer[i]
            child_genes.append(Gene(g.course_id, g.faculty_id, g.room_id,
                                    g.batch_id, g.day, g.period, g.is_practical, g.section_id))
        return Chromosome(child_genes)

    # ─── Tournament Selection ────────────────────────────────────

    def _tournament_select(self, population: List[Chromosome]) -> Chromosome:
        contestants = random.sample(population, min(self.tournament_size, len(population)))
        return max(contestants, key=lambda c: c.fitness)

    # ─── Run ─────────────────────────────────────────────────────

    def run(self) -> Chromosome:
        population = self.initialize_population()

        best_ever: Optional[Chromosome] = None
        stagnation = 0

        for gen in range(self.generations):
            for chrom in population:
                self.calculate_fitness(chrom)

            population.sort(key=lambda c: c.fitness, reverse=True)
            current_best = population[0]

            # Track overall best
            if best_ever is None or current_best.fitness > best_ever.fitness:
                best_ever = Chromosome(
                    [Gene(g.course_id, g.faculty_id, g.room_id, g.batch_id, g.day, g.period, g.is_practical, g.section_id)
                     for g in current_best.genes]
                )
                best_ever.fitness = current_best.fitness
                best_ever.conflicts = list(current_best.conflicts)
                stagnation = 0
            else:
                stagnation += 1

            # Perfect solution
            if current_best.fitness >= 0:
                self.calculate_fitness(current_best)
                return current_best

            # Adaptive mutation: increase if stuck
            if stagnation > 30:
                self.mutation_rate = min(0.6, self.mutation_rate + 0.05)
            elif stagnation == 0:
                self.mutation_rate = 0.35

            # Build next generation
            next_gen = [
                Chromosome(
                    [Gene(g.course_id, g.faculty_id, g.room_id, g.batch_id, g.day, g.period, g.is_practical, g.section_id)
                     for g in population[i].genes]
                )
                for i in range(self.elite_size)
            ]

            while len(next_gen) < self.population_size:
                p1 = self._tournament_select(population)
                p2 = self._tournament_select(population)
                child = self.crossover(p1, p2)
                child = self.mutate(child)
                next_gen.append(child)

            population = next_gen

        # Return the best we ever found
        if best_ever is not None:
            self.calculate_fitness(best_ever)
            return best_ever
        self.calculate_fitness(population[0])
        return population[0]
