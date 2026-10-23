from fastapi import APIRouter, HTTPException, Query

from app.core.deps import CurrentUser, DatabaseSession
from app.schemas.user import (
    DomainRead,
    ProgressUpdate,
    RoadmapProgressRead,
    RoadmapRead,
    RoadmapWithProgress,
)
from app.services.domain_service import (
    ContentConflictError,
    ContentNotFoundError,
    DomainService,
)

router = APIRouter(tags=["domains"])


@router.get("/domains", response_model=list[DomainRead])
def get_domains(session: DatabaseSession) -> list[DomainRead]:
    return DomainService(session).list_domains()


@router.get("/roadmaps", response_model=list[RoadmapWithProgress])
def get_roadmaps(
    session: DatabaseSession,
    user: CurrentUser,
    difficulty: str | None = Query(default=None, pattern="^(beginner|intermediate|advanced)$"),
) -> list[RoadmapWithProgress]:
    return DomainService(session).list_student_roadmaps(
        user.id, user.domain_id, difficulty
    )


@router.get("/roadmaps/{roadmap_id}", response_model=RoadmapRead)
def get_roadmap(
    roadmap_id: int, session: DatabaseSession, user: CurrentUser
) -> RoadmapRead:
    try:
        service = DomainService(session)
        roadmap = service.get_student_roadmap_content(roadmap_id, user.domain_id)
        progress = service.get_student_roadmap(roadmap_id, user.id, user.domain_id)
        steps = {
            step.id: step
            for step in progress.steps
        }
        payload = RoadmapRead.model_validate(roadmap)
        payload.steps = [
            steps[step.id]
            for step in roadmap.steps
            if step.id in steps
        ]
        return payload
    except ContentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/roadmaps/{roadmap_id}/start", response_model=RoadmapProgressRead)
def start_roadmap(
    roadmap_id: int, session: DatabaseSession, user: CurrentUser
) -> RoadmapProgressRead:
    try:
        return DomainService(session).start_student_roadmap(
            roadmap_id, user.id, user.domain_id
        )
    except ContentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ContentConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.get("/roadmaps/{roadmap_id}/progress", response_model=RoadmapProgressRead)
def get_roadmap_progress(
    roadmap_id: int, session: DatabaseSession, user: CurrentUser
) -> RoadmapProgressRead:
    try:
        return DomainService(session).get_student_roadmap(
            roadmap_id, user.id, user.domain_id
        )
    except ContentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.put("/roadmaps/{roadmap_id}/steps/{step_id}/progress", response_model=RoadmapProgressRead)
def update_step_progress(
    roadmap_id: int,
    step_id: int,
    payload: ProgressUpdate,
    session: DatabaseSession,
    user: CurrentUser,
) -> RoadmapProgressRead:
    try:
        return DomainService(session).set_step_progress(
            roadmap_id, step_id, user.id, user.domain_id, payload.is_completed
        )
    except ContentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
