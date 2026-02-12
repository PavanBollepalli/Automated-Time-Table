from typing import Optional, List
from pydantic import BaseModel
from app.models.courses import CourseComponent

class CourseCreate(BaseModel):
    code: str
    name: str
    credits: int
    type: str
    components: CourseComponent
    program_id: Optional[str] = None
    semester_id: Optional[str] = None
    is_elective: bool = False

class CourseOut(CourseCreate):
    id: str
