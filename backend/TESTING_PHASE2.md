# Testing Phase 2: Annotation Services

## Setup

1. **Start the services**:
```bash
cd /Users/zaza/Documents/genomics-project/GeneMapr
docker-compose up -d
```

2. **Apply database migration** (if you have existing data from Phase 1):
```bash
docker exec -i genemapr_postgres psql -U genemapr_user -d genemapr < backend/migrations/001_add_annotation_columns.sql
```

## Test 1: Upload VCF and Trigger Annotation

Create a test VCF file with a known variant:

```bash
cat > test_variant.vcf << 'EOF'
##fileformat=VCFv4.2
##reference=GRCh38
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
17	43044295	rs80357382	G	A	100	PASS	DP=50;AF=0.5
EOF
```

Upload it:
```bash
curl -X POST http://localhost:8000/variants/upload \
  -F "file=@test_variant.vcf" \
  -H "Accept: application/json"
```

Expected response:
```json
{
  "status": "success",
  "variant_count": 1,
  "upload_id": "vcf_upload_...",
  "message": "Successfully parsed and stored 1 variants. Annotation in progress."
}
```

## Test 2: Check Annotation Status

Wait 10-15 seconds for background annotation to complete, then:

```bash
curl http://localhost:8000/variants?page=1&page_size=10
```

Look for the `annotation_status` field in the response. It should be:
- `pending` - annotation hasn't started yet
- `completed` - annotation finished successfully
- `failed` - annotation encountered errors

## Test 3: Get Full Variant Details

Get the variant ID from the list response, then:

```bash
curl http://localhost:8000/variants/{variant_id}
```

Expected fields in response:
```json
{
  "id": "uuid-here",
  "chrom": "17",
  "pos": 43044295,
  "ref": "G",
  "alt": "A",

  // Ensembl annotations
  "gene_symbol": "BRCA1",
  "transcript_id": "ENST00000357654",
  "consequence": "missense_variant",
  "protein_change": "ENSP00000350283:p.Gly1706Glu",

  // ClinVar annotations
  "clinvar_significance": "Pathogenic",
  "clinvar_review_status": "reviewed by expert panel",
  "clinvar_condition": "Hereditary breast and ovarian cancer syndrome",

  // gnomAD annotations
  "gnomad_af": 0.0001234,
  "gnomad_ac": 15,
  "gnomad_an": 121234,

  // Metadata
  "annotation_status": "completed",
  "annotated_at": "2024-02-26T22:45:00"
}
```

## Test 4: Verify Redis Caching

Make the same request twice and verify the second is faster (cached):

```bash
# First request (hits external APIs)
time curl http://localhost:8000/variants/{variant_id}

# Second request (should be faster, uses Redis cache)
time curl http://localhost:8000/variants/{variant_id}
```

Check Redis cache:
```bash
docker exec genemapr_redis redis-cli KEYS "*"
docker exec genemapr_redis redis-cli GET "clinvar:17-43044295-G-A"
```

## Test 5: Re-annotate Existing Variants

If you have variants from Phase 1 without annotations:

```bash
docker exec genemapr_backend python -m app.scripts.reannotate_all
```

Expected output:
```
Found 5 variants to annotate
Annotating variant 1/5: 17:43044295 G>A
  ✓ Successfully annotated
Annotating variant 2/5: 19:44908684 T>C
  ✓ Successfully annotated
...
Completed annotation of 5 variants
```

## Test 6: Run Unit Tests

```bash
docker exec genemapr_backend pytest tests/test_annotation_services.py -v
```

Expected output:
```
tests/test_annotation_services.py::test_clinvar_service_with_mock PASSED
tests/test_annotation_services.py::test_gnomad_service_with_mock PASSED
tests/test_annotation_services.py::test_ensembl_service_with_mock PASSED
tests/test_annotation_services.py::test_clinvar_graceful_degradation PASSED
tests/test_annotation_services.py::test_redis_cache_hit PASSED
```

## Test 7: Graceful Degradation

Test that the system handles API failures gracefully:

1. Stop internet connection temporarily
2. Upload a variant
3. Check that annotation_status becomes "failed" but the variant is still saved

Or simulate an API error:
```bash
# The system should still work if one API is down
# Variants will have null values for that source
```

## Known Test Variants

These variants have rich annotation data for testing:

| Chr | Pos | Ref | Alt | Gene | Expected Annotation |
|-----|-----|-----|-----|------|---------------------|
| 17 | 43044295 | G | A | BRCA1 | Pathogenic, well-studied |
| 19 | 44908684 | T | C | APOE | Common, population data |
| 7 | 117559590 | CTT | C | CFTR | Delta F508, pathogenic |
| 13 | 32379913 | G | A | BRCA2 | Pathogenic variant |

## Debugging

### Check logs:
```bash
docker logs genemapr_backend -f
```

### Check database:
```bash
docker exec -it genemapr_postgres psql -U genemapr_user -d genemapr

SELECT id, chrom, pos, ref, alt, gene_symbol, consequence, annotation_status
FROM variants
LIMIT 5;
```

### Check Redis:
```bash
docker exec genemapr_redis redis-cli
> KEYS *
> GET "ensembl:17-43044295-G-A"
> TTL "ensembl:17-43044295-G-A"
```

## Expected Behavior

✅ Upload triggers background annotation (doesn't block response)
✅ Each variant gets annotated from 3 sources (ClinVar, gnomAD, Ensembl)
✅ Results cached in Redis with 24-hour TTL
✅ Failed API calls result in null values, not crashes
✅ GET /variants/{id} returns full annotation details
✅ annotation_status tracks completion state

## Common Issues

**Issue**: Annotation stays "pending"
**Fix**: Check logs for errors. Verify Redis is running. Check internet connectivity.

**Issue**: All annotation fields are null
**Fix**: External APIs may be rate-limiting. Wait and try again. Check API URLs in config.

**Issue**: "UNIQUE constraint failed" on upload
**Fix**: Variant already exists. This is normal behavior - duplicates are skipped.
