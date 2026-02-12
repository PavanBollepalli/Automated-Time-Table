from typing import List, Optional
from pydantic import BaseModel
from beanie.odm.fields import PydanticObjectId

# --- Base Schemas ---
class StudentBase(BaseModel):
    name: str
    student_id: str

# --- Properties to receive via API on creation ---
class StudentCreate(StudentBase):
    batch_id: PydanticObjectId
    chosen_elective_ids: List[PydanticObjectId] = []

# --- Properties to receive via API on update ---
class StudentUpdate(BaseModel):
    name: Optional[str] = None
    batch_id: Optional[PydanticObjectId] = None
    chosen_elective_ids: Optional[List[PydanticObjectId]] = None

# --- Properties stored in DB ---
class StudentInDBBase(StudentBase):
    id: PydanticObjectId
    batch_id: PydanticObjectId
    chosen_elective_ids: List[PydanticObjectId]
    
    class Config:
        orm_mode = True

# --- Properties to return to client ---
class Student(StudentInDBBase):
    pass
