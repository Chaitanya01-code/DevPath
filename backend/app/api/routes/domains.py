from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser, DatabaseSession
from app.schemas.user import (
    DomainRead,
    ProgressUpdate,
    RoadmapProgressRead,
    RoadmapRead,
    RoadmapWithProgress,
)
from app.services.domain_service import (
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
    domain_id: int | None = Query(default=None, gt=0),
    difficulty: str | None = Query(default=None, pattern="^(beginner|intermediate|advanced)$"),
) -> list[RoadmapWithProgress]:
    service = DomainService(session)
    public_roadmaps = service.list_roadmaps(
        public_only=True, domain_id=domain_id, difficulty=difficulty
    )
    result: list[RoadmapWithProgress] = []
    for roadmap in public_roadmaps:
        progress = service.get_student_roadmap(roadmap.id, user.id)
        result.append(
            RoadmapWithProgress(
                id=roadmap.id,
                domain_id=roadmap.domain_id,
                domain=roadmap.domain,
                title=roadmap.title,
                slug=roadmap.slug,
                description=roadmap.description,
                difficulty=roadmap.difficulty,
                estimated_hours=roadmap.estimated_hours,
                display_order=roadmap.display_order,
                is_published=roadmap.is_published,
                is_archived=roadmap.is_archived,
                progress_percentage=progress.progress_percentage,
                completed_required_steps=progress.completed_required_steps,
                total_required_steps=progress.total_required_steps,
            )
        )
    return result


@router.get("/roadmaps/{roadmap_id}", response_model=RoadmapRead)
def get_roadmap(
    roadmap_id: int, session: DatabaseSession, user: CurrentUser
) -> RoadmapRead:
    try:
        service = DomainService(session)
        roadmap = service.get_roadmap(roadmap_id, public_only=True)
        progress = service.get_student_roadmap(roadmap_id, user.id)
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


@router.get("/roadmaps/{roadmap_id}/progress", response_model=RoadmapProgressRead)
def get_roadmap_progress(
    roadmap_id: int, session: DatabaseSession, user: CurrentUser
) -> RoadmapProgressRead:
    try:
        return DomainService(session).get_student_roadmap(roadmap_id, user.id)
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
            roadmap_id, step_id, user.id, payload.is_completed
        )
    except ContentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
