from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.programs import Program, Batch, Semester
from app.models.users import User
from app.schemas.programs import (
    ProgramCreate, ProgramOut, BatchCreate, BatchOut, SemesterCreate, SemesterOut
)

router = APIRouter()


def _batch_out(b: Batch) -> dict:
    return {
        "id": str(b.id),
        "name": b.name,
        "start_year": b.start_year,
        "end_year": b.end_year,
        "current_semester": None,
    }


async def _program_out(p: Program) -> dict:
    # Manually resolve batch links instead of fetch_all_links (motor compat issue)
    batches = []
    for link in (p.batches or []):
        if isinstance(link, Batch):
            batches.append(_batch_out(link))
        else:
            # It's an unresolved Link – extract the id and fetch manually
            batch_id = None
            if hasattr(link, "ref"):
                batch_id = link.ref.id if hasattr(link.ref, "id") else link.ref
            elif hasattr(link, "id"):
                batch_id = link.id
            if batch_id:
                batch = await Batch.get(batch_id)
                if batch:
                    batches.append(_batch_out(batch))
    return {
        "id": str(p.id),
        "name": p.name,
        "code": p.code,
        "type": p.type,
        "duration_years": p.duration_years,
        "batches": batches,
    }


# Programs
@router.post("/", response_model=ProgramOut)
async def create_program(
    program_in: ProgramCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    program = Program(**program_in.model_dump())
    await program.insert()
    return await _program_out(program)


@router.get("/", response_model=List[ProgramOut])
async def read_programs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    programs = await Program.find_all().skip(skip).limit(limit).to_list()
    return [await _program_out(p) for p in programs]


# Batches
@router.post("/{program_id}/batches", response_model=BatchOut)
async def create_batch(
    program_id: str,
    batch_in: BatchCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    program = await Program.get(program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    batch = Batch(**batch_in.model_dump())
    await batch.insert()

    program.batches.append(batch)
    await program.save()

    return _batch_out(batch)


# Semesters
def _semester_out(s: Semester) -> dict:
    return {"id": str(s.id), "name": s.name, "number": s.number, "is_active": s.is_active}


@router.get("/semesters", response_model=List[SemesterOut])
async def list_semesters(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    semesters = await Semester.find_all().sort("+number").to_list()
    return [_semester_out(s) for s in semesters]


@router.post("/semesters", response_model=SemesterOut)
async def create_semester(
    semester_in: SemesterCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    semester = Semester(**semester_in.model_dump())
    await semester.insert()
    return _semester_out(semester)


# Delete endpoints
@router.delete("/{program_id}")
async def delete_program(
    program_id: str,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    program = await Program.get(program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    # Delete associated batches
    for link in (program.batches or []):
        batch_id = None
        if isinstance(link, Batch):
            batch_id = link.id
        elif hasattr(link, "ref"):
            batch_id = link.ref.id if hasattr(link.ref, "id") else link.ref
        elif hasattr(link, "id"):
            batch_id = link.id
        if batch_id:
            batch = await Batch.get(batch_id)
            if batch:
                await batch.delete()
    await program.delete()
    return {"detail": "Program deleted"}


@router.delete("/{program_id}/batches/{batch_id}")
async def delete_batch(
    program_id: str,
    batch_id: str,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    program = await Program.get(program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    batch = await Batch.get(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    # Remove from program's batch list
    program.batches = [
        b for b in (program.batches or [])
        if not (
            (isinstance(b, Batch) and str(b.id) == batch_id)
            or (hasattr(b, "ref") and str(getattr(b.ref, "id", b.ref)) == batch_id)
            or (hasattr(b, "id") and str(b.id) == batch_id)
        )
    ]
    await program.save()
    await batch.delete()
    return {"detail": "Batch deleted"}


@router.delete("/semesters/{semester_id}")
async def delete_semester(
    semester_id: str,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    semester = await Semester.get(semester_id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    await semester.delete()
    return {"detail": "Semester deleted"}
