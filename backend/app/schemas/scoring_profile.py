from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class ScoringWeights(BaseModel):
    pathogenic: float = Field(default=5, ge=0, le=20)
    likely_pathogenic: float = Field(default=4, ge=0, le=20)
    vus: float = Field(default=1, ge=0, le=20)
    rare_af_threshold: float = Field(default=0.01, ge=0, le=1)
    rare_bonus: float = Field(default=3, ge=0, le=20)
    ultra_rare_af_threshold: float = Field(default=0.001, ge=0, le=1)
    ultra_rare_bonus: float = Field(default=1, ge=0, le=20)
    lof_bonus: float = Field(default=4, ge=0, le=20)
    missense_bonus: float = Field(default=2, ge=0, le=20)
    synonymous_bonus: float = Field(default=0, ge=0, le=20)
    splice_site_bonus: float = Field(default=3, ge=0, le=20)
    inframe_indel_bonus: float = Field(default=1, ge=0, le=20)
    custom_gene_weights: dict[str, float] = Field(default_factory=dict)


class ScoringProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    weights: ScoringWeights


class ScoringProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    weights: ScoringWeights | None = None


class ScoringProfileResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    is_default: bool
    weights: ScoringWeights
    created_at: datetime

    model_config = {"from_attributes": True}


class RescoreRequest(BaseModel):
    profile_id: UUID


class RescoreResponse(BaseModel):
    status: str
    variants_rescored: int
    profile_name: str
