export interface Variant {
  id: string
  chrom: string
  pos: number
  ref: string
  alt: string
  qual: number | null
  filter_status: string | null
  rs_id: string | null
  depth: number | null
  allele_freq: number | null
  normalized_variant: string
  gene_symbol: string | null
  transcript_id: string | null
  consequence: string | null
  protein_change: string | null
  clinvar_significance: string | null
  clinvar_review_status: string | null
  clinvar_condition: string | null
  gnomad_af: number | null
  gnomad_ac: number | null
  gnomad_an: number | null
  annotation_status: string
  annotated_at: string | null
  risk_score: number | null
  ai_summary: string | null
  upload_id: string
  created_at: string
}

export interface ACMGCriterionDetail {
  met: boolean
  evidence: string
  strength: string
}

export interface ACMGClassification {
  criteria_met: string[]
  criteria_details: Record<string, ACMGCriterionDetail>
  classification: string
  classification_reason: string
}

export interface PopulationFrequencies {
  overall: number | null
  african: number | null
  east_asian: number | null
  european: number | null
  latino: number | null
  south_asian: number | null
}

export interface ExternalLinks {
  clinvar: string | null
  gnomad: string | null
  ensembl: string | null
  pubmed: string | null
  uniprot: string | null
}

export interface VariantDetail extends Variant {
  acmg_criteria: ACMGClassification | null
  population_frequencies: PopulationFrequencies | null
  external_links: ExternalLinks | null
}

export interface VariantFilters {
  gene?: string
  clinvar_significance?: string
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

export interface TopGene {
  gene: string
  count: number
  max_risk: number
}

export interface DistributionItem {
  name: string
  count: number
}

// Genome View types
export interface GenomeAnnotation {
  name: string
  chr: string
  start: number
  stop: number
  risk_score: number | null
  clinvar_significance: string | null
  consequence: string | null
  gene: string | null
  allele_frequency: number | null
  variant_id: string
}

export interface ChromosomeSummary {
  count: number
  max_risk: number
  pathogenic: number
}

export interface GenomeViewData {
  annotations: GenomeAnnotation[]
  chromosome_summary: Record<string, ChromosomeSummary>
}

export interface VariantStats {
  total_variants: number
  pathogenic_count: number
  likely_pathogenic_count: number
  vus_count: number
  benign_count: number
  high_risk_count: number
  mean_risk_score: number
  mean_allele_frequency: number
  unique_genes: number
  top_genes: TopGene[]
  consequence_distribution: DistributionItem[]
  clinvar_distribution: DistributionItem[]
  risk_score_distribution: DistributionItem[]
  af_distribution: DistributionItem[]
}

// Scoring Profile types
export interface ScoringWeights {
  pathogenic: number
  likely_pathogenic: number
  vus: number
  rare_af_threshold: number
  rare_bonus: number
  ultra_rare_af_threshold: number
  ultra_rare_bonus: number
  lof_bonus: number
  missense_bonus: number
  synonymous_bonus: number
  splice_site_bonus: number
  inframe_indel_bonus: number
  custom_gene_weights: Record<string, number>
}

export interface ScoringProfile {
  id: string
  name: string
  description: string | null
  is_default: boolean
  weights: ScoringWeights
  created_at: string
}

export interface RescoreResponse {
  status: string
  variants_rescored: number
  profile_name: string
}
