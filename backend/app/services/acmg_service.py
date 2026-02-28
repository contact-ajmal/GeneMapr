"""
ACMG/AMP variant classification service.

Auto-assesses ACMG/AMP criteria based on available evidence and
applies the combining rules to produce a 5-tier classification.
"""
from typing import Optional

from app.models.variant import Variant


# Loss-of-function consequences (PVS1-relevant)
LOF_CONSEQUENCES = {
    "stop_gained",
    "frameshift_variant",
    "splice_acceptor_variant",
    "splice_donor_variant",
    "start_lost",
    "stop_lost",
    "transcript_ablation",
}

SPLICE_SITE_CONSEQUENCES = {
    "splice_acceptor_variant",
    "splice_donor_variant",
}

MISSENSE_CONSEQUENCES = {
    "missense_variant",
    "inframe_deletion",
    "inframe_insertion",
    "protein_altering_variant",
}

SYNONYMOUS_CONSEQUENCES = {
    "synonymous_variant",
}

# All 28 ACMG criteria with categories
ACMG_CRITERIA = {
    # Pathogenic
    "PVS1": {"category": "pathogenic", "strength": "very_strong", "label": "Null variant in LOF gene"},
    "PS1": {"category": "pathogenic", "strength": "strong", "label": "Same amino acid change as established pathogenic"},
    "PS2": {"category": "pathogenic", "strength": "strong", "label": "De novo (confirmed)"},
    "PS3": {"category": "pathogenic", "strength": "strong", "label": "Functional studies supportive"},
    "PS4": {"category": "pathogenic", "strength": "strong", "label": "Prevalence in affected > controls"},
    "PM1": {"category": "pathogenic", "strength": "moderate", "label": "Mutational hotspot / functional domain"},
    "PM2": {"category": "pathogenic", "strength": "moderate", "label": "Absent/rare in population databases"},
    "PM3": {"category": "pathogenic", "strength": "moderate", "label": "Detected in trans with pathogenic variant"},
    "PM4": {"category": "pathogenic", "strength": "moderate", "label": "Protein length change (non-repeat)"},
    "PM5": {"category": "pathogenic", "strength": "moderate", "label": "Novel missense at known pathogenic position"},
    "PM6": {"category": "pathogenic", "strength": "moderate", "label": "De novo (unconfirmed)"},
    "PP1": {"category": "pathogenic", "strength": "supporting", "label": "Co-segregation with disease"},
    "PP2": {"category": "pathogenic", "strength": "supporting", "label": "Missense in gene with low benign rate"},
    "PP3": {"category": "pathogenic", "strength": "supporting", "label": "Computational evidence supports deleterious"},
    "PP4": {"category": "pathogenic", "strength": "supporting", "label": "Patient phenotype matches gene"},
    "PP5": {"category": "pathogenic", "strength": "supporting", "label": "Reputable source reports pathogenic"},
    # Benign
    "BA1": {"category": "benign", "strength": "standalone", "label": "Allele frequency > 5%"},
    "BS1": {"category": "benign", "strength": "strong", "label": "Allele frequency > expected for disorder"},
    "BS2": {"category": "benign", "strength": "strong", "label": "Observed in healthy adults"},
    "BS3": {"category": "benign", "strength": "strong", "label": "Functional studies show no effect"},
    "BS4": {"category": "benign", "strength": "strong", "label": "Lack of segregation"},
    "BP1": {"category": "benign", "strength": "supporting", "label": "Missense in gene where truncating causes disease"},
    "BP2": {"category": "benign", "strength": "supporting", "label": "Observed in trans/cis with pathogenic variant"},
    "BP3": {"category": "benign", "strength": "supporting", "label": "In-frame indel in repetitive region"},
    "BP4": {"category": "benign", "strength": "supporting", "label": "Computational evidence suggests no impact"},
    "BP5": {"category": "benign", "strength": "supporting", "label": "Variant in case with alternate cause"},
    "BP6": {"category": "benign", "strength": "supporting", "label": "Reputable source reports benign"},
    "BP7": {"category": "benign", "strength": "supporting", "label": "Synonymous with no splice impact"},
}


def _get_consequence_set(variant: Variant) -> set[str]:
    """Extract consequence terms as a lowercase set."""
    if not variant.consequence:
        return set()
    return {c.strip().lower() for c in variant.consequence.split(",")}


