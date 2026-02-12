from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from beanie.odm.fields import PydanticObjectId
from app.api import deps
from app.models.faculty import Faculty
from app.models.users import User
from app.models.courses import Course
from app.models.timetable import Timetable, TimetableEntry
from app.schemas.faculty import FacultyCreate, FacultyOut

router = APIRouter()


def _faculty_out(f: Faculty) -> dict:
    return {
        "id": str(f.id),
        "name": f.name,
        "email": f.email,
        "department": f.department,
        "designation": f.designation,
        "max_load_hours": f.max_load_hours,
        "current_load_hours": f.current_load_hours,
        "busy_slots": [s.model_dump() for s in f.busy_slots] if f.busy_slots else [],
    }


@router.post("/", response_model=FacultyOut)
async def create_faculty(
    faculty_in: FacultyCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    faculty = Faculty(**faculty_in.model_dump(exclude={"can_teach_course_ids"}))

    # Handle linking courses
    if faculty_in.can_teach_course_ids:
        courses = []
        for cid in faculty_in.can_teach_course_ids:
            course = await Course.get(cid)
            if course:
                courses.append(course)
        faculty.can_teach = courses

    await faculty.insert()
    return _faculty_out(faculty)


@router.get("/", response_model=List[FacultyOut])
async def read_faculty(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    all_faculty = await Faculty.find_all().skip(skip).limit(limit).to_list()
    return [_faculty_out(f) for f in all_faculty]

@router.get("/me/timetable", response_model=List[TimetableEntry])
async def get_my_timetable(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve the personal timetable for the currently logged-in faculty member.
    """
    faculty = await Faculty.find_one(Faculty.email == current_user.email)
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found for this user.")

    my_schedule = []
    all_timetables = await Timetable.find_all().to_list()

    for timetable in all_timetables:
        for entry in timetable.entries:
            if entry.faculty_id == str(faculty.id):
                my_schedule.append(entry)
    
    return my_schedule


@router.delete("/{id}")
async def delete_faculty(
    id: PydanticObjectId,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Delete a faculty member by ID.
    """
    faculty = await Faculty.get(id)
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    await faculty.delete()
    return {"detail": "Faculty deleted successfully.", "id": str(id)}
