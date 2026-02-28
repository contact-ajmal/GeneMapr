import apiClient from './client'
import type { Sample, ComparisonResult, UploadWithSampleResponse } from '../types/variant'

export const uploadVCFWithSample = async (
  file: File,
  sampleName: string,
  relationshipType?: string,
): Promise<UploadWithSampleResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('sample_name', sampleName)
  if (relationshipType) {
    formData.append('relationship_type', relationshipType)
  }

  const response = await apiClient.post<UploadWithSampleResponse>(
    '/samples/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return response.data
}

export const getSamples = async (): Promise<Sample[]> => {
  const response = await apiClient.get<Sample[]>('/samples')
  return response.data
}

export const deleteSample = async (sampleId: string): Promise<void> => {
  await apiClient.delete(`/samples/${sampleId}`)
}

export const compareSamples = async (
  sampleIds: string[],
): Promise<ComparisonResult> => {
  const response = await apiClient.get<ComparisonResult>('/samples/compare', {
    params: { sample_ids: sampleIds.join(',') },
  })
  return response.data
}
