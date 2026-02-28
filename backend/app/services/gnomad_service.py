"""
gnomAD annotation service.

Queries gnomAD API for population allele frequencies.
"""
import httpx
import json
from typing import Dict, Optional

from app.core.redis import get_redis


# gnomAD GraphQL API endpoint
GNOMAD_API_URL = "https://gnomad.broadinstitute.org/api"


async def get_gnomad_annotation(
    chrom: str,
    pos: int,
    ref: str,
    alt: str
) -> Dict[str, Optional[float | int]]:
    """
    Query gnomAD for allele frequency data via GraphQL API.

    Returns:
        Dict with gnomad_af (allele frequency), gnomad_ac (allele count), gnomad_an (allele number)
    """
    # Build cache key
    cache_key = f"gnomad:{chrom}-{pos}-{ref}-{alt}"

    # Check Redis cache
    redis_client = await get_redis()
    cached_data = await redis_client.get(cache_key)

    if cached_data:
        return json.loads(cached_data)

    # Default response (graceful degradation)
    result = {
        "gnomad_af": None,
        "gnomad_ac": None,
        "gnomad_an": None
    }

    try:
        # Build variant ID for gnomAD
        # Format: chrom-pos-ref-alt
        variant_id = f"{chrom}-{pos}-{ref}-{alt}"

        # GraphQL query for gnomAD v4
        query = """
        query GnomadVariant($variantId: String!, $datasetId: DatasetId!) {
          variant(variantId: $variantId, dataset: $datasetId) {
            genome {
              ac
              an
              af
            }
          }
        }
        """

        variables = {
            "variantId": variant_id,
            "datasetId": "gnomad_r4"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                GNOMAD_API_URL,
                json={"query": query, "variables": variables}
            )
            response.raise_for_status()
            data = response.json()

            # Parse response
            if "data" in data and data["data"].get("variant"):
                genome_data = data["data"]["variant"].get("genome")

                if genome_data:
                    result["gnomad_af"] = genome_data.get("af")
                    result["gnomad_ac"] = genome_data.get("ac")
                    result["gnomad_an"] = genome_data.get("an")

        # Cache the result
        await redis_client.setex(
            cache_key,
            86400,  # 24 hour TTL
            json.dumps(result)
        )

    except httpx.HTTPError as e:
        # Log error but return null values (graceful degradation)
        print(f"gnomAD HTTP error for {chrom}:{pos}: {str(e)}")

    except Exception as e:
        # Log error but return null values (graceful degradation)
        print(f"gnomAD error for {chrom}:{pos}: {str(e)}")

    return result


async def get_population_frequencies(
    chrom: str,
    pos: int,
    ref: str,
    alt: str,
) -> Dict[str, Optional[float]]:
    """
    Query gnomAD for population-specific allele frequencies.

    Returns dict with keys: overall, african, east_asian, european, latino, south_asian.
    Uses cached data when available.
    """
    cache_key = f"gnomad_pop:{chrom}-{pos}-{ref}-{alt}"

    redis_client = await get_redis()
    cached_data = await redis_client.get(cache_key)

    if cached_data:
        return json.loads(cached_data)

    result: Dict[str, Optional[float]] = {
        "overall": None,
        "african": None,
        "east_asian": None,
        "european": None,
        "latino": None,
        "south_asian": None,
    }

    try:
        variant_id = f"{chrom}-{pos}-{ref}-{alt}"

        query = """
        query GnomadVariantPopulations($variantId: String!, $datasetId: DatasetId!) {
          variant(variantId: $variantId, dataset: $datasetId) {
            genome {
              af
              populations {
                id
                ac
                an
              }
            }
          }
        }
        """

        variables = {
            "variantId": variant_id,
            "datasetId": "gnomad_r4",
        }

        # Population ID mapping (gnomAD v4 population codes)
        pop_map = {
            "afr": "african",
            "eas": "east_asian",
            "nfe": "european",
            "amr": "latino",
            "sas": "south_asian",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                GNOMAD_API_URL,
                json={"query": query, "variables": variables},
            )
            response.raise_for_status()
            data = response.json()

            if "data" in data and data["data"].get("variant"):
                genome_data = data["data"]["variant"].get("genome")
                if genome_data:
                    result["overall"] = genome_data.get("af")

                    populations = genome_data.get("populations", [])
                    for pop in populations:
                        pop_id = pop.get("id", "")
                        if pop_id in pop_map:
                            an = pop.get("an", 0)
                            ac = pop.get("ac", 0)
                            if an and an > 0:
                                result[pop_map[pop_id]] = ac / an

        await redis_client.setex(cache_key, 86400, json.dumps(result))

    except httpx.HTTPError as e:
        print(f"gnomAD population HTTP error for {chrom}:{pos}: {str(e)}")

    except Exception as e:
        print(f"gnomAD population error for {chrom}:{pos}: {str(e)}")

    return result
