from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.domain import Domain, Roadmap, RoadmapStep, StepResource, UserStepProgress
from app.models.user import User
from app.repositories.domain_repository import DomainRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    AdminStatistics,
    DomainUpdate,
    DomainWrite,
    ProgressSummary,
    RoadmapUpdate,
    RoadmapWrite,
    RoadmapProgressRead,
    RoadmapStepDetailRead,
    RoadmapStepUpdate,
    RoadmapStepWrite,
    RoadmapWithProgress,
    ResourceOrder,
    ResourceUpdate,
    ResourceWrite,
    StudentUpdate,
)


class ContentNotFoundError(Exception):
    pass


class ContentConflictError(Exception):
    pass


class InvalidRelationshipError(Exception):
    pass


class DomainService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = DomainRepository(session)
        self.users = UserRepository(session)

    def list_domains(self) -> list[Domain]:
        return [domain for domain in self.repository.list_all() if domain.is_active]

    def list_admin_domains(self) -> list[Domain]:
        return self.repository.list_for_admin()

    def get_domain(self, domain_id: int) -> Domain:
        domain = self.repository.get_domain_detail(domain_id)
        if domain is None:
            raise ContentNotFoundError("Domain not found")
        return domain

    def create_domain(self, payload: DomainWrite) -> Domain:
        return self._commit(
            lambda: self.repository.create_domain(payload.model_dump()),
            "A domain with this name or slug already exists",
        )

    def update_domain(self, domain_id: int, payload: DomainUpdate) -> Domain:
        domain = self.get_domain(domain_id)
        return self._commit(
            lambda: self.repository.update_domain(
                domain, payload.model_dump(exclude_unset=True, exclude_none=True)
            ),
            "A domain with this name or slug already exists",
        )

    def delete_domain(self, domain_id: int) -> None:
        domain = self.get_domain(domain_id)
        users, roadmaps = self.repository.domain_usage(domain_id)
        if users or roadmaps:
            raise ContentConflictError(
                f"Domain is referenced by {users} student(s) and {roadmaps} roadmap(s); deactivate it instead"
            )
        self.repository.delete_domain(domain)

    def list_roadmaps(
        self,
        *,
        public_only: bool,
        domain_id: int | None = None,
        difficulty: str | None = None,
    ) -> list[Roadmap]:
        return self.repository.list_roadmaps(
            public_only=public_only, domain_id=domain_id, difficulty=difficulty
        )

    def get_roadmap(self, roadmap_id: int, *, public_only: bool = False) -> Roadmap:
        roadmap = self.repository.get_roadmap(roadmap_id)
        if roadmap is None or (
            public_only
            and (
                not roadmap.is_published
                or roadmap.is_archived
                or not roadmap.domain.is_active
            )
        ):
            raise ContentNotFoundError("Roadmap not found")
        return roadmap

    def create_roadmap(self, payload: RoadmapWrite) -> Roadmap:
        if self.repository.get_active_by_id(payload.domain_id) is None:
            raise InvalidRelationshipError("Invalid domain")
        return self._commit(
            lambda: self.repository.create_roadmap(payload.model_dump()),
            "A roadmap with this slug already exists in the selected domain",
        )

    def update_roadmap(self, roadmap_id: int, payload: RoadmapUpdate) -> Roadmap:
        roadmap = self.get_roadmap(roadmap_id)
        values = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "domain_id" in values and self.repository.get_active_by_id(int(values["domain_id"])) is None:
            raise InvalidRelationshipError("Invalid domain")
        return self._commit(
            lambda: self.repository.update_roadmap(roadmap, values),
            "A roadmap with this slug already exists in the selected domain",
        )

    def delete_roadmap(self, roadmap_id: int) -> None:
        roadmap = self.get_roadmap(roadmap_id)
        if self.repository.roadmap_progress_count(roadmap_id):
            raise ContentConflictError("Roadmap has student progress; archive it instead")
        self.repository.delete_roadmap(roadmap)

    def list_steps(self, roadmap_id: int) -> list[RoadmapStep]:
        self.get_roadmap(roadmap_id)
        return self.repository.list_steps(roadmap_id)

    def get_step(self, step_id: int) -> RoadmapStep:
        step = self.repository.get_step(step_id)
        if step is None:
            raise ContentNotFoundError("Roadmap step not found")
        return step

    def create_step(self, roadmap_id: int, payload: RoadmapStepWrite) -> RoadmapStep:
        self.get_roadmap(roadmap_id)
        if any(step.position == payload.position for step in self.repository.list_steps(roadmap_id)):
            raise ContentConflictError("A step already uses this position")
        values = payload.model_dump()
        values["roadmap_id"] = roadmap_id
        return self._commit(
            lambda: self.repository.create_step(values),
            "A step already uses this position",
        )

    def update_step(self, step_id: int, payload: RoadmapStepUpdate) -> RoadmapStep:
        step = self.repository.get_step(step_id)
        if step is None:
            raise ContentNotFoundError("Roadmap step not found")
        values = payload.model_dump(exclude_unset=True, exclude_none=True)
        target_roadmap = int(values.get("roadmap_id", step.roadmap_id))
        self.get_roadmap(target_roadmap)
        position = int(values.get("position", step.position))
        if any(
            existing.id != step.id and existing.position == position
            for existing in self.repository.list_steps(target_roadmap)
        ):
            raise ContentConflictError("A step already uses this position")
        return self._commit(
            lambda: self.repository.update_step(step, values),
            "A step already uses this position",
        )

    def reorder_steps(self, roadmap_id: int, step_ids: list[int]) -> list[RoadmapStep]:
        self.get_roadmap(roadmap_id)
        try:
            return self.repository.reorder_steps(roadmap_id, step_ids)
        except ValueError as error:
            raise InvalidRelationshipError(str(error)) from error

    def delete_step(self, step_id: int) -> None:
        step = self.repository.get_step(step_id)
        if step is None:
            raise ContentNotFoundError("Roadmap step not found")
        if self.repository.step_progress_count(step_id):
            raise ContentConflictError("Step has student progress; retain it to preserve learning records")
        self.repository.delete_step(step)

    def list_resources(self, step_id: int) -> list[StepResource]:
        if self.repository.get_step(step_id) is None:
            raise ContentNotFoundError("Roadmap step not found")
        return self.repository.list_resources(step_id)

    def get_resource(self, resource_id: int) -> StepResource:
        resource = self.repository.get_resource(resource_id)
        if resource is None:
            raise ContentNotFoundError("Learning resource not found")
        return resource

    def create_resource(self, step_id: int, payload: ResourceWrite) -> StepResource:
        if self.repository.get_step(step_id) is None:
            raise ContentNotFoundError("Roadmap step not found")
        values = payload.model_dump()
        values["url"] = str(values["url"])
        values["step_id"] = step_id
        return self.repository.create_resource(values)

    def update_resource(self, resource_id: int, payload: ResourceUpdate) -> StepResource:
        resource = self.repository.get_resource(resource_id)
        if resource is None:
            raise ContentNotFoundError("Learning resource not found")
        values = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "url" in values:
            values["url"] = str(values["url"])
        return self.repository.update_resource(resource, values)

    def delete_resource(self, resource_id: int) -> None:
        resource = self.repository.get_resource(resource_id)
        if resource is None:
            raise ContentNotFoundError("Learning resource not found")
        self.repository.delete_resource(resource)

    def reorder_resources(self, step_id: int, resource_ids: list[int]) -> list[StepResource]:
        if self.repository.get_step(step_id) is None:
            raise ContentNotFoundError("Roadmap step not found")
        try:
            return self.repository.reorder_resources(step_id, resource_ids)
        except ValueError as error:
            raise InvalidRelationshipError(str(error)) from error

    def list_student_roadmaps(self, user_id: UUID) -> list[RoadmapWithProgress]:
        result: list[RoadmapWithProgress] = []
        for roadmap in self.repository.list_student_roadmaps(user_id):
            progress = self._roadmap_progress(roadmap, user_id)
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

    def get_student_roadmap(self, roadmap_id: int, user_id: UUID) -> RoadmapProgressRead:
        roadmap = self.get_roadmap(roadmap_id, public_only=True)
        return self._roadmap_progress(roadmap, user_id)

    def get_admin_roadmap_progress(self, roadmap_id: int, user_id: UUID) -> RoadmapProgressRead:
        roadmap = self.get_roadmap(roadmap_id)
        return self._roadmap_progress(roadmap, user_id)

    def set_step_progress(
        self, roadmap_id: int, step_id: int, user_id: UUID, is_completed: bool
    ) -> RoadmapProgressRead:
        self.get_roadmap(roadmap_id, public_only=True)
        step = self.repository.get_step(step_id)
        if step is None or step.roadmap_id != roadmap_id:
            raise ContentNotFoundError("Step not found in this roadmap")
        record = self.repository.get_progress_record(user_id, step_id)
        if record is None:
            record = UserStepProgress(user_id=user_id, step_id=step_id, is_completed=is_completed)
            record.completed_at = datetime.now(timezone.utc) if is_completed else None
        else:
            record.is_completed = is_completed
            record.completed_at = datetime.now(timezone.utc) if is_completed else None
        try:
            self.repository.save_progress(record)
        except IntegrityError as error:
            self.session.rollback()
            raise ContentConflictError("Unable to save step progress; retry the request") from error
        return self.get_student_roadmap(roadmap_id, user_id)

    def list_students(
        self, *, query: str | None, page: int, page_size: int
    ) -> tuple[list[User], int]:
        return self.users.list_students(
            query=query, offset=(page - 1) * page_size, limit=page_size
        )

    def get_student(self, user_id: UUID) -> User:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise ContentNotFoundError("Student not found")
        return user

    def update_student(self, user_id: UUID, payload: StudentUpdate) -> User:
        user = self.get_student(user_id)
        values = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "domain_id" in values and self.repository.get_active_by_id(int(values["domain_id"])) is None:
            raise InvalidRelationshipError("Invalid domain")
        return self.users.update_student(user, values)

    def student_progress(self, user_id: UUID) -> list[dict[str, object]]:
        self.get_student(user_id)
        return self.repository.student_progress(user_id)

    def statistics(self) -> AdminStatistics:
        return AdminStatistics(
            total_students=self.users.count_students(),
            **self.repository.admin_counts(),
        )

    def _roadmap_progress(self, roadmap: Roadmap, user_id: UUID) -> RoadmapProgressRead:
        steps = self.repository.list_steps(roadmap.id)
        records = self.repository.get_progress_records(user_id, [step.id for step in steps])
        step_reads = [
            RoadmapStepDetailRead.model_validate(
                {
                    **{
                        key: getattr(step, key)
                        for key in (
                            "id",
                            "roadmap_id",
                            "title",
                            "description",
                            "instructions",
                            "learning_objectives",
                            "position",
                            "estimated_minutes",
                            "is_required",
                        )
                    },
                    "resources": step.resources,
                    "is_completed": bool(records.get(step.id) and records[step.id].is_completed),
                }
            )
            for step in steps
        ]
        required = sum(step.is_required for step in steps)
        completed = sum(
            bool(records.get(step.id) and records[step.id].is_completed)
            for step in steps
            if step.is_required
        )
        completed_all = sum(
            bool(records.get(step.id) and records[step.id].is_completed) for step in steps
        )
        return RoadmapProgressRead(
            roadmap_id=roadmap.id,
            total_required_steps=required,
            completed_required_steps=completed,
            completed_steps=completed_all,
            progress_percentage=(completed / required * 100) if required else 0,
            steps=step_reads,
        )

    def _commit(self, operation: Any, conflict_message: str) -> Any:
        try:
            return operation()
        except IntegrityError as error:
            self.session.rollback()
            raise ContentConflictError(conflict_message) from error
