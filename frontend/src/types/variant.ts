export interface Variant {
  id: string
  chrom: string
  pos: number
  ref: string
  alt: string
  gene: string | null
  consequence: string | null
  clinical_significance: string | null
  allele_frequency: number | null
  risk_score: number | null
  ai_summary: string | null
  raw_annotations: Record<string, any>
  created_at: string
}

export interface VariantFilters {
  gene?: string
  clinical_significance?: string
  af_min?: number
  af_max?: number
  consequence?: string[]
  risk_score_min?: number
  risk_score_max?: number
}

export interface PaginatedVariants {
  variants: Variant[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface UploadResponse {
  message: string
  variants_parsed: number
}
