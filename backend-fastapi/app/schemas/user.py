from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    full_name: Optional[str] = None

class UserAuth(BaseModel):
    email: EmailStr
    password: str

class UserCreate(UserAuth):
    full_name: Optional[str] = None
    role: str = "student"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool
