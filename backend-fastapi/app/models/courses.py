from typing import Optional, List
from beanie import Document, Link
from pydantic import BaseModel, Field
from app.models.programs import Program, Semester

class CourseComponent(BaseModel):
    lecture: int = 0
    tutorial: int = 0
    practical: int = 0

class Course(Document):
    code: str  # e.g., "CS101"
    name: str
    credits: int
    type: str  # "Major", "Minor", "Value-Added", "Skill-Enhancement", "Ability-Enhancement"
    components: CourseComponent = CourseComponent() 
    
    # Relations
    program: Optional[Link[Program]] = None
    semester: Optional[Link[Semester]] = None
    is_elective: bool = False
    
    class Settings:
        name = "courses"
