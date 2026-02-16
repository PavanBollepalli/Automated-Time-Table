from typing import Any, List
import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException
from beanie.odm.fields import PydanticObjectId
import uuid

from app.api import deps
from app.models.users import User
from app.models.faculty import Faculty
from app.models.courses import Course
from app.models.infrastructure import Room
from app.models.programs import Program, Batch, Semester, Section
from app.models.timetable import Timetable, TimetableEntry, ScheduleConfig, BreakSlot
from app.schemas.timetable import (
    TimetableOut, TimetableUpdateRequest, SimulationRequest,
    TimetableGenerateRequest, TimetableEntryOut,
    ScheduleConfigCreate, ScheduleConfigOut,
)
from app.services.generator import TimetableGenerator

router = APIRouter()


def _extract_link_id(link_field) -> str | None:
    if link_field is None:
        return None
    if hasattr(link_field, "id"):
        return str(link_field.id)
    if hasattr(link_field, "ref") and link_field.ref:
        return str(link_field.ref.id)
    return None


async def _timetable_out(t: Timetable) -> dict:
    program_id = _extract_link_id(t.program) or ""
    batch_id = _extract_link_id(t.batch) or ""
    semester_id = _extract_link_id(t.semester) or ""
    section_id = _extract_link_id(t.section) or ""

    # Resolve human-readable names
    program_name = ""
    batch_name = ""
    semester_name = ""
    section_name = ""
    try:
        if program_id:
            prog = await Program.get(PydanticObjectId(program_id))
            if prog:
                program_name = prog.name
    except Exception:
        pass
    try:
        if batch_id:
            b = await Batch.get(PydanticObjectId(batch_id))
            if b:
                batch_name = b.name
    except Exception:
        pass
    try:
        if semester_id:
            sem = await Semester.get(PydanticObjectId(semester_id))
            if sem:
                semester_name = str(sem.number) if hasattr(sem, 'number') else sem.name
    except Exception:
        pass
    try:
        if section_id:
            sec = await Section.get(PydanticObjectId(section_id))
            if sec:
                section_name = sec.name
    except Exception:
        pass

    return {
        "id": str(t.id),
        "program_id": program_id,
        "batch_id": batch_id,
        "semester_id": semester_id,
        "section_id": section_id,
        "program_name": program_name,
        "batch_name": batch_name,
        "semester_name": semester_name,
        "section_name": section_name,
        "entries": [
            {
                "entry_id": e.entry_id,
                "day": e.day,
                "period": e.period,
                "course_id": e.course_id,
                "course_name": e.course_name,
                "faculty_id": e.faculty_id,
                "faculty_name": e.faculty_name,
                "room_id": e.room_id,
                "room_name": e.room_name,
                "batch_id": e.batch_id,
                "section_id": getattr(e, "section_id", ""),
                "section_name": getattr(e, "section_name", ""),
            }
            for e in (t.entries or [])
        ],
        "is_draft": t.is_draft,
    }

