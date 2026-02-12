from typing import Any
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from app.api import deps
from app.models.users import User
from app.models.timetable import Timetable, TimetableEntry
from app.models.courses import Course
from app.models.faculty import Faculty
from app.models.infrastructure import Room
from app.models.programs import Program, Batch, Semester
from app.services.generator import TimetableGenerator

router = APIRouter()

async def run_generation_task(program_id: str, batch_id: str, semester_id: str, user_id: str):
    # Fetch Data
    courses = await Course.find(Course.program.id == program_id).to_list() # Mock filter
    faculty = await Faculty.find_all().to_list()
    rooms = await Room.find_all().to_list()
    
    # Batch specific logic
    batch = await Batch.get(batch_id)
    batches = [batch] if batch else []

    # Run GA
    generator = TimetableGenerator(courses, faculty, rooms, batches)
    best_schedule = generator.run()
    
    # Save Result
    entries = []
    for gene in best_schedule.genes:
        # Resolve names for quick checking
        c = next((c for c in courses if str(c.id) == gene.course_id), None)
        f = next((f for f in faculty if str(f.id) == gene.faculty_id), None)
        r = next((r for r in rooms if str(r.id) == gene.room_id), None)
        
        entries.append(TimetableEntry(
            day=gene.day,
            period=gene.period,
            course_id=gene.course_id,
            course_name=c.name if c else "Unknown",
            faculty_id=gene.faculty_id,
            faculty_name=f.name if f else "Unknown",
            room_id=gene.room_id,
            room_name=r.name if r else "Unknown",
            batch_id=gene.batch_id
        ))
        
    timetable = Timetable(
        program=program_id, # ideally link object
        batch=batch_id,
        semester=semester_id,
        entries=entries,
        is_draft=False
    )
    await timetable.insert()

@router.post("/generate/{program_id}/{batch_id}", status_code=202)
async def generate_timetable(
    program_id: str,
    batch_id: str,
    semester_id: str, # passed as query param or body ideally
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Trigger async generation of timetable.
    """
    background_tasks.add_task(run_generation_task, program_id, batch_id, semester_id, str(current_user.id))
    return {"message": "Generation started in background"}

@router.get("/", response_model=Any)
async def get_timetables(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await Timetable.find_all().to_list()
