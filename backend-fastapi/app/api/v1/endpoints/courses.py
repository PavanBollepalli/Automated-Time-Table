from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from beanie.odm.fields import PydanticObjectId
from app.api import deps
from app.models.courses import Course
from app.models.programs import Program, Semester
from app.models.users import User
from app.schemas.courses import CourseCreate, CourseOut

router = APIRouter()


def _extract_link_id(link_field) -> str | None:
    if link_field is None:
        return None
    # If it's a fetched Document, use .id
    if hasattr(link_field, "id"):
        return str(link_field.id)
    # If it's an unfetched Link with .ref
    if hasattr(link_field, "ref") and link_field.ref:
        return str(link_field.ref.id)
    return None


def _course_out(c: Course) -> dict:
    return {
        "id": str(c.id),
        "code": c.code,
        "name": c.name,
        "credits": c.credits,
        "type": c.type,
        "components": c.components.model_dump() if c.components else {"lecture": 0, "tutorial": 0, "practical": 0},
        "program_id": _extract_link_id(c.program),
        "semester_id": _extract_link_id(c.semester),
        "is_elective": c.is_elective,
    }


@router.post("/", response_model=CourseOut)
async def create_course(
    course_in: CourseCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    data = course_in.model_dump(exclude={"program_id", "semester_id"})
    course = Course(**data)
    # Set Link references properly
    if course_in.program_id:
        prog = await Program.get(PydanticObjectId(course_in.program_id))
        if not prog:
            raise HTTPException(status_code=404, detail="Program not found")
        course.program = prog  # type: ignore
    if course_in.semester_id:
        sem = await Semester.get(PydanticObjectId(course_in.semester_id))
        if not sem:
            raise HTTPException(status_code=404, detail="Semester not found")
        course.semester = sem  # type: ignore
    await course.insert()
    return _course_out(course)


@router.get("/", response_model=List[CourseOut])
async def read_courses(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    courses = await Course.find_all().skip(skip).limit(limit).to_list()
    return [_course_out(c) for c in courses]


@router.get("/{course_id}", response_model=CourseOut)
async def read_course(
    course_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return _course_out(course)
