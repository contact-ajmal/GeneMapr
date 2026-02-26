# Annotation Services Quick Reference

## Architecture Flow

```
┌─────────────┐
│ VCF Upload  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  VCF Parser      │ Parse & Store Variants
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Background Task                 │
│  annotate_variants_by_upload_id  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Annotation Service   │ (Orchestrator)
│ ├── asyncio.gather() │
│ │                    │
│ ├─► ClinVar Service  ├──► NCBI E-utilities ──┐
│ │                    │                        │
│ ├─► gnomAD Service   ├──► gnomAD GraphQL ────┤
│ │                    │                        │
│ └─► Ensembl Service  ├──► Ensembl VEP API ───┤
└──────────────────────┘                        │
       ▲                                        │
       │                                        │
       └────────────── Redis Cache ◄────────────┘
       │
       ▼
┌──────────────────┐
│ Update Variant   │ Set annotation fields + status
│ in PostgreSQL    │
└──────────────────┘
```

## Service Functions

### annotation_service.py
```python
# Annotate single variant
await annotate_variant(variant: Variant, db: AsyncSession) -> None

# Annotate all variants from upload
await annotate_variants_by_upload_id(upload_id: str, db: AsyncSession) -> int

# Annotate by variant ID
await annotate_variant_by_id(variant_id: UUID, db: AsyncSession) -> Variant
```

### clinvar_service.py
```python
await get_clinvar_annotation(chrom: str, pos: int, ref: str, alt: str) -> Dict
# Returns: {
#   "clinvar_significance": str | None,
#   "clinvar_review_status": str | None,
#   "clinvar_condition": str | None
# }
```

### gnomad_service.py
```python
await get_gnomad_annotation(chrom: str, pos: int, ref: str, alt: str) -> Dict
# Returns: {
#   "gnomad_af": float | None,
#   "gnomad_ac": int | None,
#   "gnomad_an": int | None
# }
```

### ensembl_service.py
```python
await get_ensembl_annotation(chrom: str, pos: int, ref: str, alt: str) -> Dict
# Returns: {
#   "gene_symbol": str | None,
#   "transcript_id": str | None,
#   "consequence": str | None,
#   "protein_change": str | None
# }
```

## Database Model Fields

```python
class Variant:
    # Original VCF fields
    chrom: str
    pos: int
    ref: str
    alt: str

    # Ensembl annotations
    gene_symbol: str | None
    transcript_id: str | None
    consequence: str | None
    protein_change: str | None

    # ClinVar annotations
    clinvar_significance: str | None
    clinvar_review_status: str | None
    clinvar_condition: str | None

    # gnomAD annotations
    gnomad_af: float | None
    gnomad_ac: int | None
    gnomad_an: int | None

    # Annotation metadata
    annotation_status: str | None  # "pending" | "completed" | "failed"
    annotated_at: datetime | None
```

## Redis Cache Keys

| Service | Cache Key Format | Example |
|---------|-----------------|---------|
| ClinVar | `clinvar:{chrom}-{pos}-{ref}-{alt}` | `clinvar:17-43044295-G-A` |
| gnomAD  | `gnomad:{chrom}-{pos}-{ref}-{alt}` | `gnomad:17-43044295-G-A` |
| Ensembl | `ensembl:{chrom}-{pos}-{ref}-{alt}` | `ensembl:17-43044295-G-A` |

**TTL**: 86400 seconds (24 hours)

## API Endpoints

```bash
# Upload VCF (triggers background annotation)
POST /variants/upload
Content-Type: multipart/form-data
Body: file=@test.vcf

# Get paginated variant list (with annotations)
GET /variants?page=1&page_size=20

# Get single variant detail (with annotations)
GET /variants/{variant_id}
```

## Common Operations

### 1. Manual Re-annotation
```python
from app.services.annotation_service import annotate_variant_by_id
from app.core.database import AsyncSessionLocal
from uuid import UUID

async def reannotate():
    async with AsyncSessionLocal() as db:
        variant_id = UUID("your-variant-uuid")
        await annotate_variant_by_id(variant_id, db)
```

