from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security
from app.core.config import settings
from app.models.users import User
from app.schemas.user import Token, LoginRequest, LoginResponse

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await User.find_one(User.email == form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, role=user.role, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/login", response_model=LoginResponse)
async def login_json(
    login_data: LoginRequest,
) -> Any:
    """
    JSON-based login endpoint for frontend.
    """
    user = await User.find_one(User.email == login_data.email)
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, role=user.role, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name,
    }
