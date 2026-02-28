from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.schemas.variant import VariantResponse


class SampleCreate(BaseModel):
    name: str
    relationship_type: str | None = None


class SampleResponse(BaseModel):
    id: UUID
    name: str
    filename: str
    relationship_type: str | None = None
    upload_id: str
    created_at: datetime
    variant_count: int = 0

    model_config = {"from_attributes": True}


class SampleStats(BaseModel):
    sample_id: str
    name: str
    total: int
    pathogenic_count: int
    likely_pathogenic_count: int
    vus_count: int
    mean_risk: float


class SharedVariant(BaseModel):
    variant: VariantResponse
    present_in: list[str]  # sample_ids


class InheritancePattern(BaseModel):
    variant_id: str
    gene: str | None
    chrom: str
    pos: int
    ref: str
    alt: str
    clinvar_significance: str | None
    risk_score: int | None
    proband: bool
    mother: bool
    father: bool
    inheritance: str  # de_novo, maternal, paternal, biparental, unknown


class CompoundHet(BaseModel):
    gene: str
    variant_a: VariantResponse
    variant_b: VariantResponse
    source_a: str  # maternal or paternal
    source_b: str


class ComparisonResponse(BaseModel):
    shared_variants: list[SharedVariant]
    unique_variants: dict[str, list[VariantResponse]]  # sample_id -> variants
    sample_stats: list[SampleStats]
    inheritance_patterns: list[InheritancePattern]
    compound_hets: list[CompoundHet]
    ai_summary: str | None = None


class UploadWithSampleResponse(BaseModel):
    status: str
    variant_count: int
    upload_id: str
    sample_id: str
    sample_name: str
    message: str
