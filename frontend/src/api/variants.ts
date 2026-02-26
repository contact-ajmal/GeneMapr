import apiClient from './client'
import type { Variant, PaginatedVariants, VariantFilters, UploadResponse } from '../types/variant'

export const uploadVCF = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<UploadResponse>('/variants/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const getVariants = async (
  page: number = 1,
  pageSize: number = 50,
  filters?: VariantFilters
): Promise<PaginatedVariants> => {
  const params: Record<string, any> = {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  }

  if (filters) {
    if (filters.gene) params.gene = filters.gene
    if (filters.clinical_significance) params.clinical_significance = filters.clinical_significance
    if (filters.af_min !== undefined) params.af_min = filters.af_min
    if (filters.af_max !== undefined) params.af_max = filters.af_max
    if (filters.consequence && filters.consequence.length > 0) {
      params.consequence = filters.consequence.join(',')
    }
    if (filters.risk_score_min !== undefined) params.risk_score_min = filters.risk_score_min
    if (filters.risk_score_max !== undefined) params.risk_score_max = filters.risk_score_max
  }

  const response = await apiClient.get<Variant[]>('/variants/', { params })

  // Since the backend returns an array, we need to construct pagination info
  // Adjust this based on your actual backend response structure
  return {
    variants: response.data,
    total: response.data.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(response.data.length / pageSize),
  }
}

export const exportVariantsCSV = async (filters?: VariantFilters): Promise<Blob> => {
  const params: Record<string, any> = {}

  if (filters) {
    if (filters.gene) params.gene = filters.gene
    if (filters.clinical_significance) params.clinical_significance = filters.clinical_significance
    if (filters.af_min !== undefined) params.af_min = filters.af_min
    if (filters.af_max !== undefined) params.af_max = filters.af_max
    if (filters.consequence && filters.consequence.length > 0) {
      params.consequence = filters.consequence.join(',')
    }
    if (filters.risk_score_min !== undefined) params.risk_score_min = filters.risk_score_min
    if (filters.risk_score_max !== undefined) params.risk_score_max = filters.risk_score_max
  }

  const response = await apiClient.get('/variants/export', {
    params,
    responseType: 'blob',
  })

  return response.data
}
