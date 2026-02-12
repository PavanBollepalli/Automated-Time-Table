from typing import Optional, List
from beanie import Document
from pydantic import BaseModel

class Room(Document):
    name: str # "Room 101", "Chem Lab A"
    capacity: int
    type: str = "Lecture" # "Lecture", "Lab", "Seminar"
    features: List[str] = [] # "Projector", "Computers"
    
    class Settings:
        name = "rooms"