### 2. Batch Re-annotation
```bash
docker exec genemapr_backend python -m app.scripts.reannotate_all
```

### 3. Check Annotation Status
```python
from app.models.variant import Variant
from sqlalchemy import select

async def check_status(db):
    query = select(Variant.annotation_status, func.count()).group_by(Variant.annotation_status)
    result = await db.execute(query)
    return dict(result.all())
    # Returns: {"completed": 45, "pending": 5, "failed": 2}
```

### 4. Clear Redis Cache
```bash
docker exec genemapr_redis redis-cli FLUSHALL
```

### 5. Clear Cache for Specific Variant
```bash
docker exec genemapr_redis redis-cli DEL "clinvar:17-43044295-G-A"
docker exec genemapr_redis redis-cli DEL "gnomad:17-43044295-G-A"
docker exec genemapr_redis redis-cli DEL "ensembl:17-43044295-G-A"
```

## Error Handling

All services implement graceful degradation:

```python
try:
    # Make API call
    response = await client.get(url)
    data = response.json()
    # Parse data
except httpx.HTTPError as e:
    print(f"API error: {e}")
    # Return null values
except Exception as e:
    print(f"Unexpected error: {e}")
    # Return null values
```

**Result**: System never crashes due to annotation failures. Variants are saved with `annotation_status="failed"` and null annotation values.

## Configuration

```python
# app/core/config.py
ensembl_base_url: str = "https://rest.ensembl.org"
clinvar_base_url: str = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
```

## Performance

| Operation | Time (avg) | Notes |
|-----------|-----------|-------|
| Single variant annotation (no cache) | 2-4s | 3 concurrent API calls |
| Single variant annotation (cached) | <50ms | Redis lookup |
| Upload + annotation (5 variants) | ~15s | Background task |

## Debugging Commands

```bash
# View logs
docker logs genemapr_backend -f

# Check variant in DB
docker exec -it genemapr_postgres psql -U genemapr_user -d genemapr
SELECT id, chrom, pos, gene_symbol, consequence, annotation_status FROM variants LIMIT 5;

# Check Redis cache
docker exec genemapr_redis redis-cli
> KEYS *clinvar*
> GET "clinvar:17-43044295-G-A"
> TTL "clinvar:17-43044295-G-A"

# Test annotation manually
docker exec -it genemapr_backend python
>>> import asyncio
>>> from app.services.ensembl_service import get_ensembl_annotation
>>> from app.core.redis import init_redis
>>> asyncio.run(init_redis())
>>> result = asyncio.run(get_ensembl_annotation("17", 43044295, "G", "A"))
>>> print(result)
```

## Common Annotation Values

### ClinVar Significance
- Pathogenic
- Likely pathogenic
- Uncertain significance
- Likely benign
- Benign

### Review Status
- practice guideline
- reviewed by expert panel
- criteria provided, multiple submitters
- criteria provided, single submitter
- no assertion criteria provided

### Consequence Types (Ensembl)
- missense_variant
- synonymous_variant
- stop_gained
- frameshift_variant
- splice_donor_variant
- splice_acceptor_variant
- inframe_deletion
- inframe_insertion

## Integration Points

### Upload Flow
```python
# api/variants.py
async def upload_vcf(background_tasks, file, db):
    variant_count, upload_id = await parse_and_store_vcf(file, db)

    async def annotate_upload():
        async with AsyncSessionLocal() as bg_db:
            await annotate_variants_by_upload_id(upload_id, bg_db)

    background_tasks.add_task(annotate_upload)
```

### Direct Annotation
```python
# services/annotation_service.py
async def annotate_variant(variant, db):
    # Concurrent API calls
    clinvar_data, gnomad_data, ensembl_data = await asyncio.gather(
        get_clinvar_annotation(...),
        get_gnomad_annotation(...),
        get_ensembl_annotation(...),
        return_exceptions=True
    )

    # Update variant fields
    variant.gene_symbol = ensembl_data.get("gene_symbol")
    variant.clinvar_significance = clinvar_data.get("clinvar_significance")
    # ... etc

    variant.annotation_status = "completed"
    await db.commit()
```
