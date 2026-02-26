# Phase 2: Annotation Services - Implementation Notes

## What Was Implemented

### 1. Database Model Updates
- Added annotation fields to `Variant` model:
  - **Ensembl**: `gene_symbol`, `transcript_id`, `consequence`, `protein_change`
  - **ClinVar**: `clinvar_significance`, `clinvar_review_status`, `clinvar_condition`
  - **gnomAD**: `gnomad_af`, `gnomad_ac`, `gnomad_an`
  - **Metadata**: `annotation_status`, `annotated_at`

### 2. Annotation Services
Created four new services in `app/services/`:

- **`clinvar_service.py`**: Queries NCBI E-utilities for ClinVar data
  - Clinical significance
  - Review status
  - Associated conditions

- **`gnomad_service.py`**: Queries gnomAD GraphQL API
  - Allele frequency (AF)
  - Allele count (AC)
  - Allele number (AN)

- **`ensembl_service.py`**: Queries Ensembl VEP REST API
  - Gene symbol
  - Transcript ID
  - Consequence terms
  - Protein change (HGVSp)

- **`annotation_service.py`**: Orchestrator that:
  - Calls all three services concurrently using `asyncio.gather()`
  - Updates variant records with results
  - Handles errors gracefully (sets null values if API fails)
  - Tracks annotation status

### 3. API Endpoints
- **Updated `POST /variants/upload`**: Now triggers background annotation after VCF parsing
- **New `GET /variants/{id}`**: Returns full variant details with all annotation fields

### 4. Features
- ✅ All HTTP calls use `httpx.AsyncClient` with 10s timeout
- ✅ Redis caching with key format: `{service}:{chrom}-{pos}-{ref}-{alt}`
- ✅ 24-hour TTL (86400s) on all cached results
- ✅ Graceful degradation: API failures result in `null` values, not crashes
- ✅ Background task execution for annotation (doesn't block upload response)

## Testing

### If You Have Existing Data from Phase 1

Option 1: Run the migration SQL script:
```bash
docker exec -i genemapr_postgres psql -U your_user -d genemapr < backend/migrations/001_add_annotation_columns.sql
```

Option 2: Re-annotate existing variants:
```bash
docker exec genemapr_backend python -m app.scripts.reannotate_all
```

Option 3: Drop and recreate the database (loses data):
```bash
docker-compose down -v
docker-compose up -d
```

### Test the Annotation Flow

1. Upload a VCF file:
```bash
curl -X POST http://localhost:8000/variants/upload \
  -F "file=@test.vcf"
```

Response will include `upload_id` and trigger background annotation.

2. Check annotation status by listing variants:
```bash
curl http://localhost:8000/variants?page=1&page_size=10
```

Look for `annotation_status` field (values: `pending`, `completed`, `failed`)

3. Get full details for a specific variant:
```bash
curl http://localhost:8000/variants/{variant_id}
```

This returns all annotation fields from ClinVar, gnomAD, and Ensembl.

### Test Individual Services

You can test each service independently using the Python REPL:

```python
import asyncio
from app.services.clinvar_service import get_clinvar_annotation
from app.services.gnomad_service import get_gnomad_annotation
from app.services.ensembl_service import get_ensembl_annotation
from app.core.redis import init_redis

# Initialize Redis
asyncio.run(init_redis())

# Test ClinVar
result = asyncio.run(get_clinvar_annotation("17", 43044295, "G", "A"))
print(result)

# Test gnomAD
result = asyncio.run(get_gnomad_annotation("17", 43044295, "G", "A"))
print(result)

# Test Ensembl
result = asyncio.run(get_ensembl_annotation("17", 43044295, "G", "A"))
print(result)
```

## Example Variants to Test

These are clinically relevant variants that should return rich annotation data:

1. **BRCA1 pathogenic variant**:
   - Chr: 17, Pos: 43044295, Ref: G, Alt: A
   - Should have ClinVar significance and gnomAD frequency

2. **APOE ε4 allele**:
   - Chr: 19, Pos: 44908684, Ref: T, Alt: C
   - Common variant with population frequency data

3. **CFTR Delta F508**:
   - Chr: 7, Pos: 117559590, Ref: CTT, Alt: C
   - Well-annotated pathogenic variant

## Architecture Notes

### Caching Strategy
- Each service checks Redis before making HTTP requests
- Cache keys include all variant coordinates to ensure uniqueness
- 24-hour TTL balances freshness with API rate limits

### Error Handling
- All services use try/except with graceful degradation
- Failed API calls log errors but return `null` values
- `annotation_status` tracks whether annotation succeeded or failed

### Concurrency
- Annotation services called in parallel using `asyncio.gather()`
- Background tasks use separate database session
- Each upload triggers annotation for all variants in that upload

## Next Steps for Phase 3
- Implement scoring engine
- Add AI summary service
- Build interpretation logic
