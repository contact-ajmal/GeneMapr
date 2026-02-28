"""
Multi-sample variant comparison service.

Compares variants across samples to identify shared/unique variants,
inheritance patterns (for trios), and compound heterozygotes.
"""

import logging
from collections import defaultdict
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.variant import Variant
from app.models.sample import Sample
from app.schemas.variant import VariantResponse
from app.schemas.sample import (
    SampleStats,
    SharedVariant,
    InheritancePattern,
    CompoundHet,
    ComparisonResponse,
)
from app.services.ai_summary_service import call_llm

logger = logging.getLogger(__name__)


async def compare_samples(
    sample_ids: list[UUID],
    db: AsyncSession,
) -> ComparisonResponse:
    """
    Compare variants across multiple samples.

    Args:
        sample_ids: List of sample UUIDs to compare
        db: Database session

    Returns:
        ComparisonResponse with shared/unique variants, inheritance, and stats
    """
    # Load samples
    samples_result = await db.execute(
        select(Sample).where(Sample.id.in_(sample_ids))
    )
    samples = {s.id: s for s in samples_result.scalars().all()}

    if len(samples) < 2:
        raise ValueError("At least 2 samples required for comparison")

    # Load all variants for the selected samples
    variants_result = await db.execute(
        select(Variant)
        .where(Variant.sample_id.in_(sample_ids))
        .where(Variant.annotation_status == "completed")
    )
    all_variants = variants_result.scalars().all()

    # Group variants by normalized key (chr:pos:ref:alt) for matching
    variant_map: dict[str, dict[UUID, Variant]] = defaultdict(dict)
    for v in all_variants:
        key = f"{v.chrom}:{v.pos}:{v.ref}:{v.alt}"
        variant_map[key][v.sample_id] = v

    # Classify shared vs unique
    shared_variants: list[SharedVariant] = []
    unique_variants: dict[str, list[VariantResponse]] = {
        str(sid): [] for sid in sample_ids
    }

    for key, sample_variants in variant_map.items():
        if len(sample_variants) > 1:
            # Shared: pick the first variant as representative
            representative = next(iter(sample_variants.values()))
            shared_variants.append(
                SharedVariant(
                    variant=VariantResponse.model_validate(representative),
                    present_in=[str(sid) for sid in sample_variants.keys()],
                )
            )
        else:
            # Unique to one sample
            sid, variant = next(iter(sample_variants.items()))
            unique_variants[str(sid)].append(
                VariantResponse.model_validate(variant)
            )

    # Sort shared variants by risk score descending
    shared_variants.sort(
        key=lambda sv: sv.variant.risk_score or 0, reverse=True
    )

    # Sort unique variants by risk score descending
    for sid in unique_variants:
        unique_variants[sid].sort(
            key=lambda v: v.risk_score or 0, reverse=True
        )

    # Sample statistics
    sample_stats = await _compute_sample_stats(sample_ids, samples, db)

    # Inheritance analysis (if trio detected)
    inheritance_patterns = _analyze_inheritance(
        variant_map, samples, sample_ids
    )

    # Compound heterozygote detection
    compound_hets = _detect_compound_hets(
        variant_map, samples, sample_ids
    )

    # AI comparison summary
    ai_summary = await _generate_comparison_summary(
        samples, sample_stats, shared_variants, inheritance_patterns, compound_hets
    )

    return ComparisonResponse(
        shared_variants=shared_variants,
        unique_variants=unique_variants,
        sample_stats=sample_stats,
        inheritance_patterns=inheritance_patterns,
        compound_hets=compound_hets,
        ai_summary=ai_summary,
    )


async def _compute_sample_stats(
    sample_ids: list[UUID],
    samples: dict[UUID, Sample],
    db: AsyncSession,
) -> list[SampleStats]:
    """Compute per-sample statistics."""
    stats = []
    for sid in sample_ids:
        sample = samples.get(sid)
        if not sample:
            continue

        total_result = await db.execute(
            select(func.count()).select_from(Variant).where(Variant.sample_id == sid)
        )
        total = total_result.scalar_one()

        pathogenic_result = await db.execute(
            select(func.count())
            .select_from(Variant)
            .where(Variant.sample_id == sid)
            .where(Variant.clinvar_significance.ilike("%pathogenic%"))
            .where(~Variant.clinvar_significance.ilike("%likely%"))
        )
        pathogenic_count = pathogenic_result.scalar_one()

        lp_result = await db.execute(
            select(func.count())
            .select_from(Variant)
            .where(Variant.sample_id == sid)
            .where(Variant.clinvar_significance.ilike("%likely pathogenic%"))
        )
        lp_count = lp_result.scalar_one()

        vus_result = await db.execute(
            select(func.count())
            .select_from(Variant)
            .where(Variant.sample_id == sid)
            .where(Variant.clinvar_significance.ilike("%uncertain%"))
        )
        vus_count = vus_result.scalar_one()

        mean_result = await db.execute(
            select(func.avg(Variant.risk_score))
            .where(Variant.sample_id == sid)
            .where(Variant.risk_score.isnot(None))
        )
        mean_risk = float(mean_result.scalar_one() or 0.0)

        stats.append(
            SampleStats(
                sample_id=str(sid),
                name=sample.name,
                total=total,
                pathogenic_count=pathogenic_count,
                likely_pathogenic_count=lp_count,
                vus_count=vus_count,
                mean_risk=round(mean_risk, 2),
            )
        )
    return stats