def assess_acmg_criteria(variant: Variant) -> dict:
    """
    Auto-assess ACMG/AMP criteria for a variant based on available evidence.

    Returns dict with:
        criteria_met: list of criteria codes that are met
        criteria_details: dict mapping each criterion to {met, evidence, strength}
        classification: str (Pathogenic/Likely pathogenic/VUS/Likely benign/Benign)
        classification_reason: str explaining the combining logic
    """
    consequences = _get_consequence_set(variant)
    af = variant.gnomad_af
    clinvar_sig = (variant.clinvar_significance or "").lower()

    criteria_details: dict[str, dict] = {}
    criteria_met: list[str] = []

    # --- Pathogenic criteria ---

    # PVS1: Null variant (nonsense, frameshift, splice ±1,2) in gene with LOF mechanism
    is_lof = bool(consequences & LOF_CONSEQUENCES)
    pvs1_met = is_lof and variant.gene_symbol is not None
    criteria_details["PVS1"] = {
        "met": pvs1_met,
        "evidence": (
            f"Null variant ({', '.join(consequences & LOF_CONSEQUENCES)}) in {variant.gene_symbol}"
            if pvs1_met
            else ""
        ),
        "strength": "very_strong",
    }
    if pvs1_met:
        criteria_met.append("PVS1")

    # PS1: Same amino acid change as established pathogenic (check ClinVar)
    ps1_met = (
        bool(variant.protein_change)
        and "pathogenic" in clinvar_sig
        and "likely" not in clinvar_sig
        and "uncertain" not in clinvar_sig
    )
    criteria_details["PS1"] = {
        "met": ps1_met,
        "evidence": (
            f"ClinVar reports pathogenic for this variant ({variant.clinvar_significance})"
            if ps1_met
            else ""
        ),
        "strength": "strong",
    }
    if ps1_met:
        criteria_met.append("PS1")

    # PS2-PS4: Require family/functional data we don't have
    for code in ["PS2", "PS3", "PS4"]:
        criteria_details[code] = {"met": False, "evidence": "Insufficient data", "strength": "strong"}

    # PM1: Mutational hotspot / functional domain (stub - always false)
    criteria_details["PM1"] = {"met": False, "evidence": "Domain analysis not available", "strength": "moderate"}

    # PM2: Absent or extremely rare in population databases (AF < 0.0001)
    pm2_met = af is None or af < 0.0001
    if af is None:
        pm2_evidence = "Not observed in gnomAD"
    elif af < 0.0001:
        pm2_evidence = f"Extremely rare in gnomAD (AF={af:.6f})"
    else:
        pm2_evidence = f"Present in gnomAD (AF={af:.6f})"
    criteria_details["PM2"] = {"met": pm2_met, "evidence": pm2_evidence, "strength": "moderate"}
    if pm2_met:
        criteria_met.append("PM2")

    # PM3-PM6: Require family/functional data
    for code in ["PM3", "PM4", "PM5", "PM6"]:
        criteria_details[code] = {"met": False, "evidence": "Insufficient data", "strength": "moderate"}

    # PP1-PP2: Require segregation/gene-level data
    for code in ["PP1", "PP2"]:
        criteria_details[code] = {"met": False, "evidence": "Insufficient data", "strength": "supporting"}

    # PP3: Computational evidence supports deleterious (missense + rare)
    is_missense = bool(consequences & MISSENSE_CONSEQUENCES)
    is_rare = af is None or af < 0.01
    pp3_met = is_missense and is_rare
    criteria_details["PP3"] = {
        "met": pp3_met,
        "evidence": (
            "Missense variant with low population frequency suggests functional impact"
            if pp3_met
            else ""
        ),
        "strength": "supporting",
    }
    if pp3_met:
        criteria_met.append("PP3")

    # PP4-PP5: Require phenotype/source data
    for code in ["PP4", "PP5"]:
        criteria_details[code] = {"met": False, "evidence": "Insufficient data", "strength": "supporting"}

    # --- Benign criteria ---

    # BA1: AF > 0.05 (standalone benign)
    ba1_met = af is not None and af > 0.05
    criteria_details["BA1"] = {
        "met": ba1_met,
        "evidence": f"Allele frequency {af:.4f} exceeds 5% threshold" if ba1_met else "",
        "strength": "standalone",
    }
    if ba1_met:
        criteria_met.append("BA1")

    # BS1: AF > 0.01 (strong benign)
    bs1_met = af is not None and af > 0.01 and not ba1_met
    criteria_details["BS1"] = {
        "met": bs1_met,
        "evidence": f"Allele frequency {af:.4f} exceeds 1% threshold" if bs1_met else "",
        "strength": "strong",
    }
    if bs1_met:
        criteria_met.append("BS1")

    # BS2-BS4: Require additional data
    for code in ["BS2", "BS3", "BS4"]:
        criteria_details[code] = {"met": False, "evidence": "Insufficient data", "strength": "strong"}

    # BP1-BP3, BP5-BP6: Require additional data
    for code in ["BP1", "BP2", "BP3", "BP5", "BP6"]:
        criteria_details[code] = {"met": False, "evidence": "Insufficient data", "strength": "supporting"}

    # BP4: Computational evidence suggests no impact (synonymous)
    is_synonymous = bool(consequences & SYNONYMOUS_CONSEQUENCES)
    bp4_met = is_synonymous
    criteria_details["BP4"] = {
        "met": bp4_met,
        "evidence": "Synonymous variant unlikely to affect protein function" if bp4_met else "",
        "strength": "supporting",
    }
    if bp4_met:
        criteria_met.append("BP4")

    # BP7: Synonymous with no predicted splice impact
    bp7_met = is_synonymous and not bool(consequences & SPLICE_SITE_CONSEQUENCES)
    criteria_details["BP7"] = {
        "met": bp7_met,
        "evidence": (
            "Synonymous variant with no predicted splice site impact"
            if bp7_met
            else ""
        ),
        "strength": "supporting",
    }
    if bp7_met:
        criteria_met.append("BP7")

    # --- Classification combining rules ---
    classification, reason = _classify(criteria_met, criteria_details)

    return {
        "criteria_met": criteria_met,
        "criteria_details": criteria_details,
        "classification": classification,
        "classification_reason": reason,
    }


