from datetime import datetime
from typing import Annotated
from typing import Literal
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, EmailStr, Field, field_validator


class DomainRead(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DomainDetailRead(DomainRead):
    description: str
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
    roadmaps: list["RoadmapRead"] = Field(default_factory=list)


class DomainAdminRead(DomainRead):
    slug: str
    description: str
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime


class DomainWrite(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=140, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = Field(default="", max_length=4000)
    is_active: bool = True
    display_order: int = Field(default=0, ge=0)


class DomainUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(default=None, min_length=2, max_length=140, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=4000)
    is_active: bool | None = None
    display_order: int | None = Field(default=None, ge=0)


class RoadmapStepWrite(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(default="", max_length=8000)
    instructions: str = Field(default="", max_length=12000)
    learning_objectives: list[str] = Field(default_factory=list, max_length=30)
    position: int = Field(ge=1)
    estimated_minutes: int = Field(default=0, ge=0, le=100000)
    is_required: bool = True


class RoadmapStepUpdate(BaseModel):
    roadmap_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=8000)
    instructions: str | None = Field(default=None, max_length=12000)
    learning_objectives: list[str] | None = Field(default=None, max_length=30)
    position: int | None = Field(default=None, ge=1)
    estimated_minutes: int | None = Field(default=None, ge=0, le=100000)
    is_required: bool | None = None


class RoadmapStepRead(BaseModel):
    id: int
    roadmap_id: int
    title: str
    description: str
    instructions: str
    learning_objectives: list[str]
    position: int
    estimated_minutes: int
    is_required: bool

    model_config = ConfigDict(from_attributes=True)


class ResourceWrite(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    url: AnyHttpUrl
    description: str = Field(default="", max_length=4000)
    resource_type: Literal["documentation", "video", "tutorial", "article", "practice"]
    is_recommended: bool = False
    display_order: int = Field(default=0, ge=0)


class ResourceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    url: AnyHttpUrl | None = None
    description: str | None = Field(default=None, max_length=4000)
    resource_type: Literal["documentation", "video", "tutorial", "article", "practice"] | None = None
    is_recommended: bool | None = None
    display_order: int | None = Field(default=None, ge=0)


class ResourceRead(BaseModel):
    id: int
    step_id: int
    title: str
    url: str
    description: str
    resource_type: str
    is_recommended: bool
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class RoadmapWrite(BaseModel):
    domain_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=180)
    slug: str = Field(min_length=2, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = Field(default="", max_length=8000)
    difficulty: Literal["beginner", "intermediate", "advanced"]
    estimated_hours: float = Field(default=0, ge=0, le=100000)
    display_order: int = Field(default=0, ge=0)
    is_published: bool = False
    is_archived: bool = False


class RoadmapUpdate(BaseModel):
    domain_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, min_length=1, max_length=180)
    slug: str | None = Field(default=None, min_length=2, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=8000)
    difficulty: Literal["beginner", "intermediate", "advanced"] | None = None
    estimated_hours: float | None = Field(default=None, ge=0, le=100000)
    display_order: int | None = Field(default=None, ge=0)
    is_published: bool | None = None
    is_archived: bool | None = None


class RoadmapRead(BaseModel):
    id: int
    domain_id: int
    domain: DomainRead
    title: str
    slug: str
    description: str
    difficulty: str
    estimated_hours: float
    display_order: int
    is_published: bool
    is_archived: bool
    steps: list["RoadmapStepDetailRead"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class RoadmapStepDetailRead(RoadmapStepRead):
    resources: list[ResourceRead] = Field(default_factory=list)
    is_completed: bool = False


class ProgressUpdate(BaseModel):
    is_completed: bool


class StepOrder(BaseModel):
    step_ids: list[int] = Field(min_length=1)


class ResourceOrder(BaseModel):
    resource_ids: list[int] = Field(min_length=1)


class RoadmapWithProgress(BaseModel):
    id: int
    domain_id: int
    domain: DomainRead
    title: str
    slug: str
    description: str
    difficulty: str
    estimated_hours: float
    display_order: int
    is_published: bool
    is_archived: bool
    progress_percentage: float
    completed_required_steps: int
    total_required_steps: int


class ProgressSummary(BaseModel):
    roadmap_id: int
    total_required_steps: int
    completed_required_steps: int
    completed_steps: int
    progress_percentage: float


class RoadmapProgressRead(ProgressSummary):
    steps: list[RoadmapStepDetailRead]


class StudentRead(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    domain: DomainRead
    github_username: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    domain_id: int | None = Field(default=None, gt=0)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def normalize_optional_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Name cannot be blank")
        return normalized


class StudentPage(BaseModel):
    items: list[StudentRead]
    total: int
    page: int
    page_size: int


class RoadmapStatistics(ProgressSummary):
    pass


class StudentRoadmapSummary(BaseModel):
    user_id: UUID
    roadmap_id: int
    roadmap_title: str
    total_required_steps: int
    completed_required_steps: int
    progress_percentage: float


class StudentDetailRead(StudentRead):
    roadmap_progress: list[StudentRoadmapSummary]


class AdminStatistics(BaseModel):
    total_students: int
    active_domains: int
    total_roadmaps: int
    published_roadmaps: int
    total_steps: int
    active_learning_records: int


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    domain_id: int | None = Field(default=None, gt=0)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Name cannot be blank")
        return normalized


class UserRead(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    domain: DomainRead
    github_username: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


RoadmapRead.model_rebuild()
DomainDetailRead.model_rebuild()

class UserDomainUpdate(BaseModel):
    domain_id: Annotated[int, Field(gt=0)]
