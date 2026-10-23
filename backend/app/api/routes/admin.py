from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response, status

from app.core.deps import CurrentAdmin, DatabaseSession
from app.models.domain import Domain, Roadmap, RoadmapStep, StepResource
from app.models.user import User
from app.schemas.auth import AdminRead
from app.schemas.user import (
    AdminStatistics,
    DomainAdminRead,
    DomainDetailRead,
    DomainRead,
    DomainUpdate,
    DomainWrite,
    ProgressSummary,
    ResourceOrder,
    ResourceRead,
    ResourceUpdate,
    ResourceWrite,
    RoadmapProgressRead,
    RoadmapRead,
    RoadmapStepDetailRead,
    RoadmapStepUpdate,
    RoadmapStepWrite,
    RoadmapUpdate,
    RoadmapWrite,
    StepOrder,
    StudentDetailRead,
    StudentPage,
    StudentRead,
    StudentRoadmapSummary,
    StudentUpdate,
)
from app.services.domain_service import (
    ContentConflictError,
    ContentNotFoundError,
    DomainService,
    InvalidRelationshipError,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _raise_service_error(error: Exception) -> None:
    if isinstance(error, ContentNotFoundError):
        raise HTTPException(status_code=404, detail=str(error)) from error
    if isinstance(error, ContentConflictError):
        raise HTTPException(status_code=409, detail=str(error)) from error
    if isinstance(error, InvalidRelationshipError):
        raise HTTPException(status_code=422, detail=str(error)) from error
    raise error


@router.get("/me", response_model=AdminRead)
def get_admin_me(admin: CurrentAdmin) -> AdminRead:
    return AdminRead(username=admin.username)


@router.get("/statistics", response_model=AdminStatistics)
def get_statistics(session: DatabaseSession, _: CurrentAdmin) -> AdminStatistics:
    return DomainService(session).statistics()


@router.get("/domains", response_model=list[DomainAdminRead])
def list_domains(session: DatabaseSession, _: CurrentAdmin) -> list[Domain]:
    return DomainService(session).list_admin_domains()


@router.post("/domains", response_model=DomainAdminRead, status_code=status.HTTP_201_CREATED)
def create_domain(payload: DomainWrite, session: DatabaseSession, _: CurrentAdmin) -> Domain:
    try:
        return DomainService(session).create_domain(payload)
    except (ContentConflictError, ContentNotFoundError, InvalidRelationshipError) as error:
        _raise_service_error(error)


@router.get("/domains/{domain_id}", response_model=DomainDetailRead)
def get_domain(domain_id: int, session: DatabaseSession, _: CurrentAdmin) -> Domain:
    try:
        return DomainService(session).get_domain(domain_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.patch("/domains/{domain_id}", response_model=DomainAdminRead)
def update_domain(
    domain_id: int, payload: DomainUpdate, session: DatabaseSession, _: CurrentAdmin
) -> Domain:
    try:
        return DomainService(session).update_domain(domain_id, payload)
    except (ContentConflictError, ContentNotFoundError) as error:
        _raise_service_error(error)


@router.delete("/domains/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_domain(domain_id: int, session: DatabaseSession, _: CurrentAdmin) -> Response:
    try:
        DomainService(session).delete_domain(domain_id)
    except (ContentConflictError, ContentNotFoundError) as error:
        _raise_service_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/roadmaps", response_model=list[RoadmapRead])
def list_roadmaps(session: DatabaseSession, _: CurrentAdmin) -> list[Roadmap]:
    return DomainService(session).list_roadmaps(public_only=False)


@router.post("/roadmaps", response_model=RoadmapRead, status_code=status.HTTP_201_CREATED)
def create_roadmap(
    payload: RoadmapWrite, session: DatabaseSession, _: CurrentAdmin
) -> Roadmap:
    try:
        return DomainService(session).create_roadmap(payload)
    except (ContentConflictError, InvalidRelationshipError) as error:
        _raise_service_error(error)


@router.get("/roadmaps/{roadmap_id}", response_model=RoadmapRead)
def get_roadmap(roadmap_id: int, session: DatabaseSession, _: CurrentAdmin) -> Roadmap:
    try:
        return DomainService(session).get_roadmap(roadmap_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.get("/roadmaps/{roadmap_id}/preview", response_model=RoadmapRead)
def preview_roadmap(roadmap_id: int, session: DatabaseSession, _: CurrentAdmin) -> Roadmap:
    try:
        return DomainService(session).get_roadmap(roadmap_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.patch("/roadmaps/{roadmap_id}", response_model=RoadmapRead)
def update_roadmap(
    roadmap_id: int, payload: RoadmapUpdate, session: DatabaseSession, _: CurrentAdmin
) -> Roadmap:
    try:
        return DomainService(session).update_roadmap(roadmap_id, payload)
    except (ContentConflictError, ContentNotFoundError, InvalidRelationshipError) as error:
        _raise_service_error(error)


@router.delete("/roadmaps/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roadmap(roadmap_id: int, session: DatabaseSession, _: CurrentAdmin) -> Response:
    try:
        DomainService(session).delete_roadmap(roadmap_id)
    except (ContentConflictError, ContentNotFoundError) as error:
        _raise_service_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/roadmaps/{roadmap_id}/steps", response_model=list[RoadmapStepDetailRead])
def list_steps(
    roadmap_id: int, session: DatabaseSession, _: CurrentAdmin
) -> list[RoadmapStep]:
    try:
        return DomainService(session).list_steps(roadmap_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.post(
    "/roadmaps/{roadmap_id}/steps",
    response_model=RoadmapStepDetailRead,
    status_code=status.HTTP_201_CREATED,
)
def create_step(
    roadmap_id: int,
    payload: RoadmapStepWrite,
    session: DatabaseSession,
    _: CurrentAdmin,
) -> RoadmapStep:
    try:
        return DomainService(session).create_step(roadmap_id, payload)
    except (ContentConflictError, ContentNotFoundError) as error:
        _raise_service_error(error)


@router.put("/roadmaps/{roadmap_id}/steps/reorder", response_model=list[RoadmapStepDetailRead])
def reorder_steps(
    roadmap_id: int, order: StepOrder, session: DatabaseSession, _: CurrentAdmin
) -> list[RoadmapStep]:
    try:
        return DomainService(session).reorder_steps(roadmap_id, order.step_ids)
    except (ContentNotFoundError, InvalidRelationshipError) as error:
        _raise_service_error(error)


@router.patch("/steps/{step_id}", response_model=RoadmapStepDetailRead)
def update_step(
    step_id: int, payload: RoadmapStepUpdate, session: DatabaseSession, _: CurrentAdmin
) -> RoadmapStep:
    try:
        return DomainService(session).update_step(step_id, payload)
    except (ContentConflictError, ContentNotFoundError, InvalidRelationshipError) as error:
        _raise_service_error(error)


@router.get("/steps/{step_id}", response_model=RoadmapStepDetailRead)
def get_step(step_id: int, session: DatabaseSession, _: CurrentAdmin) -> RoadmapStep:
    try:
        return DomainService(session).get_step(step_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step(step_id: int, session: DatabaseSession, _: CurrentAdmin) -> Response:
    try:
        DomainService(session).delete_step(step_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/steps/{step_id}/resources", response_model=list[ResourceRead])
def list_resources(
    step_id: int, session: DatabaseSession, _: CurrentAdmin
) -> list[StepResource]:
    try:
        return DomainService(session).list_resources(step_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.post(
    "/steps/{step_id}/resources",
    response_model=ResourceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_resource(
    step_id: int,
    payload: ResourceWrite,
    session: DatabaseSession,
    _: CurrentAdmin,
) -> StepResource:
    try:
        return DomainService(session).create_resource(step_id, payload)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.put("/steps/{step_id}/resources/reorder", response_model=list[ResourceRead])
def reorder_resources(
    step_id: int, order: ResourceOrder, session: DatabaseSession, _: CurrentAdmin
) -> list[StepResource]:
    try:
        return DomainService(session).reorder_resources(step_id, order.resource_ids)
    except (ContentNotFoundError, InvalidRelationshipError) as error:
        _raise_service_error(error)


@router.patch("/resources/{resource_id}", response_model=ResourceRead)
def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    session: DatabaseSession,
    _: CurrentAdmin,
) -> StepResource:
    try:
        return DomainService(session).update_resource(resource_id, payload)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.get("/resources/{resource_id}", response_model=ResourceRead)
def get_resource(resource_id: int, session: DatabaseSession, _: CurrentAdmin) -> StepResource:
    try:
        return DomainService(session).get_resource(resource_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.delete("/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int, session: DatabaseSession, _: CurrentAdmin
) -> Response:
    try:
        DomainService(session).delete_resource(resource_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/students", response_model=StudentPage)
def list_students(
    session: DatabaseSession,
    _: CurrentAdmin,
    search: str | None = Query(default=None, max_length=120),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> StudentPage:
    students, total = DomainService(session).list_students(
        query=search, page=page, page_size=page_size
    )
    return StudentPage(items=students, total=total, page=page, page_size=page_size)


@router.get("/students/{user_id}", response_model=StudentDetailRead)
def get_student(
    user_id: UUID, session: DatabaseSession, _: CurrentAdmin
) -> StudentDetailRead:
    try:
        service = DomainService(session)
        student = service.get_student(user_id)
        return StudentDetailRead.model_validate(
            {**StudentRead.model_validate(student).model_dump(), "roadmap_progress": service.student_progress(user_id)}
        )
    except ContentNotFoundError as error:
        _raise_service_error(error)


@router.patch("/students/{user_id}", response_model=StudentRead)
def update_student(
    user_id: UUID,
    payload: StudentUpdate,
    session: DatabaseSession,
    _: CurrentAdmin,
) -> User:
    try:
        return DomainService(session).update_student(user_id, payload)
    except (ContentNotFoundError, InvalidRelationshipError) as error:
        _raise_service_error(error)


@router.get(
    "/students/{user_id}/progress/{roadmap_id}",
    response_model=RoadmapProgressRead,
)
def get_student_roadmap_progress(
    user_id: UUID,
    roadmap_id: int,
    session: DatabaseSession,
    _: CurrentAdmin,
) -> RoadmapProgressRead:
    try:
        service = DomainService(session)
        service.get_student(user_id)
        return service.get_admin_roadmap_progress(roadmap_id, user_id)
    except ContentNotFoundError as error:
        _raise_service_error(error)