def _classify(criteria_met: list[str], details: dict) -> tuple[str, str]:
    """
    Apply ACMG combining rules to determine classification.

    Returns (classification, reason) tuple.
    """
    # Count by strength
    very_strong = [c for c in criteria_met if details[c]["strength"] == "very_strong"]
    strong_path = [c for c in criteria_met if details[c]["strength"] == "strong" and details[c].get("met") and ACMG_CRITERIA[c]["category"] == "pathogenic"]
    moderate = [c for c in criteria_met if details[c]["strength"] == "moderate"]
    supporting_path = [c for c in criteria_met if details[c]["strength"] == "supporting" and ACMG_CRITERIA[c]["category"] == "pathogenic"]
    standalone = [c for c in criteria_met if details[c]["strength"] == "standalone"]
    strong_benign = [c for c in criteria_met if details[c]["strength"] == "strong" and ACMG_CRITERIA[c]["category"] == "benign"]
    supporting_benign = [c for c in criteria_met if details[c]["strength"] == "supporting" and ACMG_CRITERIA[c]["category"] == "benign"]

    nvs = len(very_strong)
    nsp = len(strong_path)
    nmod = len(moderate)
    nsup_p = len(supporting_path)
    nsa = len(standalone)
    nsb = len(strong_benign)
    nsup_b = len(supporting_benign)

    # --- Benign rules (check first) ---
    if nsa >= 1:
        return "Benign", f"Standalone benign criterion met ({', '.join(standalone)})"

    if nsb >= 2:
        return "Benign", f"{nsb} Strong benign criteria met ({', '.join(strong_benign)})"

    if nsb >= 1 and nsup_b >= 1:
        return "Likely benign", (
            f"1 Strong benign + {nsup_b} Supporting benign "
            f"({', '.join(strong_benign + supporting_benign)})"
        )

    # --- Pathogenic rules ---
    # Pathogenic: PVS1 + ≥1 Strong
    if nvs >= 1 and nsp >= 1:
        return "Pathogenic", (
            f"{nvs} Very Strong + {nsp} Strong = Pathogenic "
            f"({', '.join(very_strong + strong_path)})"
        )

    # Pathogenic: PVS1 + ≥2 Moderate
    if nvs >= 1 and nmod >= 2:
        return "Pathogenic", (
            f"{nvs} Very Strong + {nmod} Moderate = Pathogenic "
            f"({', '.join(very_strong + moderate)})"
        )

    # Pathogenic: PVS1 + 1 Moderate + 1 Supporting
    if nvs >= 1 and nmod >= 1 and nsup_p >= 1:
        return "Pathogenic", (
            f"{nvs} Very Strong + {nmod} Moderate + {nsup_p} Supporting = Pathogenic "
            f"({', '.join(very_strong + moderate + supporting_path)})"
        )

    # Pathogenic: ≥2 Strong
    if nsp >= 2:
        return "Pathogenic", (
            f"{nsp} Strong pathogenic criteria = Pathogenic "
            f"({', '.join(strong_path)})"
        )

    # Pathogenic: 1 Strong + ≥3 Moderate
    if nsp >= 1 and nmod >= 3:
        return "Pathogenic", (
            f"{nsp} Strong + {nmod} Moderate = Pathogenic "
            f"({', '.join(strong_path + moderate)})"
        )

    # Pathogenic: 1 Strong + 2 Moderate + ≥2 Supporting
    if nsp >= 1 and nmod >= 2 and nsup_p >= 2:
        return "Pathogenic", (
            f"{nsp} Strong + {nmod} Moderate + {nsup_p} Supporting = Pathogenic "
            f"({', '.join(strong_path + moderate + supporting_path)})"
        )

    # Pathogenic: 1 Strong + 1 Moderate + ≥4 Supporting
    if nsp >= 1 and nmod >= 1 and nsup_p >= 4:
        return "Pathogenic", (
            f"{nsp} Strong + {nmod} Moderate + {nsup_p} Supporting = Pathogenic "
            f"({', '.join(strong_path + moderate + supporting_path)})"
        )

    # --- Likely pathogenic ---
    # PVS1 + 1 Moderate
    if nvs >= 1 and nmod >= 1:
        return "Likely pathogenic", (
            f"{nvs} Very Strong + {nmod} Moderate = Likely pathogenic "
            f"({', '.join(very_strong + moderate)})"
        )

    # PVS1 + ≥2 Supporting
    if nvs >= 1 and nsup_p >= 2:
        return "Likely pathogenic", (
            f"{nvs} Very Strong + {nsup_p} Supporting = Likely pathogenic "
            f"({', '.join(very_strong + supporting_path)})"
        )

    # PVS1 + 1 Supporting
    if nvs >= 1 and nsup_p >= 1:
        return "Likely pathogenic", (
            f"{nvs} Very Strong + {nsup_p} Supporting = Likely pathogenic "
            f"({', '.join(very_strong + supporting_path)})"
        )

    # 1 Strong + 1-2 Moderate
    if nsp >= 1 and 1 <= nmod <= 2:
        return "Likely pathogenic", (
            f"{nsp} Strong + {nmod} Moderate = Likely pathogenic "
            f"({', '.join(strong_path + moderate)})"
        )

    # 1 Strong + ≥2 Supporting
    if nsp >= 1 and nsup_p >= 2:
        return "Likely pathogenic", (
            f"{nsp} Strong + {nsup_p} Supporting = Likely pathogenic "
            f"({', '.join(strong_path + supporting_path)})"
        )

    # ≥3 Moderate
    if nmod >= 3:
        return "Likely pathogenic", (
            f"{nmod} Moderate = Likely pathogenic "
            f"({', '.join(moderate)})"
        )

    # 2 Moderate + ≥2 Supporting
    if nmod >= 2 and nsup_p >= 2:
        return "Likely pathogenic", (
            f"{nmod} Moderate + {nsup_p} Supporting = Likely pathogenic "
            f"({', '.join(moderate + supporting_path)})"
        )

    # 1 Moderate + ≥4 Supporting
    if nmod >= 1 and nsup_p >= 4:
        return "Likely pathogenic", (
            f"{nmod} Moderate + {nsup_p} Supporting = Likely pathogenic "
            f"({', '.join(moderate + supporting_path)})"
        )

    # --- Likely benign (remaining benign combinations) ---
    if nsup_b >= 2:
        return "Likely benign", (
            f"{nsup_b} Supporting benign criteria = Likely benign "
            f"({', '.join(supporting_benign)})"
        )

    # --- VUS: everything else ---
    if criteria_met:
        return "Uncertain significance", (
            f"Evidence does not meet threshold for classification "
            f"(criteria met: {', '.join(criteria_met)})"
        )

    return "Uncertain significance", "No ACMG criteria met — insufficient evidence for classification"
