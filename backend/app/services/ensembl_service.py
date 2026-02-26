"""
Ensembl annotation service using REST API.

Queries for gene symbol, transcript, consequence, and protein change.
"""
import httpx
import json
from typing import Dict, Optional

from app.core.redis import get_redis
from app.core.config import settings


async def get_ensembl_annotation(
    chrom: str,
    pos: int,
    ref: str,
    alt: str
) -> Dict[str, Optional[str]]:
    """
    Query Ensembl VEP (Variant Effect Predictor) REST API.

    Returns:
        Dict with gene_symbol, transcript_id, consequence, protein_change
    """
    # Build cache key
    cache_key = f"ensembl:{chrom}-{pos}-{ref}-{alt}"

    # Check Redis cache
    redis_client = await get_redis()
    cached_data = await redis_client.get(cache_key)

    if cached_data:
        return json.loads(cached_data)

    # Default response (graceful degradation)
    result = {
        "gene_symbol": None,
        "transcript_id": None,
        "consequence": None,
        "protein_change": None
    }

    try:
        # Build VEP query
        # Ensembl VEP uses HGVS notation or region format
        # Format: chr:pos-pos/alleles
        region = f"{chrom}:{pos}-{pos}/{ref}/{alt}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            # Ensembl VEP endpoint
            vep_url = f"{settings.ensembl_base_url}/vep/human/region/{region}"

            headers = {
                "Content-Type": "application/json"
            }

            response = await client.get(vep_url, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Parse VEP response
            # VEP returns a list, usually with one entry per variant
            if data and isinstance(data, list) and len(data) > 0:
                variant_data = data[0]

                # Get transcript consequences (prioritize most severe)
                transcript_consequences = variant_data.get("transcript_consequences", [])

                if transcript_consequences:
                    # Sort by consequence severity (CANONICAL first, then by impact)
                    canonical_transcripts = [
                        tc for tc in transcript_consequences
                        if tc.get("canonical") == 1
                    ]

                    # Use canonical transcript if available, otherwise first transcript
                    primary_transcript = (
                        canonical_transcripts[0]
                        if canonical_transcripts
                        else transcript_consequences[0]
                    )

                    # Extract fields
                    result["gene_symbol"] = primary_transcript.get("gene_symbol")
                    result["transcript_id"] = primary_transcript.get("transcript_id")

                    # Consequence terms (can be multiple)
                    consequence_terms = primary_transcript.get("consequence_terms", [])
                    if consequence_terms:
                        result["consequence"] = ", ".join(consequence_terms)

                    # Protein change (HGVSp notation)
                    result["protein_change"] = primary_transcript.get("hgvsp")

                # If no transcript consequences, try most severe consequence
                if not result["consequence"]:
                    most_severe = variant_data.get("most_severe_consequence")
                    if most_severe:
                        result["consequence"] = most_severe

        # Cache the result
        await redis_client.setex(
            cache_key,
            86400,  # 24 hour TTL
            json.dumps(result)
        )

    except httpx.HTTPError as e:
        # Log error but return null values (graceful degradation)
        print(f"Ensembl HTTP error for {chrom}:{pos}: {str(e)}")

    except Exception as e:
        # Log error but return null values (graceful degradation)
        print(f"Ensembl error for {chrom}:{pos}: {str(e)}")

    return result
