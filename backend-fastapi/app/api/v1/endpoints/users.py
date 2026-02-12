from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from app.api import deps
from app.core import security
from app.models.users import User
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserOut)
async def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )

@router.post("/signup", response_model=UserOut)
async def create_user(
    *,
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = await User.find_one(User.email == user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
    )
    await user.insert()
    return UserOut(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
    )
