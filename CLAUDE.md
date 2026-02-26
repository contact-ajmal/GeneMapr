# CLAUDE.md

## Project: GeneMapr
Genomic variant interpretation platform.

## Conventions
- Python: use ruff for linting, black for formatting
- All backend code uses async/await patterns
- Pydantic v2 model_validator syntax (not v1)
- SQLAlchemy 2.0 async style
- React: functional components only, no class components
- Use TypeScript strict mode
- All API calls through a centralized api client

## Key Decisions
- pysam for VCF parsing
- httpx for async HTTP
- Redis caching with 24hr TTL for external APIs
- PostgreSQL with UUID primary keys

## Testing
- pytest + pytest-asyncio for backend
- Vitest for frontend
```

## 3. Refine Your Prompt — Key Improvements

Your prompt is solid but here's what to adjust:

**Break it into phases.** One massive prompt often leads to incomplete files or shallow implementations. Instead:
```
Phase 1: "Set up the project structure, Docker config, database models, and backend skeleton with working /upload endpoint"

Phase 2: "Implement the annotation pipeline services (Ensembl, ClinVar, gnomAD) with Redis caching"

Phase 3: "Build the scoring engine and AI summary service"

Phase 4: "Build the complete React frontend"
```

**Add explicit constraints** that prevent common Claude Code issues:
```
- Do NOT use placeholder/stub implementations — write real working code
- Do NOT skip files — create every file listed in the structure
- Use pysam.VariantFile for VCF parsing (not manual regex)
- Ensure docker-compose services have health checks
- All Pydantic models must use Pydantic v2 syntax (model_config, not Config class)
- Use SQLAlchemy 2.0 mapped_column syntax, not Column()
```

## 4. Pin Dependency Versions

Add this to your prompt or CLAUDE.md:
```
fastapi>=0.115.0
pydantic>=2.6.0
sqlalchemy>=2.0.30
pysam>=0.22.0
httpx>=0.27.0
redis>=5.0.0
