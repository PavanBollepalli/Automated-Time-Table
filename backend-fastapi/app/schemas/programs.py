from typing import List, Optional
from pydantic import BaseModel
from beanie import Link
from app.models.programs import Program, Batch, Semester, Section

# Semester
class SemesterCreate(BaseModel):
    name: str # e.g., "Sem 1"
    number: int

class SemesterOut(SemesterCreate):
    id: str
    is_active: bool = True

# Section
class SectionCreate(BaseModel):
    name: str  # e.g., "A", "B", "C"
    student_count: int = 0

class SectionOut(BaseModel):
    id: str
    name: str
    student_count: int = 0

# Batch
class BatchCreate(BaseModel):
    name: str
    start_year: int
    end_year: int
    current_semester_id: Optional[str] = None

class BatchOut(BaseModel):
    id: str
    name: str
    start_year: int
    end_year: int
    current_semester: Optional[SemesterOut] = None
    sections: List[SectionOut] = []

# Program
class ProgramCreate(BaseModel):
    name: str
    code: str
    type: str # "UG", "FYUP"
    duration_years: int

class ProgramOut(ProgramCreate):
    id: str
    batches: List[BatchOut] = []
