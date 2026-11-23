-- Migración idempotente: Etiquetas de color para tarjetas del Embudo Kanban
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "labelId" TEXT;
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "pipelineLabels" JSONB;
CREATE INDEX IF NOT EXISTS "Proposal_labelId_idx" ON "Proposal"("labelId");
