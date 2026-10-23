import apiClient from './client'
import { adminApiClient } from './client'
import type {
  Admin,
  AdminStatistics,
  DomainPayload,
  Domain,
  LoginPayload,
  LearningResource,
  ResourcePayload,
  Roadmap,
  RoadmapPayload,
  RoadmapProgress,
  RoadmapStep,
  RoadmapStepPayload,
  RoadmapWithProgress,
  SignupPayload,
  Student,
  StudentDetail,
  StudentPage,
  TokenResponse,
  User,
} from '../types'

export const signup = async (payload: SignupPayload): Promise<User> => {
  const response = await apiClient.post<User>('/auth/signup', payload)
  return response.data
}

export const login = async (payload: LoginPayload): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/auth/login', payload)
  return response.data
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me')
  return response.data
}

export const getDomains = async (): Promise<Domain[]> => {
  const response = await apiClient.get<Domain[]>('/domains')
  return response.data
}

export const updateMyDomain = async (domainId: number): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me/domain', {
    domain_id: domainId,
  })
  return response.data
}

export const getAdminMe = async (): Promise<Admin> => {
  const response = await adminApiClient.get<Admin>('/admin/me')
  return response.data
}

export const getRoadmaps = async (filters?: { difficulty?: string }): Promise<RoadmapWithProgress[]> => {
  const response = await apiClient.get<RoadmapWithProgress[]>('/roadmaps', { params: filters })
  return response.data
}

export const getRoadmap = async (roadmapId: number): Promise<Roadmap> => {
  const response = await apiClient.get<Roadmap>(`/roadmaps/${roadmapId}`)
  return response.data
}

export const getRoadmapProgress = async (roadmapId: number): Promise<RoadmapProgress> => {
  const response = await apiClient.get<RoadmapProgress>(`/roadmaps/${roadmapId}/progress`)
  return response.data
}

export const startRoadmap = async (roadmapId: number): Promise<RoadmapProgress> => {
  const response = await apiClient.post<RoadmapProgress>(`/roadmaps/${roadmapId}/start`)
  return response.data
}

export const setStepProgress = async (
  roadmapId: number,
  stepId: number,
  isCompleted: boolean,
): Promise<RoadmapProgress> => {
  const response = await apiClient.put<RoadmapProgress>(
    `/roadmaps/${roadmapId}/steps/${stepId}/progress`,
    { is_completed: isCompleted },
  )
  return response.data
}

export const getAdminStatistics = async (): Promise<AdminStatistics> => {
  const response = await adminApiClient.get<AdminStatistics>('/admin/statistics')
  return response.data
}

export const getAdminDomains = async (): Promise<Domain[]> => {
  const response = await adminApiClient.get<Domain[]>('/admin/domains')
  return response.data
}

export const createAdminDomain = async (payload: DomainPayload): Promise<Domain> => {
  const response = await adminApiClient.post<Domain>('/admin/domains', payload)
  return response.data
}

export const updateAdminDomain = async (
  domainId: number,
  payload: Partial<DomainPayload>,
): Promise<Domain> => {
  const response = await adminApiClient.patch<Domain>(`/admin/domains/${domainId}`, payload)
  return response.data
}

export const deleteAdminDomain = async (domainId: number): Promise<void> => {
  await adminApiClient.delete(`/admin/domains/${domainId}`)
}

export const getAdminRoadmaps = async (): Promise<Roadmap[]> => {
  const response = await adminApiClient.get<Roadmap[]>('/admin/roadmaps')
  return response.data
}

export const getAdminRoadmapPreview = async (roadmapId: number): Promise<Roadmap> => {
  const response = await adminApiClient.get<Roadmap>(`/admin/roadmaps/${roadmapId}/preview`)
  return response.data
}

export const createAdminRoadmap = async (payload: RoadmapPayload): Promise<Roadmap> => {
  const response = await adminApiClient.post<Roadmap>('/admin/roadmaps', payload)
  return response.data
}

export const updateAdminRoadmap = async (
  roadmapId: number,
  payload: Partial<RoadmapPayload>,
): Promise<Roadmap> => {
  const response = await adminApiClient.patch<Roadmap>(`/admin/roadmaps/${roadmapId}`, payload)
  return response.data
}

export const deleteAdminRoadmap = async (roadmapId: number): Promise<void> => {
  await adminApiClient.delete(`/admin/roadmaps/${roadmapId}`)
}

export const createAdminStep = async (
  roadmapId: number,
  payload: RoadmapStepPayload,
): Promise<RoadmapStep> => {
  const response = await adminApiClient.post<RoadmapStep>(
    `/admin/roadmaps/${roadmapId}/steps`,
    payload,
  )
  return response.data
}

export const updateAdminStep = async (
  stepId: number,
  payload: Partial<RoadmapStepPayload> & { roadmap_id?: number },
): Promise<RoadmapStep> => {
  const response = await adminApiClient.patch<RoadmapStep>(`/admin/steps/${stepId}`, payload)
  return response.data
}

export const deleteAdminStep = async (stepId: number): Promise<void> => {
  await adminApiClient.delete(`/admin/steps/${stepId}`)
}

export const reorderAdminSteps = async (roadmapId: number, stepIds: number[]): Promise<RoadmapStep[]> => {
  const response = await adminApiClient.put<RoadmapStep[]>(
    `/admin/roadmaps/${roadmapId}/steps/reorder`,
    { step_ids: stepIds },
  )
  return response.data
}

export const createAdminResource = async (
  stepId: number,
  payload: ResourcePayload,
): Promise<LearningResource> => {
  const response = await adminApiClient.post<LearningResource>(
    `/admin/steps/${stepId}/resources`,
    payload,
  )
  return response.data
}

export const updateAdminResource = async (
  resourceId: number,
  payload: Partial<ResourcePayload>,
): Promise<LearningResource> => {
  const response = await adminApiClient.patch<LearningResource>(
    `/admin/resources/${resourceId}`,
    payload,
  )
  return response.data
}

export const deleteAdminResource = async (resourceId: number): Promise<void> => {
  await adminApiClient.delete(`/admin/resources/${resourceId}`)
}

export const reorderAdminResources = async (
  stepId: number,
  resourceIds: number[],
): Promise<LearningResource[]> => {
  const response = await adminApiClient.put<LearningResource[]>(
    `/admin/steps/${stepId}/resources/reorder`,
    { resource_ids: resourceIds },
  )
  return response.data
}

export const getAdminStudents = async (
  search = '',
  page = 1,
  pageSize = 20,
): Promise<StudentPage> => {
  const response = await adminApiClient.get<StudentPage>('/admin/students', {
    params: { search: search || undefined, page, page_size: pageSize },
  })
  return response.data
}

export const getAdminStudent = async (userId: string): Promise<StudentDetail> => {
  const response = await adminApiClient.get<StudentDetail>(`/admin/students/${userId}`)
  return response.data
}

export const updateAdminStudent = async (
  userId: string,
  payload: { name?: string; domain_id?: number; is_active?: boolean },
): Promise<Student> => {
  const response = await adminApiClient.patch<Student>(`/admin/students/${userId}`, payload)
  return response.data
}
