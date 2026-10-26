from fastapi import APIRouter, HTTPException, Query

from app.core.deps import CurrentUser, DatabaseSession
from app.schemas.user import (
    DomainRead,
    MyRoadmapProgressSummary,
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


@router.get("/resources", response_model=list[RoadmapRead])
def get_learning_resources(
    session: DatabaseSession, user: CurrentUser
) -> list[RoadmapRead]:
    roadmaps = DomainService(session).list_student_resource_roadmaps(user.domain_id)
    return [RoadmapRead.model_validate(roadmap) for roadmap in roadmaps]


@router.get("/roadmaps", response_model=list[RoadmapWithProgress])
def get_roadmaps(
    session: DatabaseSession,
    user: CurrentUser,
    difficulty: str | None = Query(default=None, pattern="^(beginner|intermediate|advanced)$"),
    domain_id: int | None = Query(default=None, gt=0),
    all_domains: bool = Query(default=False),
) -> list[RoadmapWithProgress]:
    if all_domains and domain_id is not None:
        raise HTTPException(status_code=422, detail="Choose all domains or one domain")
    return DomainService(session).list_student_roadmaps(
        user.id,
        None if all_domains else domain_id or user.domain_id,
        difficulty,
    )


@router.get("/roadmaps/progress", response_model=list[MyRoadmapProgressSummary])
def get_my_roadmap_progress(
    session: DatabaseSession, user: CurrentUser
) -> list[MyRoadmapProgressSummary]:
    return [
        MyRoadmapProgressSummary.model_validate(summary)
        for summary in DomainService(session).student_progress(user.id)
    ]


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
