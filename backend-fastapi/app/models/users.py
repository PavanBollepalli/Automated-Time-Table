from typing import Optional, List
from beanie import Document, Indexed
from pydantic import EmailStr, Field
from datetime import datetime

class User(Document):
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    role: str = "student"  # admin, faculty, student
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
