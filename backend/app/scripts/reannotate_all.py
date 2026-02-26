"""
Script to re-annotate all existing variants in the database.

Useful for:
- Annotating variants uploaded before annotation services were implemented
- Re-running annotation after API changes
- Refreshing cached annotation data
"""
import asyncio
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.variant import Variant
from app.services.annotation_service import annotate_variant


async def reannotate_all_variants():
    """
    Re-annotate all variants in the database.
    """
    async with AsyncSessionLocal() as db:
        # Fetch all variants
        query = select(Variant)
        result = await db.execute(query)
        variants = result.scalars().all()

        total = len(variants)
        print(f"Found {total} variants to annotate")

        # Annotate each variant
        for i, variant in enumerate(variants, 1):
            print(f"Annotating variant {i}/{total}: {variant.chrom}:{variant.pos} {variant.ref}>{variant.alt}")

            try:
                await annotate_variant(variant, db)
                print(f"  ✓ Successfully annotated")
            except Exception as e:
                print(f"  ✗ Error: {str(e)}")

        print(f"\nCompleted annotation of {total} variants")


if __name__ == "__main__":
    asyncio.run(reannotate_all_variants())
