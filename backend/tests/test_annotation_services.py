"""
Tests for annotation services.

Run with: pytest tests/test_annotation_services.py -v
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.clinvar_service import get_clinvar_annotation
from app.services.gnomad_service import get_gnomad_annotation
from app.services.ensembl_service import get_ensembl_annotation


@pytest.mark.asyncio
async def test_clinvar_service_with_mock():
    """Test ClinVar service with mocked Redis and HTTP client."""

    # Mock Redis
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None  # Cache miss
    mock_redis.setex = AsyncMock()

    with patch('app.services.clinvar_service.get_redis', return_value=mock_redis):
        # Mock HTTP response
        mock_response = MagicMock()
        mock_response.json.side_effect = [
            {
                "esearchresult": {
                    "idlist": ["12345"]
                }
            },
            {
                "result": {
                    "12345": {
                        "clinical_significance": {
                            "description": "Pathogenic"
                        },
                        "review_status": "criteria provided, multiple submitters",
                        "trait_set": [
                            {"trait_name": "Breast cancer"}
                        ]
                    }
                }
            }
        ]
        mock_response.raise_for_status = MagicMock()

        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )

            result = await get_clinvar_annotation("17", 43044295, "G", "A")

            assert result["clinvar_significance"] == "Pathogenic"
            assert "criteria provided" in result["clinvar_review_status"]
            assert "Breast cancer" in result["clinvar_condition"]


@pytest.mark.asyncio
async def test_gnomad_service_with_mock():
    """Test gnomAD service with mocked Redis and HTTP client."""

    # Mock Redis
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None  # Cache miss
    mock_redis.setex = AsyncMock()

    with patch('app.services.gnomad_service.get_redis', return_value=mock_redis):
        # Mock HTTP response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": {
                "variant": {
                    "genome": {
                        "af": 0.0001234,
                        "ac": 15,
                        "an": 121234
                    }
                }
            }
        }
        mock_response.raise_for_status = MagicMock()

        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )

            result = await get_gnomad_annotation("17", 43044295, "G", "A")

            assert result["gnomad_af"] == 0.0001234
            assert result["gnomad_ac"] == 15
            assert result["gnomad_an"] == 121234


@pytest.mark.asyncio
async def test_ensembl_service_with_mock():
    """Test Ensembl service with mocked Redis and HTTP client."""

    # Mock Redis
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None  # Cache miss
    mock_redis.setex = AsyncMock()

    with patch('app.services.ensembl_service.get_redis', return_value=mock_redis):
        # Mock HTTP response
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {
                "transcript_consequences": [
                    {
                        "canonical": 1,
                        "gene_symbol": "BRCA1",
                        "transcript_id": "ENST00000357654",
                        "consequence_terms": ["missense_variant"],
                        "hgvsp": "ENSP00000350283:p.Gly1706Glu"
                    }
                ],
                "most_severe_consequence": "missense_variant"
            }
        ]
        mock_response.raise_for_status = MagicMock()

        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                return_value=mock_response
            )

            result = await get_ensembl_annotation("17", 43044295, "G", "A")

            assert result["gene_symbol"] == "BRCA1"
            assert result["transcript_id"] == "ENST00000357654"
            assert result["consequence"] == "missense_variant"
            assert "p.Gly1706Glu" in result["protein_change"]


@pytest.mark.asyncio
async def test_clinvar_graceful_degradation():
    """Test that ClinVar service returns null values on error."""

    # Mock Redis
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None  # Cache miss
    mock_redis.setex = AsyncMock()

    with patch('app.services.clinvar_service.get_redis', return_value=mock_redis):
        # Mock HTTP error
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=Exception("API timeout")
            )

            result = await get_clinvar_annotation("17", 43044295, "G", "A")

            # Should return null values, not raise exception
            assert result["clinvar_significance"] is None
            assert result["clinvar_review_status"] is None
            assert result["clinvar_condition"] is None


@pytest.mark.asyncio
async def test_redis_cache_hit():
    """Test that services return cached data when available."""

    import json

    cached_data = {
        "clinvar_significance": "Pathogenic",
        "clinvar_review_status": "reviewed by expert panel",
        "clinvar_condition": "Hereditary breast cancer"
    }

    # Mock Redis with cache hit
    mock_redis = AsyncMock()
    mock_redis.get.return_value = json.dumps(cached_data)

    with patch('app.services.clinvar_service.get_redis', return_value=mock_redis):
        with patch('httpx.AsyncClient') as mock_client:
            # HTTP client should NOT be called when cache hits
            result = await get_clinvar_annotation("17", 43044295, "G", "A")

            # Should return cached data
            assert result == cached_data

            # Verify HTTP client was never instantiated
            mock_client.assert_not_called()
