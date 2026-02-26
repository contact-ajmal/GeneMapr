-- Migration to add annotation columns to variants table
-- Run this if you have existing data from Phase 1

-- Add Ensembl annotation columns
ALTER TABLE variants ADD COLUMN IF NOT EXISTS gene_symbol VARCHAR(100);
ALTER TABLE variants ADD COLUMN IF NOT EXISTS transcript_id VARCHAR(100);
ALTER TABLE variants ADD COLUMN IF NOT EXISTS consequence VARCHAR(200);
ALTER TABLE variants ADD COLUMN IF NOT EXISTS protein_change VARCHAR(200);

-- Add ClinVar annotation columns
ALTER TABLE variants ADD COLUMN IF NOT EXISTS clinvar_significance VARCHAR(200);
ALTER TABLE variants ADD COLUMN IF NOT EXISTS clinvar_review_status VARCHAR(200);
ALTER TABLE variants ADD COLUMN IF NOT EXISTS clinvar_condition TEXT;

-- Add gnomAD annotation columns
ALTER TABLE variants ADD COLUMN IF NOT EXISTS gnomad_af FLOAT;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS gnomad_ac INTEGER;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS gnomad_an INTEGER;

-- Add annotation metadata columns
ALTER TABLE variants ADD COLUMN IF NOT EXISTS annotation_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE variants ADD COLUMN IF NOT EXISTS annotated_at TIMESTAMP;
