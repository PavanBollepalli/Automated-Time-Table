from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.infrastructure import Room
from app.models.users import User
from app.schemas.infrastructure import RoomCreate, RoomOut

router = APIRouter()


def _room_out(r: Room) -> dict:
    return {
        "id": str(r.id),
        "name": r.name,
        "capacity": r.capacity,
        "type": r.type,
        "features": r.features or [],
    }


@router.post("/", response_model=RoomOut)
async def create_room(
    room_in: RoomCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    room = Room(**room_in.model_dump())
    await room.insert()
    return _room_out(room)


@router.get("/", response_model=List[RoomOut])
async def read_rooms(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    rooms = await Room.find_all().skip(skip).limit(limit).to_list()
    return [_room_out(r) for r in rooms]
