from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pathlib import Path
from uuid import UUID
import tempfile
import os

from app.core.database import get_db
from app.models.sample import Sample
from app.models.variant import Variant
from app.schemas.sample import (
    SampleResponse,
    ComparisonResponse,
    UploadWithSampleResponse,
)
from app.services.vcf_parser import parse_and_store_vcf
from app.services.annotation_service import annotate_variants_by_upload_id
from app.services.comparison_service import compare_samples

router = APIRouter(prefix="/samples", tags=["samples"])


@router.post("/upload", response_model=UploadWithSampleResponse)
async def upload_vcf_with_sample(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sample_name: str = Form(...),
    relationship_type: str = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a VCF file associated with a named sample.

    Creates a Sample record and associates all parsed variants with it.
    Triggers annotation in background after upload.
    """
    if not file.filename or not file.filename.endswith((".vcf", ".vcf.gz")):
        raise HTTPException(
            status_code=400,
            detail="File must be a VCF file (.vcf or .vcf.gz)",
        )

    # Validate relationship type
    valid_relationships = {"proband", "mother", "father", "sibling", "unrelated", None, ""}
    if relationship_type and relationship_type not in valid_relationships:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid relationship type. Must be one of: proband, mother, father, sibling, unrelated",
        )

    contents = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".vcf") as tmp_file:
        tmp_path = Path(tmp_file.name)
        tmp_file.write(contents)

    try:
        # Create sample record first
        import uuid

        sample = Sample(
            id=uuid.uuid4(),
            name=sample_name,
            filename=file.filename,
            relationship_type=relationship_type if relationship_type else None,
            upload_id=str(uuid.uuid4()),
        )
        db.add(sample)
        await db.flush()

        # Parse and store variants with sample_id
        variant_count, upload_id = await parse_and_store_vcf(
            tmp_path, db, upload_id=sample.upload_id, sample_id=sample.id
        )

        # Trigger annotation in background
        async def annotate_upload():
            from app.core.database import AsyncSessionLocal
            async with AsyncSessionLocal() as bg_db:
                await annotate_variants_by_upload_id(upload_id, bg_db)

        background_tasks.add_task(annotate_upload)

        return UploadWithSampleResponse(
            status="success",
            variant_count=variant_count,
            upload_id=upload_id,
            sample_id=str(sample.id),
            sample_name=sample.name,
            message=f"Successfully parsed {variant_count} variants for sample '{sample_name}'. Annotation in progress.",
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing VCF file: {str(e)}",
        )
    finally:
        if tmp_path.exists():
            os.unlink(tmp_path)


@router.get("", response_model=list[SampleResponse])
async def list_samples(db: AsyncSession = Depends(get_db)):
    """List all uploaded samples with variant counts."""
    result = await db.execute(
        select(Sample).order_by(Sample.created_at.desc())
    )
    samples = result.scalars().all()

    response = []
    for sample in samples:
        count_result = await db.execute(
            select(func.count())
            .select_from(Variant)
            .where(Variant.sample_id == sample.id)
        )
        variant_count = count_result.scalar_one()

        resp = SampleResponse(
            id=sample.id,
            name=sample.name,
            filename=sample.filename,
            relationship_type=sample.relationship_type,
            upload_id=sample.upload_id,
            created_at=sample.created_at,
            variant_count=variant_count,
        )
        response.append(resp)

    return response


@router.delete("/{sample_id}")
async def delete_sample(
    sample_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a sample and all its associated variants."""
    result = await db.execute(
        select(Sample).where(Sample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    # Delete variants first (cascade should handle this, but be explicit)
    await db.execute(
        delete(Variant).where(Variant.sample_id == sample_id)
    )
    await db.delete(sample)
    await db.commit()

    return {"status": "deleted", "sample_id": str(sample_id)}


@router.get("/compare", response_model=ComparisonResponse)
async def compare_sample_variants(
    sample_ids: str = Query(..., description="Comma-separated sample UUIDs"),
    db: AsyncSession = Depends(get_db),
):
    """
    Compare variants across multiple samples.

    Returns shared/unique variants, inheritance patterns (for trios),
    compound heterozygote candidates, and AI-generated summary.
    """
    try:
        ids = [UUID(sid.strip()) for sid in sample_ids.split(",")]
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid sample ID format"
        )

    if len(ids) < 2:
        raise HTTPException(
            status_code=400, detail="At least 2 sample IDs required"
        )

    if len(ids) > 10:
        raise HTTPException(
            status_code=400, detail="Maximum 10 samples for comparison"
        )

    try:
        result = await compare_samples(ids, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
