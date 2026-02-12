from typing import Any, List
import logging
from fastapi import APIRouter, Depends, HTTPException
from beanie.odm.fields import PydanticObjectId
import uuid

from app.api import deps
from app.models.users import User
from app.models.faculty import Faculty
from app.models.courses import Course
from app.models.infrastructure import Room
from app.models.programs import Program, Batch, Semester
from app.models.timetable import Timetable, TimetableEntry
from app.schemas.timetable import TimetableOut, TimetableUpdateRequest, SimulationRequest, TimetableGenerateRequest, TimetableEntryOut
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

    # Resolve human-readable names
    program_name = ""
    batch_name = ""
    semester_name = ""
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

    return {
        "id": str(t.id),
        "program_id": program_id,
        "batch_id": batch_id,
        "semester_id": semester_id,
        "program_name": program_name,
        "batch_name": batch_name,
        "semester_name": semester_name,
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
    Generate a new timetable, save it, and return it.
    """
    program = await Program.get(gen_request.program_id)
    batch = await Batch.get(gen_request.batch_id)
    semester = await Semester.get(gen_request.semester_id)
    if not all([program, batch, semester]):
        raise HTTPException(status_code=404, detail="Program, Batch, or Semester not found.")

    # Use raw MongoDB field matching – Beanie Link query helpers are unreliable
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

    generator = TimetableGenerator(
        courses=courses,
        faculty=faculty,
        rooms=rooms,
        batches=[batch]
    )
    try:
        best_chromosome = generator.run()
    except Exception as e:
        logging.exception("Generator error")
        raise HTTPException(status_code=500, detail=f"Generator error: {str(e)}")

    if best_chromosome.fitness < 0:
        # Check if there are any HARD conflicts (the ones that truly prevent usage)
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
    
    entries = []
    for gene in best_chromosome.genes:
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
            batch_id=gene.batch_id
        )
        entries.append(entry)

    new_timetable = Timetable(
        program=program,
        batch=batch,
        semester=semester,
        entries=entries,
        is_draft=False
    )
    try:
        await new_timetable.insert()
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Save error: {str(e)}")
    
    return await _timetable_out(new_timetable)


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
