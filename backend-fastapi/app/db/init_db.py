from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.users import User
from app.models.programs import Program, Batch, Semester
from app.models.courses import Course
from app.models.faculty import Faculty
from app.models.infrastructure import Room
from app.models.timetable import Timetable

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(
        database=client[settings.MONGODB_DB],
        document_models=[
            User,
            Program,
            Batch,
            Semester,
            Course,
            Faculty,
            Room,
            Timetable,
        ],
    )
