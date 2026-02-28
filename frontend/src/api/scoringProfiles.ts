import apiClient from './client'
import type { ScoringProfile, ScoringWeights, RescoreResponse } from '../types/variant'

export const getScoringProfiles = async (): Promise<ScoringProfile[]> => {
  const response = await apiClient.get<ScoringProfile[]>('/scoring-profiles')
  return response.data
}

export const getScoringProfile = async (id: string): Promise<ScoringProfile> => {
  const response = await apiClient.get<ScoringProfile>(`/scoring-profiles/${id}`)
  return response.data
}

export const createScoringProfile = async (data: {
  name: string
  description?: string
  weights: ScoringWeights
}): Promise<ScoringProfile> => {
  const response = await apiClient.post<ScoringProfile>('/scoring-profiles', data)
  return response.data
}

export const updateScoringProfile = async (
  id: string,
  data: {
    name?: string
    description?: string
    weights?: ScoringWeights
  }
): Promise<ScoringProfile> => {
  const response = await apiClient.put<ScoringProfile>(`/scoring-profiles/${id}`, data)
  return response.data
}

export const deleteScoringProfile = async (id: string): Promise<void> => {
  await apiClient.delete(`/scoring-profiles/${id}`)
}

export const rescoreVariants = async (profileId: string): Promise<RescoreResponse> => {
  const response = await apiClient.post<RescoreResponse>(
    `/scoring-profiles/rescore?profile_id=${profileId}`
  )
  return response.data
}