@router.get("/", response_model=List[TimetableOut])
async def get_all_timetables(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all saved timetables.
    """
    try:
        timetables = await Timetable.find_all().to_list()
    except Exception as e:
        logging.exception("Error loading timetables")
        raise HTTPException(status_code=500, detail=f"Error loading timetables: {str(e)}")
    results = []
    for t in timetables:
        try:
            results.append(await _timetable_out(t))
        except Exception:
            logging.warning(f"Skipping corrupt timetable {t.id}")
    return results

@router.post("/generate", response_model=TimetableOut)
async def generate_timetable(
    gen_request: TimetableGenerateRequest,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Generate timetables for all sections in a batch (or specific sections).
    Creates one timetable per section, all scheduled together to avoid conflicts.
    Returns the first timetable; all are saved.
    """
    program = await Program.get(gen_request.program_id)
    batch = await Batch.get(gen_request.batch_id)
    semester = await Semester.get(gen_request.semester_id)
    if not all([program, batch, semester]):
        raise HTTPException(status_code=404, detail="Program, Batch, or Semester not found.")

    # Resolve sections for this batch
    sections_to_schedule: List[Section] = []
    if gen_request.section_ids:
        for sid in gen_request.section_ids:
            sec = await Section.get(sid)
            if sec:
                sections_to_schedule.append(sec)
    else:
        # Get all sections from batch
        for link in (batch.sections or []):
            sec_id = None
            if isinstance(link, Section):
                sections_to_schedule.append(link)
                continue
            if hasattr(link, "ref"):
                sec_id = link.ref.id if hasattr(link.ref, "id") else link.ref
            elif hasattr(link, "id"):
                sec_id = link.id
            if sec_id:
                sec = await Section.get(sec_id)
                if sec:
                    sections_to_schedule.append(sec)

    # Use raw MongoDB field matching
    courses = await Course.find(
        {"program.$id": program.id, "semester.$id": semester.id}
    ).to_list()
    faculty = await Faculty.find_all().to_list()
    rooms = await Room.find_all().to_list()
    
    if not courses:
        raise HTTPException(status_code=400, detail="No courses found for the specified program and semester.")
    if not faculty:
        raise HTTPException(status_code=400, detail="No faculty found. Please add faculty before generating a timetable.")
    if not rooms:
        raise HTTPException(status_code=400, detail="No rooms found. Please add rooms/infrastructure before generating a timetable.")

    # ── Fetch schedule config for this semester (if exists) ──
    schedule_config = None
    try:
        configs = await ScheduleConfig.find(
            {"semester.$id": semester.id}
        ).to_list()
        if configs:
            schedule_config = configs[0]
    except Exception:
        pass  # Use defaults if no config found

    periods_per_day = schedule_config.periods_per_day if schedule_config else 8
    working_days = schedule_config.working_days if schedule_config else None

    generator = TimetableGenerator(
        courses=courses,
        faculty=faculty,
        rooms=rooms,
        batches=[batch],
        sections=sections_to_schedule if sections_to_schedule else None,
        periods_per_day=periods_per_day,
        working_days=working_days,
    )
    try:
        best_chromosome = generator.run()
    except Exception as e:
        logging.exception("Generator error")
        raise HTTPException(status_code=500, detail=f"Generator error: {str(e)}")

    if best_chromosome.fitness < 0:
        hard_conflicts = [c for c in best_chromosome.conflicts if c.startswith("Hard:")]
        if hard_conflicts:
            raise HTTPException(
                status_code=409,
                detail=f"Could not generate a conflict-free timetable. "
                       f"Hard conflicts ({len(hard_conflicts)}): {hard_conflicts[:10]}"
            )

    course_map = {str(c.id): c for c in courses}
    faculty_map = {str(f.id): f for f in faculty}
    room_map = {str(r.id): r for r in rooms}
    section_map = {str(s.id): s for s in sections_to_schedule} if sections_to_schedule else {}
    
    # Group genes by section_id to create per-section timetables
    genes_by_section: dict[str, list] = {}
    for gene in best_chromosome.genes:
        sec_key = gene.section_id or gene.batch_id
        genes_by_section.setdefault(sec_key, []).append(gene)
    
    saved_timetables = []
    
    for sec_key, genes in genes_by_section.items():
        entries = []
        sec_obj = section_map.get(sec_key)
        sec_name = sec_obj.name if sec_obj else ""
        
        for gene in genes:
            entry = TimetableEntry(
                entry_id=str(uuid.uuid4()),
                day=gene.day,
                period=gene.period,
                course_id=gene.course_id,
                course_name=course_map.get(gene.course_id).name if course_map.get(gene.course_id) else "N/A",
                faculty_id=gene.faculty_id,
                faculty_name=faculty_map.get(gene.faculty_id).name if faculty_map.get(gene.faculty_id) else "N/A",
                room_id=gene.room_id,
                room_name=room_map.get(gene.room_id).name if room_map.get(gene.room_id) else "N/A",
                batch_id=gene.batch_id,
                section_id=gene.section_id,
                section_name=sec_name,
            )
            entries.append(entry)

        new_timetable = Timetable(
            program=program,
            batch=batch,
            semester=semester,
            section=sec_obj if sec_obj else None,
            entries=entries,
            is_draft=False
        )
        try:
            await new_timetable.insert()
            saved_timetables.append(new_timetable)
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Save error: {str(e)}")
    
    # Return the first timetable (all are saved)
    if saved_timetables:
        return await _timetable_out(saved_timetables[0])
    raise HTTPException(status_code=500, detail="No timetables were generated.")


@router.post("/simulate", response_model=Any)
async def simulate_timetable(
    sim_request: SimulationRequest,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Run a 'what-if' simulation for timetable generation without saving the result.
    """
    real_faculty = await Faculty.find_all().to_list()
    real_courses = await Course.find_all().to_list()
    real_rooms = await Room.find_all().to_list()
    real_batches = await Batch.find_all().to_list()

    faculty_map = {str(f.id): f for f in real_faculty}
    for h_faculty in sim_request.hypothetical_faculty:
        faculty_map[str(h_faculty.id)] = h_faculty
    
    course_map = {str(c.id): c for c in real_courses}
    for h_course in sim_request.hypothetical_courses:
        course_map[str(h_course.id)] = h_course
        
    room_map = {str(r.id): r for r in real_rooms}
    for h_room in sim_request.hypothetical_rooms:
        room_map[str(h_room.id)] = h_room

    generator = TimetableGenerator(
        courses=list(course_map.values()),
        faculty=list(faculty_map.values()),
        rooms=list(room_map.values()),
        batches=real_batches
    )

    result_chromosome = generator.run()
    
    return {
        "fitness": result_chromosome.fitness,
        "conflicts": result_chromosome.conflicts,
        "genes": [gene.__dict__ for gene in result_chromosome.genes],
    }


@router.get("/{id}", response_model=TimetableOut)
async def get_timetable(
    id: PydanticObjectId,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific timetable by its ID.
    """
    timetable = await Timetable.get(id)
    if not timetable:
        raise HTTPException(status_code=404, detail="Timetable not found.")
    return await _timetable_out(timetable)

@router.patch("/{id}", response_model=TimetableOut)
async def update_timetable_entry(
    id: PydanticObjectId,
    update_request: TimetableUpdateRequest,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Dynamically edit a timetable entry (e.g., move to a new slot).
    """
    timetable = await Timetable.get(id)
    if not timetable:
        raise HTTPException(status_code=404, detail="Timetable not found.")

    if update_request.action == "move_entry":
        payload = update_request.payload
        
        entry_to_move = next((e for e in timetable.entries if e.entry_id == payload.entry_id), None)
        if not entry_to_move:
            raise HTTPException(status_code=404, detail="Timetable entry not found.")

        new_slot = (payload.day, payload.period)
        new_room_id = str(payload.room_id)
        
        faculty = await Faculty.get(PydanticObjectId(entry_to_move.faculty_id))
        if faculty:
            busy_slots = set((slot.day, p) for slot in faculty.busy_slots for p in slot.periods)
            if new_slot in busy_slots:
                raise HTTPException(
                    status_code=409, 
                    detail=f"Conflict: New slot {new_slot} is in faculty {faculty.name}'s predefined busy time."
                )

        for entry in timetable.entries:
            if entry.entry_id == entry_to_move.entry_id:
                continue

            entry_slot = (entry.day, entry.period)
            if entry_slot == new_slot:
                if entry.faculty_id == entry_to_move.faculty_id:
                    raise HTTPException(
                        status_code=409, 
                        detail=f"Conflict: Faculty {entry.faculty_name} is already scheduled at {new_slot}."
                    )
                if entry.batch_id == entry_to_move.batch_id:
                     raise HTTPException(
                        status_code=409, 
                        detail=f"Conflict: Batch is already scheduled for a class at {new_slot}."
                    )
                if entry.room_id == new_room_id:
                    raise HTTPException(
                        status_code=409, 
                        detail=f"Conflict: Room {entry.room_name} is already booked at {new_slot}."
                    )
        
        entry_to_move.day = payload.day
        entry_to_move.period = payload.period
        entry_to_move.room_id = new_room_id
        
        await timetable.save()
        return await _timetable_out(timetable)

    raise HTTPException(status_code=400, detail="Invalid action.")


@router.delete("/{id}")
async def delete_timetable(
    id: PydanticObjectId,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Delete a timetable by its ID.
    """
    timetable = await Timetable.get(id)
    if not timetable:
        raise HTTPException(status_code=404, detail="Timetable not found.")
    await timetable.delete()
    return {"detail": "Timetable deleted successfully.", "id": str(id)}


# ═══════════════════════════════════════════════════════════════════
# ─── Schedule Config CRUD ─────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════

async def _schedule_config_out(c: ScheduleConfig) -> dict:
    semester_id = _extract_link_id(c.semester) or ""
    semester_name = ""
    if semester_id:
        try:
            sem = await Semester.get(PydanticObjectId(semester_id))
            if sem:
                semester_name = f"Sem {sem.number}" if hasattr(sem, "number") else sem.name
        except Exception:
            pass
    return {
        "id": str(c.id),
        "semester_id": semester_id or None,
        "semester_name": semester_name or None,
        "name": c.name,
        "start_time": c.start_time,
        "period_duration_minutes": c.period_duration_minutes,
        "periods_per_day": c.periods_per_day,
        "breaks": [b.model_dump() for b in (c.breaks or [])],
        "working_days": c.working_days or [],
    }


@router.get("/schedule-configs/", response_model=List[ScheduleConfigOut])
async def get_schedule_configs(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List all schedule configurations."""
    configs = await ScheduleConfig.find_all().to_list()
    return [await _schedule_config_out(c) for c in configs]


@router.post("/schedule-configs/", response_model=ScheduleConfigOut)
async def create_schedule_config(
    config_in: ScheduleConfigCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Create a new schedule configuration (timings, breaks, working days)."""
    config = ScheduleConfig(
        name=config_in.name,
        start_time=config_in.start_time,
        period_duration_minutes=config_in.period_duration_minutes,
        periods_per_day=config_in.periods_per_day,
        breaks=[BreakSlot(**b.model_dump()) for b in config_in.breaks],
        working_days=config_in.working_days,
    )
    if config_in.semester_id:
        sem = await Semester.get(PydanticObjectId(config_in.semester_id))
        if sem:
            config.semester = sem
    await config.insert()
    return await _schedule_config_out(config)


@router.put("/schedule-configs/{config_id}", response_model=ScheduleConfigOut)
async def update_schedule_config(
    config_id: PydanticObjectId,
    config_in: ScheduleConfigCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Update an existing schedule configuration."""
    config = await ScheduleConfig.get(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Schedule config not found.")
    config.name = config_in.name
    config.start_time = config_in.start_time
    config.period_duration_minutes = config_in.period_duration_minutes
    config.periods_per_day = config_in.periods_per_day
    config.breaks = [BreakSlot(**b.model_dump()) for b in config_in.breaks]
    config.working_days = config_in.working_days
    if config_in.semester_id:
        sem = await Semester.get(PydanticObjectId(config_in.semester_id))
        if sem:
            config.semester = sem
    else:
        config.semester = None
    await config.save()
    return await _schedule_config_out(config)


@router.delete("/schedule-configs/{config_id}")
async def delete_schedule_config(
    config_id: PydanticObjectId,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """Delete a schedule configuration."""
    config = await ScheduleConfig.get(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Schedule config not found.")
    await config.delete()
    return {"detail": "Schedule config deleted.", "id": str(config_id)}


@router.get("/schedule-configs/by-semester/{semester_id}", response_model=ScheduleConfigOut)
async def get_schedule_config_by_semester(
    semester_id: PydanticObjectId,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get schedule config for a specific semester."""
    configs = await ScheduleConfig.find(
        {"semester.$id": semester_id}
    ).to_list()
    if not configs:
        # Return a default config
        return {
            "id": "",
            "semester_id": str(semester_id),
            "semester_name": None,
            "name": "Default Schedule",
            "start_time": "09:00",
            "period_duration_minutes": 60,
            "periods_per_day": 8,
            "breaks": [],
            "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        }
    return await _schedule_config_out(configs[0])
