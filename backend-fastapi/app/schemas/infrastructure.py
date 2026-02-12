from typing import List, Optional
from pydantic import BaseModel

class RoomCreate(BaseModel):
    name: str
    capacity: int
    type: str = "Lecture"
    features: List[str] = []

class RoomOut(RoomCreate):
    id: str
