from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.models.domain import Domain, Roadmap, RoadmapStep, StepResource, UserStepProgress
from app.models.user import User


NOT_DECIDED_DOMAIN_NAME = "Not decided yet"


class DomainRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Domain]:
        return list(
            self.session.scalars(select(Domain).order_by(Domain.display_order, Domain.id)).all()
        )

    def list_for_admin(self) -> list[Domain]:
        return list(
            self.session.scalars(select(Domain).order_by(Domain.display_order, Domain.id)).all()
        )

    def get_by_id(self, domain_id: int) -> Domain | None:
        return self.session.get(Domain, domain_id)

    def get_active_by_id(self, domain_id: int) -> Domain | None:
        return self.session.scalar(
            select(Domain).where(Domain.id == domain_id, Domain.is_active.is_(True))
        )

    def get_domain_detail(self, domain_id: int) -> Domain | None:
        statement = (
            select(Domain)
            .options(selectinload(Domain.roadmaps))
            .where(Domain.id == domain_id)
        )
        return self.session.scalar(statement)

    def domain_usage(self, domain_id: int) -> tuple[int, int]:
        users = int(self.session.scalar(select(func.count(User.id)).where(User.domain_id == domain_id)) or 0)
        roadmaps = int(self.session.scalar(select(func.count(Roadmap.id)).where(Roadmap.domain_id == domain_id)) or 0)
        return users, roadmaps

    def roadmap_progress_count(self, roadmap_id: int) -> int:
        return int(
            self.session.scalar(
                select(func.count(UserStepProgress.id))
                .join(RoadmapStep, RoadmapStep.id == UserStepProgress.step_id)
                .where(RoadmapStep.roadmap_id == roadmap_id)
            )
            or 0
        )

    def step_progress_count(self, step_id: int) -> int:
        return int(
            self.session.scalar(
                select(func.count(UserStepProgress.id)).where(
                    UserStepProgress.step_id == step_id
                )
            )
            or 0
        )

    def student_progress(self, user_id: object) -> list[dict[str, object]]:
        summaries = self.list_student_roadmap_summaries(user_id)
        return summaries

    def get_not_decided(self) -> Domain | None:
        return self.session.scalar(
            select(Domain).where(Domain.name == NOT_DECIDED_DOMAIN_NAME)
        )

    def create_domain(self, values: dict[str, object]) -> Domain:
        domain = Domain(**values)
        self.session.add(domain)
        self.session.commit()
        self.session.refresh(domain)
        return domain

    def update_domain(self, domain: Domain, values: dict[str, object]) -> Domain:
        for field, value in values.items():
            setattr(domain, field, value)
        self.session.commit()
        self.session.refresh(domain)
        return domain

    def delete_domain(self, domain: Domain) -> None:
        self.session.delete(domain)
        self.session.commit()

    def list_roadmaps(
        self,
        *,
        public_only: bool,
        domain_id: int | None = None,
        difficulty: str | None = None,
        include_steps: bool = False,
    ) -> list[Roadmap]:
        statement = select(Roadmap).options(selectinload(Roadmap.domain))
        if include_steps:
            statement = statement.options(
                selectinload(Roadmap.steps).selectinload(RoadmapStep.resources)
            )
        if public_only:
            statement = statement.where(
                Roadmap.is_published.is_(True),
                Roadmap.is_archived.is_(False),
                Roadmap.domain.has(Domain.is_active.is_(True)),
                Roadmap.steps.any(RoadmapStep.is_required.is_(True)),
            )
        if domain_id is not None:
            statement = statement.where(Roadmap.domain_id == domain_id)
        if difficulty is not None:
            statement = statement.where(Roadmap.difficulty == difficulty)
        return list(
            self.session.scalars(statement.order_by(Roadmap.display_order, Roadmap.id)).all()
        )

    def get_roadmap(self, roadmap_id: int, *, include_steps: bool = True) -> Roadmap | None:
        statement = select(Roadmap).options(selectinload(Roadmap.domain))
        if include_steps:
            statement = statement.options(
                selectinload(Roadmap.steps).selectinload(RoadmapStep.resources)
            )
        return self.session.scalar(statement.where(Roadmap.id == roadmap_id))

    def create_roadmap(self, values: dict[str, object]) -> Roadmap:
        roadmap = Roadmap(**values)
        self.session.add(roadmap)
        self.session.commit()
        return self.get_roadmap(roadmap.id) or roadmap

    def update_roadmap(self, roadmap: Roadmap, values: dict[str, object]) -> Roadmap:
        for field, value in values.items():
            setattr(roadmap, field, value)
        self.session.commit()
        return self.get_roadmap(roadmap.id) or roadmap

    def delete_roadmap(self, roadmap: Roadmap) -> None:
        self.session.delete(roadmap)
        self.session.commit()

    def get_step(self, step_id: int) -> RoadmapStep | None:
        return self.session.get(RoadmapStep, step_id)

    def list_steps(self, roadmap_id: int) -> list[RoadmapStep]:
        statement = (
            select(RoadmapStep)
            .options(selectinload(RoadmapStep.resources))
            .where(RoadmapStep.roadmap_id == roadmap_id)
            .order_by(RoadmapStep.position, RoadmapStep.id)
        )
        return list(self.session.scalars(statement).all())

    def create_step(self, values: dict[str, object]) -> RoadmapStep:
        step = RoadmapStep(**values)
        self.session.add(step)
        self.session.commit()
        self.session.refresh(step)
        return step

    def update_step(self, step: RoadmapStep, values: dict[str, object]) -> RoadmapStep:
        for field, value in values.items():
            setattr(step, field, value)
        self.session.commit()
        self.session.refresh(step)
        return step

    def delete_step(self, step: RoadmapStep) -> None:
        self.session.delete(step)
        self.session.commit()

    def reorder_steps(self, roadmap_id: int, step_ids: list[int]) -> list[RoadmapStep]:
        steps = self.list_steps(roadmap_id)
        if {step.id for step in steps} != set(step_ids) or len(step_ids) != len(steps):
            raise ValueError("Step order must include every roadmap step exactly once")
        for position, step_id in enumerate(step_ids, start=1):
            self.session.get(RoadmapStep, step_id).position = -position
        self.session.flush()
        for position, step_id in enumerate(step_ids, start=1):
            self.session.get(RoadmapStep, step_id).position = position
        self.session.commit()
        return self.list_steps(roadmap_id)

    def get_resource(self, resource_id: int) -> StepResource | None:
        return self.session.get(StepResource, resource_id)

    def list_resources(self, step_id: int) -> list[StepResource]:
        statement = select(StepResource).where(StepResource.step_id == step_id).order_by(
            StepResource.display_order, StepResource.id
        )
        return list(self.session.scalars(statement).all())

    def create_resource(self, values: dict[str, object]) -> StepResource:
        resource = StepResource(**values)
        self.session.add(resource)
        self.session.commit()
        self.session.refresh(resource)
        return resource

    def update_resource(self, resource: StepResource, values: dict[str, object]) -> StepResource:
        for field, value in values.items():
            setattr(resource, field, value)
        self.session.commit()
        self.session.refresh(resource)
        return resource

    def delete_resource(self, resource: StepResource) -> None:
        self.session.delete(resource)
        self.session.commit()

    def reorder_resources(self, step_id: int, resource_ids: list[int]) -> list[StepResource]:
        resources = self.list_resources(step_id)
        if {resource.id for resource in resources} != set(resource_ids) or len(resource_ids) != len(resources):
            raise ValueError("Resource order must include every step resource exactly once")
        for position, resource_id in enumerate(resource_ids, start=1):
            self.session.get(StepResource, resource_id).display_order = -position
        self.session.flush()
        for position, resource_id in enumerate(resource_ids, start=1):
            self.session.get(StepResource, resource_id).display_order = position
        self.session.commit()
        return self.list_resources(step_id)

    def list_student_roadmaps(self, user_id: object) -> list[Roadmap]:
        statement = (
            select(Roadmap)
            .where(
                Roadmap.is_published.is_(True),
                Roadmap.is_archived.is_(False),
                Roadmap.domain.has(Domain.is_active.is_(True)),
                Roadmap.steps.any(RoadmapStep.is_required.is_(True)),
            )
            .options(selectinload(Roadmap.domain))
            .distinct()
            .order_by(Roadmap.display_order, Roadmap.id)
        )
        return list(self.session.scalars(statement).all())

    def get_progress_records(self, user_id: object, step_ids: list[int]) -> dict[int, UserStepProgress]:
        if not step_ids:
            return {}
        records = self.session.scalars(
            select(UserStepProgress).where(
                UserStepProgress.user_id == user_id,
                UserStepProgress.step_id.in_(step_ids),
            )
        ).all()
        return {record.step_id: record for record in records}

    def get_progress_record(self, user_id: object, step_id: int) -> UserStepProgress | None:
        return self.session.scalar(
            select(UserStepProgress).where(
                UserStepProgress.user_id == user_id,
                UserStepProgress.step_id == step_id,
            )
        )

    def save_progress(self, record: UserStepProgress) -> UserStepProgress:
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record

    def count_progress(self, roadmap_id: int, user_id: object) -> tuple[int, int, int]:
        required = self.session.scalar(
            select(func.count(RoadmapStep.id)).where(
                RoadmapStep.roadmap_id == roadmap_id,
                RoadmapStep.is_required.is_(True),
            )
        ) or 0
        completed_required = self.session.scalar(
            select(func.count(RoadmapStep.id))
            .join(UserStepProgress, UserStepProgress.step_id == RoadmapStep.id)
            .where(
                RoadmapStep.roadmap_id == roadmap_id,
                RoadmapStep.is_required.is_(True),
                UserStepProgress.user_id == user_id,
                UserStepProgress.is_completed.is_(True),
            )
        ) or 0
        completed_all = self.session.scalar(
            select(func.count(UserStepProgress.id))
            .join(RoadmapStep, RoadmapStep.id == UserStepProgress.step_id)
            .where(
                RoadmapStep.roadmap_id == roadmap_id,
                UserStepProgress.user_id == user_id,
                UserStepProgress.is_completed.is_(True),
            )
        ) or 0
        return int(required), int(completed_required), int(completed_all)

    def admin_counts(self) -> dict[str, int]:
        return {
            "active_domains": int(self.session.scalar(select(func.count()).select_from(Domain).where(Domain.is_active.is_(True))) or 0),
            "total_roadmaps": int(self.session.scalar(select(func.count()).select_from(Roadmap)) or 0),
            "published_roadmaps": int(self.session.scalar(select(func.count()).select_from(Roadmap).where(Roadmap.is_published.is_(True), Roadmap.is_archived.is_(False))) or 0),
            "total_steps": int(self.session.scalar(select(func.count()).select_from(RoadmapStep)) or 0),
            "active_learning_records": int(self.session.scalar(select(func.count()).select_from(UserStepProgress).where(UserStepProgress.is_completed.is_(True))) or 0),
        }

    def list_student_roadmap_summaries(self, user_id: object) -> list[dict[str, object]]:
        result: list[dict[str, object]] = []
        started_roadmap_ids = set(
            self.session.scalars(
                select(RoadmapStep.roadmap_id)
                .join(UserStepProgress, UserStepProgress.step_id == RoadmapStep.id)
                .where(UserStepProgress.user_id == user_id)
                .distinct()
            ).all()
        )
        for roadmap in self.list_student_roadmaps(user_id):
            if roadmap.id not in started_roadmap_ids:
                continue
            required, completed, _ = self.count_progress(roadmap.id, user_id)
            result.append({
                "user_id": user_id,
                "roadmap_id": roadmap.id,
                "roadmap_title": roadmap.title,
                "domain_name": roadmap.domain.name,
                "total_required_steps": required,
                "completed_required_steps": completed,
                "progress_percentage": (completed / required * 100) if required else 0,
            })
        return result


__all__ = ["DomainRepository", "NOT_DECIDED_DOMAIN_NAME"]
