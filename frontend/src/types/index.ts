export interface User {
  id: string
  name: string
  email: string
  domain: Domain
  github_username: string | null
  created_at: string
}

export interface Domain {
  id: number
  name: string
  slug?: string
  description?: string
  is_active?: boolean
  display_order?: number
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ResourceType = 'documentation' | 'video' | 'tutorial' | 'article' | 'practice' | 'project'

export interface LearningResource {
  id: number
  step_id: number
  title: string
  url: string
  description: string
  resource_type: ResourceType
  is_recommended: boolean
  display_order: number
}

export interface RoadmapStep {
  id: number
  roadmap_id: number
  title: string
  description: string
  instructions: string
  learning_objectives: string[]
  position: number
  estimated_minutes: number
  is_required: boolean
  resources: LearningResource[]
  is_completed: boolean
}

export interface Roadmap {
  id: number
  domain_id: number
  domain: Domain
  title: string
  slug: string
  description: string
  difficulty: Difficulty
  estimated_hours: number
  display_order: number
  is_published: boolean
  is_archived: boolean
  steps?: RoadmapStep[]
}

export interface RoadmapWithProgress extends Roadmap {
  is_started: boolean
  progress_percentage: number
  completed_required_steps: number
  total_required_steps: number
}

export interface RoadmapProgress {
  roadmap_id: number
  is_started: boolean
  total_required_steps: number
  completed_required_steps: number
  completed_steps: number
  progress_percentage: number
  steps: RoadmapStep[]
}

export interface Student extends User {
  is_active: boolean
}

export interface StudentRoadmapSummary {
  user_id: string
  roadmap_id: number
  roadmap_title: string
  domain_name: string
  total_required_steps: number
  completed_required_steps: number
  progress_percentage: number
}

export interface MyRoadmapProgressSummary {
  roadmap_id: number
  roadmap_title: string
  domain_name: string
  total_required_steps: number
  completed_required_steps: number
  progress_percentage: number
}

export interface StudentDetail extends Student {
  roadmap_progress: StudentRoadmapSummary[]
}

export interface StudentPage {
  items: Student[]
  total: number
  page: number
  page_size: number
}

export interface AdminStatistics {
  total_students: number
  active_domains: number
  total_roadmaps: number
  published_roadmaps: number
  total_steps: number
  active_learning_records: number
}

export interface Admin {
  username: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  role: 'user' | 'admin'
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  domain_id?: number
}

export interface DomainPayload {
  name: string
  slug: string
  description: string
  is_active: boolean
  display_order: number
}

export interface RoadmapPayload {
  domain_id: number
  title: string
  slug: string
  description: string
  difficulty: Difficulty
  estimated_hours: number
  display_order: number
  is_published: boolean
  is_archived: boolean
}

export interface RoadmapStepPayload {
  title: string
  description: string
  instructions: string
  learning_objectives: string[]
  position: number
  estimated_minutes: number
  is_required: boolean
}

export interface ResourcePayload {
  title: string
  url: string
  description: string
  resource_type: ResourceType
  is_recommended: boolean
  display_order: number
}

export interface LoginPayload {
  identifier: string
  password: string
}