def _find_role(
    samples: dict[UUID, Sample], sample_ids: list[UUID], role: str
) -> UUID | None:
    """Find a sample with a given relationship type."""
    for sid in sample_ids:
        s = samples.get(sid)
        if s and s.relationship_type == role:
            return sid
    return None


def _analyze_inheritance(
    variant_map: dict[str, dict[UUID, Variant]],
    samples: dict[UUID, Sample],
    sample_ids: list[UUID],
) -> list[InheritancePattern]:
    """
    Analyze inheritance patterns for trio data.
    Requires proband + at least one parent.
    """
    proband_id = _find_role(samples, sample_ids, "proband")
    mother_id = _find_role(samples, sample_ids, "mother")
    father_id = _find_role(samples, sample_ids, "father")

    if not proband_id:
        return []

    has_mother = mother_id is not None
    has_father = father_id is not None

    if not has_mother and not has_father:
        return []

    patterns = []
    for key, sample_variants in variant_map.items():
        in_proband = proband_id in sample_variants
        in_mother = mother_id in sample_variants if has_mother else False
        in_father = father_id in sample_variants if has_father else False

        if not in_proband:
            continue

        variant = sample_variants[proband_id]

        # Determine inheritance
        if has_mother and has_father:
            if not in_mother and not in_father:
                inheritance = "de_novo"
            elif in_mother and not in_father:
                inheritance = "maternal"
            elif not in_mother and in_father:
                inheritance = "paternal"
            elif in_mother and in_father:
                inheritance = "biparental"
            else:
                inheritance = "unknown"
        elif has_mother:
            if in_mother:
                inheritance = "maternal"
            else:
                inheritance = "de_novo_or_paternal"
        else:  # has_father
            if in_father:
                inheritance = "paternal"
            else:
                inheritance = "de_novo_or_maternal"

        patterns.append(
            InheritancePattern(
                variant_id=str(variant.id),
                gene=variant.gene_symbol,
                chrom=variant.chrom,
                pos=variant.pos,
                ref=variant.ref,
                alt=variant.alt,
                clinvar_significance=variant.clinvar_significance,
                risk_score=variant.risk_score,
                proband=in_proband,
                mother=in_mother,
                father=in_father,
                inheritance=inheritance,
            )
        )

    # Sort: de novo first, then by risk score
    inheritance_order = {
        "de_novo": 0,
        "de_novo_or_paternal": 1,
        "de_novo_or_maternal": 1,
        "maternal": 2,
        "paternal": 3,
        "biparental": 4,
        "unknown": 5,
    }
    patterns.sort(
        key=lambda p: (inheritance_order.get(p.inheritance, 9), -(p.risk_score or 0))
    )
    return patterns


def _detect_compound_hets(
    variant_map: dict[str, dict[UUID, Variant]],
    samples: dict[UUID, Sample],
    sample_ids: list[UUID],
) -> list[CompoundHet]:
    """
    Detect compound heterozygote candidates in trio data.

    Compound het: two variants in the same gene in proband,
    one inherited from each parent.
    """
    proband_id = _find_role(samples, sample_ids, "proband")
    mother_id = _find_role(samples, sample_ids, "mother")
    father_id = _find_role(samples, sample_ids, "father")

    if not proband_id or not mother_id or not father_id:
        return []

    # Group proband variants by gene, track parental origin
    gene_variants: dict[str, list[tuple[Variant, str]]] = defaultdict(list)

    for key, sample_variants in variant_map.items():
        if proband_id not in sample_variants:
            continue
        variant = sample_variants[proband_id]
        gene = variant.gene_symbol
        if not gene:
            continue

        in_mother = mother_id in sample_variants
        in_father = father_id in sample_variants

        if in_mother and not in_father:
            gene_variants[gene].append((variant, "maternal"))
        elif in_father and not in_mother:
            gene_variants[gene].append((variant, "paternal"))

    # Find genes with variants from both parents
    compound_hets = []
    for gene, variants_with_origin in gene_variants.items():
        maternal = [(v, o) for v, o in variants_with_origin if o == "maternal"]
        paternal = [(v, o) for v, o in variants_with_origin if o == "paternal"]

        if maternal and paternal:
            # Report all combinations
            for m_var, _ in maternal:
                for p_var, _ in paternal:
                    compound_hets.append(
                        CompoundHet(
                            gene=gene,
                            variant_a=VariantResponse.model_validate(m_var),
                            variant_b=VariantResponse.model_validate(p_var),
                            source_a="maternal",
                            source_b="paternal",
                        )
                    )
    return compound_hets


