"""
Variant risk scoring service.

Implements scoring rules based on clinical significance, allele frequency,
and functional consequence to generate a risk score for each variant.
Supports customizable scoring profiles for different clinical contexts.
"""
from typing import Optional
from app.models.variant import Variant


# Loss-of-function consequences
LOF_CONSEQUENCES = {
    "stop_gained",
    "frameshift_variant",
    "splice_acceptor_variant",
    "splice_donor_variant",
    "start_lost",
    "stop_lost",
    "transcript_ablation"
}

# Splice-site consequences (subset that gets separate weight)
SPLICE_SITE_CONSEQUENCES = {
    "splice_acceptor_variant",
    "splice_donor_variant",
    "splice_region_variant",
}

# Missense and moderate impact consequences
MISSENSE_CONSEQUENCES = {
    "missense_variant",
    "protein_altering_variant",
}

# Inframe indel consequences
INFRAME_INDEL_CONSEQUENCES = {
    "inframe_deletion",
    "inframe_insertion",
}

# Default weights matching the original hardcoded scoring
DEFAULT_WEIGHTS = {
    "pathogenic": 5,
    "likely_pathogenic": 4,
    "vus": 1,
    "rare_af_threshold": 0.01,
    "rare_bonus": 3,
    "ultra_rare_af_threshold": 0.001,
    "ultra_rare_bonus": 1,
    "lof_bonus": 4,
    "missense_bonus": 2,
    "synonymous_bonus": 0,
    "splice_site_bonus": 3,
    "inframe_indel_bonus": 1,
    "custom_gene_weights": {},
}


def calculate_variant_score(variant: Variant, weights: dict | None = None) -> int:
    """
    Calculate risk score for a variant based on annotation data and a scoring profile.

    Args:
        variant: The variant to score
        weights: Optional dict of scoring weights. Uses DEFAULT_WEIGHTS if None.

    Returns:
        Integer risk score
    """
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    score = 0.0

    # ClinVar significance scoring
    if variant.clinvar_significance:
        sig_lower = variant.clinvar_significance.lower()
        if "pathogenic" in sig_lower:
            if "likely" in sig_lower or "probable" in sig_lower:
                score += w["likely_pathogenic"]
            else:
                score += w["pathogenic"]
        elif "uncertain" in sig_lower:
            score += w["vus"]

    # Allele frequency scoring (rare variants)
    af = variant.gnomad_af if variant.gnomad_af is not None else variant.allele_freq
    if af is not None:
        if af < w["ultra_rare_af_threshold"]:
            score += w["rare_bonus"] + w["ultra_rare_bonus"]
        elif af < w["rare_af_threshold"]:
            score += w["rare_bonus"]

    # Consequence scoring
    if variant.consequence:
        consequence_lower = variant.consequence.lower()

        # Check for splice site first (more specific)
        if any(sp in consequence_lower for sp in SPLICE_SITE_CONSEQUENCES):
            score += w["splice_site_bonus"]
        # Check for loss-of-function (excluding splice since already counted)
        elif any(lof in consequence_lower for lof in LOF_CONSEQUENCES):
            score += w["lof_bonus"]
        # Check for inframe indels
        elif any(ind in consequence_lower for ind in INFRAME_INDEL_CONSEQUENCES):
            score += w["inframe_indel_bonus"]
        # Check for missense
        elif any(mis in consequence_lower for mis in MISSENSE_CONSEQUENCES):
            score += w["missense_bonus"]
        # Synonymous
        elif "synonymous" in consequence_lower:
            score += w["synonymous_bonus"]

    # Apply custom gene weight multiplier
    custom_gene_weights = w.get("custom_gene_weights", {})
    if variant.gene_symbol and custom_gene_weights:
        gene_multiplier = custom_gene_weights.get(variant.gene_symbol, 1.0)
        score *= gene_multiplier

    return max(0, round(score))


def score_variant(variant: Variant, weights: dict | None = None) -> None:
    """
    Calculate and update the risk score for a variant.

    Modifies the variant object in-place, setting the risk_score field.

    Args:
        variant: The variant to score (will be modified in-place)
        weights: Optional dict of scoring weights from a ScoringProfile
    """
    variant.risk_score = calculate_variant_score(variant, weights)
