from fastapi import APIRouter
from app.api.v1.endpoints import login, users, programs, courses, faculty, infrastructure, timetables, generator

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(programs.router, prefix="/programs", tags=["programs"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["faculty"])
api_router.include_router(infrastructure.router, prefix="/infrastructure", tags=["infrastructure"])
api_router.include_router(timetables.router, prefix="/timetables", tags=["timetables"])
api_router.include_router(generator.router, prefix="/generator", tags=["generator"])