async def _generate_comparison_summary(
    samples: dict[UUID, Sample],
    sample_stats: list[SampleStats],
    shared_variants: list[SharedVariant],
    inheritance_patterns: list[InheritancePattern],
    compound_hets: list[CompoundHet],
) -> str | None:
    """Generate AI summary of the comparison results."""
    # Build context for the LLM
    parts = ["Multi-sample genomic variant comparison results:\n"]

    # Sample info
    parts.append("Samples analyzed:")
    for s in sample_stats:
        parts.append(
            f"  - {s.name}: {s.total} variants, "
            f"{s.pathogenic_count} pathogenic, "
            f"{s.vus_count} VUS, "
            f"mean risk {s.mean_risk}"
        )

    parts.append(f"\nShared variants: {len(shared_variants)}")

    # Top shared pathogenic variants
    pathogenic_shared = [
        sv
        for sv in shared_variants
        if sv.variant.clinvar_significance
        and "pathogenic" in sv.variant.clinvar_significance.lower()
    ]
    if pathogenic_shared:
        parts.append(f"Shared pathogenic variants: {len(pathogenic_shared)}")
        for sv in pathogenic_shared[:5]:
            v = sv.variant
            parts.append(
                f"  - {v.gene_symbol or 'Unknown'} {v.chrom}:{v.pos} "
                f"({v.clinvar_significance}) risk={v.risk_score}"
            )

    # Inheritance
    de_novo = [p for p in inheritance_patterns if p.inheritance == "de_novo"]
    if de_novo:
        parts.append(f"\nDe novo variants: {len(de_novo)}")
        for p in de_novo[:5]:
            parts.append(
                f"  - {p.gene or 'Unknown'} {p.chrom}:{p.pos} "
                f"({p.clinvar_significance or 'unknown significance'}) "
                f"risk={p.risk_score}"
            )

    if compound_hets:
        parts.append(f"\nCompound heterozygote candidates: {len(compound_hets)}")
        for ch in compound_hets[:3]:
            parts.append(
                f"  - Gene {ch.gene}: "
                f"{ch.variant_a.chrom}:{ch.variant_a.pos} ({ch.source_a}) + "
                f"{ch.variant_b.chrom}:{ch.variant_b.pos} ({ch.source_b})"
            )

    prompt = "\n".join(parts)
    prompt += (
        "\n\nProvide a concise clinical genetics interpretation (4-6 sentences) "
        "of this multi-sample comparison. Highlight key findings including de novo "
        "variants, compound heterozygotes, and clinically significant shared variants. "
        "Note any inheritance patterns that may be relevant for genetic counseling."
    )

    summary = await call_llm(prompt)
    if summary:
        return summary

    # Fallback template summary
    fallback_parts = []
    fallback_parts.append(
        f"**Comparison of {len(sample_stats)} samples** identified "
        f"{len(shared_variants)} shared and "
        f"{sum(len(v) for v in [[] for _ in sample_stats])} unique variants."
    )

    if de_novo:
        fallback_parts.append(
            f"**De novo variants:** {len(de_novo)} variant(s) found in the proband "
            "but absent in both parents, warranting further clinical evaluation."
        )

    if compound_hets:
        genes = set(ch.gene for ch in compound_hets)
        fallback_parts.append(
            f"**Compound heterozygotes:** Candidate compound heterozygous variants "
            f"detected in {len(genes)} gene(s): {', '.join(sorted(genes))}. "
            "These may contribute to autosomal recessive disease."
        )

    if pathogenic_shared:
        fallback_parts.append(
            f"**Shared pathogenic variants:** {len(pathogenic_shared)} pathogenic "
            "variant(s) found across multiple samples, suggesting familial transmission."
        )

    return "\n\n".join(fallback_parts) if fallback_parts else None
