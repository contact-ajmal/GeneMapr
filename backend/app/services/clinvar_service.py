"""
ClinVar annotation service using NCBI E-utilities API.

Queries for clinical significance, review status, and associated conditions.
"""
import httpx
import json
from typing import Dict, Optional
import xml.etree.ElementTree as ET

from app.core.redis import get_redis
from app.core.config import settings


async def get_clinvar_annotation(
    chrom: str,
    pos: int,
    ref: str,
    alt: str
) -> Dict[str, Optional[str]]:
    """
    Query ClinVar for variant annotation via NCBI E-utilities.

    Returns:
        Dict with clinvar_significance, clinvar_review_status, clinvar_condition
    """
    # Build cache key
    cache_key = f"clinvar:{chrom}-{pos}-{ref}-{alt}"

    # Check Redis cache
    redis_client = await get_redis()
    cached_data = await redis_client.get(cache_key)

    if cached_data:
        return json.loads(cached_data)

    # Default response (graceful degradation)
    result = {
        "clinvar_significance": None,
        "clinvar_review_status": None,
        "clinvar_condition": None
    }

    try:
        # Build search query for ClinVar
        # Format: chr[pos] AND ref[VariantType] AND alt[VariantType]
        search_term = f"{chrom}[Chromosome] AND {pos}[Base Position for Assembly GRCh38]"

        async with httpx.AsyncClient(timeout=10.0) as client:
            # Step 1: Search for variant IDs
            search_url = f"{settings.clinvar_base_url}/esearch.fcgi"
            search_params = {
                "db": "clinvar",
                "term": search_term,
                "retmode": "json"
            }

            search_response = await client.get(search_url, params=search_params)
            search_response.raise_for_status()
            search_data = search_response.json()

            # Get IDs from search results
            id_list = search_data.get("esearchresult", {}).get("idlist", [])

            if not id_list:
                # No results found, cache null result
                await redis_client.setex(
                    cache_key,
                    86400,  # 24 hour TTL
                    json.dumps(result)
                )
                return result

            # Step 2: Fetch detailed records
            # Use first ID (most relevant)
            clinvar_id = id_list[0]

            fetch_url = f"{settings.clinvar_base_url}/esummary.fcgi"
            fetch_params = {
                "db": "clinvar",
                "id": clinvar_id,
                "retmode": "json"
            }

            fetch_response = await client.get(fetch_url, params=fetch_params)
            fetch_response.raise_for_status()
            fetch_data = fetch_response.json()

            # Parse the summary data
            if "result" in fetch_data and clinvar_id in fetch_data["result"]:
                record = fetch_data["result"][clinvar_id]

                # Extract clinical significance
                clinical_sig = record.get("clinical_significance", {})
                if isinstance(clinical_sig, dict):
                    result["clinvar_significance"] = clinical_sig.get("description")
                elif isinstance(clinical_sig, str):
                    result["clinvar_significance"] = clinical_sig

                # Extract review status
                result["clinvar_review_status"] = record.get("review_status")

                # Extract condition/trait
                trait_set = record.get("trait_set", [])
                if trait_set and isinstance(trait_set, list):
                    conditions = []
                    for trait in trait_set:
                        if isinstance(trait, dict):
                            trait_name = trait.get("trait_name")
                            if trait_name:
                                conditions.append(trait_name)

                    if conditions:
                        result["clinvar_condition"] = "; ".join(conditions)

        # Cache the result
        await redis_client.setex(
            cache_key,
            86400,  # 24 hour TTL
            json.dumps(result)
        )

    except httpx.HTTPError as e:
        # Log error but return null values (graceful degradation)
        print(f"ClinVar HTTP error for {chrom}:{pos}: {str(e)}")

    except Exception as e:
        # Log error but return null values (graceful degradation)
        print(f"ClinVar error for {chrom}:{pos}: {str(e)}")

    return result
