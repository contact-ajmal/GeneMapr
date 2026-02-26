from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pathlib import Path
from uuid import UUID
import tempfile
import os

from app.core.database import get_db
from app.models.variant import Variant
from app.schemas.variant import VariantResponse, UploadResponse, VariantListResponse
from app.services.vcf_parser import parse_and_store_vcf
from app.services.annotation_service import annotate_variants_by_upload_id

router = APIRouter(prefix="/variants", tags=["variants"])


@router.post("/upload", response_model=UploadResponse)
async def upload_vcf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and parse a VCF file.

    Validates the file is a valid VCF, parses variants using pysam,
    normalizes them, and stores in PostgreSQL.
    Triggers annotation in background after upload.
    """
    # Validate file extension
    if not file.filename.endswith(('.vcf', '.vcf.gz')):
        raise HTTPException(
            status_code=400,
            detail="File must be a VCF file (.vcf or .vcf.gz)"
        )

    # Save uploaded file to temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.vcf') as tmp_file:
        tmp_path = Path(tmp_file.name)
        contents = await file.read()
        tmp_file.write(contents)

    try:
        # Parse and store variants
        variant_count, upload_id = await parse_and_store_vcf(tmp_path, db)

        # Trigger annotation in background
        # Note: We need to create a new db session for the background task
        async def annotate_upload():
            from app.core.database import AsyncSessionLocal
            async with AsyncSessionLocal() as bg_db:
                await annotate_variants_by_upload_id(upload_id, bg_db)

        background_tasks.add_task(annotate_upload)

        return UploadResponse(
            status="success",
            variant_count=variant_count,
            upload_id=upload_id,
            message=f"Successfully parsed and stored {variant_count} variants. Annotation in progress."
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing VCF file: {str(e)}"
        )

    finally:
        # Clean up temporary file
        if tmp_path.exists():
            os.unlink(tmp_path)


@router.get("", response_model=VariantListResponse)
async def get_variants(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of variants.

    Returns variants with pagination support.
    """
    # Calculate offset
    offset = (page - 1) * page_size

    # Get total count
    count_query = select(func.count()).select_from(Variant)
    result = await db.execute(count_query)
    total = result.scalar_one()

    # Get paginated variants
    query = select(Variant).offset(offset).limit(page_size).order_by(Variant.created_at.desc())
    result = await db.execute(query)
    variants = result.scalars().all()

    return VariantListResponse(
        variants=[VariantResponse.model_validate(v) for v in variants],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{variant_id}", response_model=VariantResponse)
async def get_variant(
    variant_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single variant by ID with full annotation details.

    Returns complete variant information including all annotation fields
    from ClinVar, gnomAD, and Ensembl.
    """
    # Query for the variant
    query = select(Variant).where(Variant.id == variant_id)
    result = await db.execute(query)
    variant = result.scalar_one_or_none()

    if not variant:
        raise HTTPException(
            status_code=404,
            detail=f"Variant with ID {variant_id} not found"
        )

    return VariantResponse.model_validate(variant)
