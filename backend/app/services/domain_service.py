from datetime import date, datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.domain import (
    Domain,
    Roadmap,
    RoadmapStep,
    StepResource,
    UserLearningActivity,
    UserStepProgress,
)
from app.models.user import User
from app.repositories.domain_repository import DomainRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    AdminStatistics,
    DomainUpdate,
    DomainWrite,
    LearningSummaryRead,
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
    LearningActivityRead,
    LearningAchievementRead,
    LearningRoadmapProgressRead,
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
        include_steps: bool = False,
    ) -> list[Roadmap]:
        return self.repository.list_roadmaps(
            public_only=public_only,
            domain_id=domain_id,
            difficulty=difficulty,
            include_steps=include_steps,
        )

    def list_student_resource_roadmaps(self, domain_id: int | None) -> list[Roadmap]:
        if domain_id is None or domain_id < 1:
            return []
        return self.repository.list_roadmaps(
            public_only=True,
            domain_id=domain_id,
            include_steps=True,
        )

    def get_roadmap(self, roadmap_id: int, *, public_only: bool = False) -> Roadmap:
        roadmap = self.repository.get_roadmap(roadmap_id)
        if roadmap is None or (
            public_only
            and (
                not roadmap.is_published
                or roadmap.is_archived
                or not roadmap.domain.is_active
                or not any(step.is_required for step in roadmap.steps)
            )
        ):
            raise ContentNotFoundError("Roadmap not found")
        return roadmap

    def create_roadmap(self, payload: RoadmapWrite) -> Roadmap:
        if self.repository.get_active_by_id(payload.domain_id) is None:
            raise InvalidRelationshipError("Invalid domain")
        if payload.is_published:
            raise ContentConflictError("Add at least one required step before publishing a roadmap")
        return self._commit(
            lambda: self.repository.create_roadmap(payload.model_dump()),
            "A roadmap with this slug already exists in the selected domain",
        )

    def update_roadmap(self, roadmap_id: int, payload: RoadmapUpdate) -> Roadmap:
        roadmap = self.get_roadmap(roadmap_id)
        values = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "domain_id" in values and self.repository.get_active_by_id(int(values["domain_id"])) is None:
            raise InvalidRelationshipError("Invalid domain")
        if values.get("is_published") is True and not any(
            step.is_required for step in self.repository.list_steps(roadmap_id)
        ):
            raise ContentConflictError("Add at least one required step before publishing a roadmap")
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
        has_progress = self.repository.step_progress_count(step_id) > 0
        if has_progress and target_roadmap != step.roadmap_id:
            raise ContentConflictError("A step with student progress cannot be moved to another roadmap")
        if has_progress and values.get("is_required", step.is_required) != step.is_required:
            raise ContentConflictError("A step with student progress cannot change its required status")
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

    def list_student_roadmaps(
        self,
        user_id: UUID,
        domain_id: int | None,
        difficulty: str | None = None,
    ) -> list[RoadmapWithProgress]:
        if domain_id is not None and domain_id < 1:
            return []

        roadmaps = self.repository.list_roadmaps(
            public_only=True,
            domain_id=domain_id,
            difficulty=difficulty,
            include_steps=True,
        )
        step_ids = [step.id for roadmap in roadmaps for step in roadmap.steps]
        records = self.repository.get_progress_records(user_id, step_ids)
        result: list[RoadmapWithProgress] = []
        for roadmap in roadmaps:
            progress = self._roadmap_progress_for_steps(
                roadmap, roadmap.steps, records
            )
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
                    is_started=progress.is_started,
                    progress_percentage=progress.progress_percentage,
                    completed_required_steps=progress.completed_required_steps,
                    total_required_steps=progress.total_required_steps,
                )
            )
        return result

    def get_student_roadmap_content(self, roadmap_id: int, domain_id: int | None) -> Roadmap:
        if domain_id is None or domain_id < 1:
            raise ContentNotFoundError("Roadmap not found")
        if self.repository.get_active_by_id(domain_id) is None:
            raise ContentNotFoundError("Roadmap not found")
        roadmap = self.get_roadmap(roadmap_id, public_only=True)
        return roadmap

    def get_student_roadmap(
        self, roadmap_id: int, user_id: UUID, domain_id: int | None
    ) -> RoadmapProgressRead:
        roadmap = self.get_student_roadmap_content(roadmap_id, domain_id)
        return self._roadmap_progress(roadmap, user_id)

    def start_student_roadmap(
        self, roadmap_id: int, user_id: UUID, domain_id: int | None
    ) -> RoadmapProgressRead:
        roadmap = self.get_student_roadmap_content(roadmap_id, domain_id)
        steps = self.repository.list_steps(roadmap_id)
        records = self.repository.get_progress_records(
            user_id, [step.id for step in steps]
        )
        if records:
            return self._roadmap_progress(roadmap, user_id)

        first_required_step = next((step for step in steps if step.is_required), None)
        if first_required_step is None:
            raise ContentConflictError("This roadmap has no required steps to start")

        enrollment_record = UserStepProgress(
            user_id=user_id,
            step_id=first_required_step.id,
            is_completed=False,
        )
        try:
            self.repository.save_progress(enrollment_record)
        except IntegrityError:
            self.session.rollback()
            if self.repository.get_progress_record(user_id, first_required_step.id) is None:
                raise ContentConflictError("Unable to start this roadmap; retry the request")
        return self._roadmap_progress(roadmap, user_id)

    def get_admin_roadmap_progress(self, roadmap_id: int, user_id: UUID) -> RoadmapProgressRead:
        roadmap = self.get_roadmap(roadmap_id)
        return self._roadmap_progress(roadmap, user_id)

    def set_step_progress(
        self,
        roadmap_id: int,
        step_id: int,
        user_id: UUID,
        domain_id: int | None,
        is_completed: bool,
    ) -> RoadmapProgressRead:
        roadmap = self.get_student_roadmap_content(roadmap_id, domain_id)
        step = self.repository.get_step(step_id)
        if step is None or step.roadmap_id != roadmap_id:
            raise ContentNotFoundError("Step not found in this roadmap")
        record = self.repository.get_progress_record(user_id, step_id)
        occurred_at: datetime | None = None
        if record is None:
            record = UserStepProgress(user_id=user_id, step_id=step_id, is_completed=is_completed)
            if is_completed:
                occurred_at = datetime.now(timezone.utc)
                record.completed_at = occurred_at
        else:
            if record.is_completed == is_completed:
                return self._roadmap_progress(roadmap, user_id)
            record.is_completed = is_completed
            if is_completed:
                occurred_at = datetime.now(timezone.utc)
                record.completed_at = occurred_at
            else:
                record.completed_at = None
        try:
            if occurred_at is not None:
                self.repository.save_completion_activity(record, occurred_at)
            else:
                self.repository.save_progress(record)
        except IntegrityError as error:
            self.session.rollback()
            raise ContentConflictError("Unable to save step progress; retry the request") from error
        return self._roadmap_progress(roadmap, user_id)

    @staticmethod
    def streak_totals(activity_days: set[date], today: date) -> tuple[int, int]:
        if not activity_days:
            return 0, 0
        ordered = sorted(activity_days)
        longest = 0
        run = 0
        previous: date | None = None
        for activity_day in ordered:
            run = run + 1 if previous and activity_day == previous + timedelta(days=1) else 1
            longest = max(longest, run)
            previous = activity_day

        last_activity = ordered[-1]
        if last_activity < today - timedelta(days=1):
            return 0, longest
        current = 1
        cursor = last_activity
        while cursor - timedelta(days=1) in activity_days:
            cursor -= timedelta(days=1)
            current += 1
        return current, longest

    @staticmethod
    def _streak_milestone_date(activity_days: set[date], target: int) -> date | None:
        run = 0
        previous: date | None = None
        for activity_day in sorted(activity_days):
            run = run + 1 if previous and activity_day == previous + timedelta(days=1) else 1
            if run >= target:
                return activity_day
            previous = activity_day
        return None

    def learning_summary(self, user_id: UUID) -> LearningSummaryRead:
        self.get_student(user_id)
        activity_rows = self.repository.list_learning_activities(user_id)
        legacy_rows = self.repository.list_legacy_completed_activities(user_id)
        activities: dict[tuple[int, datetime], LearningActivityRead] = {}

        for record, step_title, roadmap_id, roadmap_title in [*activity_rows, *legacy_rows]:
            occurred_at = (
                record.occurred_at
                if isinstance(record, UserLearningActivity)
                else record.completed_at
            )
            if occurred_at is None:
                continue
            if occurred_at.tzinfo is None:
                occurred_at = occurred_at.replace(tzinfo=timezone.utc)
            else:
                occurred_at = occurred_at.astimezone(timezone.utc)
            activities[(record.step_id, occurred_at)] = LearningActivityRead(
                step_id=record.step_id,
                step_title=step_title,
                roadmap_id=roadmap_id,
                roadmap_title=roadmap_title,
                occurred_at=occurred_at,
            )

        activity_days = {activity.occurred_at.date() for activity in activities.values()}
        today = datetime.now(timezone.utc).date()
        current_streak, longest_streak = self.streak_totals(activity_days, today)
        roadmap_rows = self.repository.student_learning_roadmaps(user_id)
        activity_dates_by_roadmap = self.repository.student_activity_dates_by_roadmap(user_id)
        legacy_dates_by_roadmap = self.repository.student_legacy_activity_dates_by_roadmap(user_id)
        roadmap_progress: list[LearningRoadmapProgressRead] = []
        for roadmap_id, title, domain_name, difficulty, required, completed in roadmap_rows:
            last_activity = activity_dates_by_roadmap.get(roadmap_id) or legacy_dates_by_roadmap.get(roadmap_id)
            if last_activity is not None and last_activity.tzinfo is None:
                last_activity = last_activity.replace(tzinfo=timezone.utc)
            percentage = round(completed / required * 100, 2) if required else 0
            roadmap_progress.append(
                LearningRoadmapProgressRead(
                    roadmap_id=roadmap_id,
                    roadmap_title=title,
                    domain_name=domain_name,
                    difficulty=difficulty,
                    completed_required_steps=completed,
                    total_required_steps=required,
                    progress_percentage=percentage,
                    last_activity_at=last_activity,
                )
            )

        required_total = sum(item.total_required_steps for item in roadmap_progress)
        required_completed = sum(item.completed_required_steps for item in roadmap_progress)
        completed_roadmaps = [
            item for item in roadmap_progress
            if item.total_required_steps > 0 and item.progress_percentage >= 100
        ]
        achievements: list[LearningAchievementRead] = []
        first_activity_at = min(
            (activity.occurred_at for activity in activities.values()), default=None
        )
        if first_activity_at is not None:
            achievements.append(LearningAchievementRead(
                key="first-lesson",
                name="First lesson",
                description="Completed your first learning lesson.",
                earned_at=first_activity_at.date(),
            ))
        for streak_length, key, label in (
            (3, "three-day-streak", "Three-day streak"),
            (7, "seven-day-streak", "Seven-day streak"),
        ):
            milestone_date = self._streak_milestone_date(activity_days, streak_length)
            if milestone_date is not None:
                achievements.append(LearningAchievementRead(
                    key=key,
                    name=label,
                    description=f"Learned on {streak_length} consecutive days.",
                    earned_at=milestone_date,
                ))
        completed_roadmap_dates = [
            item.last_activity_at.date()
            for item in completed_roadmaps
            if item.last_activity_at is not None
        ]
        if completed_roadmap_dates:
            achievements.append(LearningAchievementRead(
                key="first-roadmap-completed",
                name="First roadmap completed",
                description="Completed all required lessons in a roadmap.",
                earned_at=min(completed_roadmap_dates),
            ))

        recent_activity = sorted(
            activities.values(), key=lambda activity: activity.occurred_at, reverse=True
        )[:25]
        last_activity_at = recent_activity[0].occurred_at if recent_activity else None
        return LearningSummaryRead(
            current_streak=current_streak,
            longest_streak=longest_streak,
            has_activity_today=today in activity_days,
            last_activity_at=last_activity_at,
            active_days=len(activity_days),
            activity_dates=sorted(day for day in activity_days if day >= today - timedelta(days=89)),
            recent_activity=recent_activity,
            achievements=achievements,
            roadmaps_started=len(roadmap_progress),
            roadmaps_completed=len(completed_roadmaps),
            lessons_completed=len({step_id for step_id, _ in activities}),
            required_steps_completed=required_completed,
            required_steps_total=required_total,
            overall_progress=round(required_completed / required_total * 100, 2) if required_total else 0,
            roadmaps=roadmap_progress,
        )

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
        return self._roadmap_progress_for_steps(roadmap, steps, records)

    def _roadmap_progress_for_steps(
        self,
        roadmap: Roadmap,
        steps: list[RoadmapStep],
        records: dict[int, UserStepProgress],
    ) -> RoadmapProgressRead:
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
            is_started=any(step.id in records for step in steps),
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
