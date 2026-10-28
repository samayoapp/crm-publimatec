-- Migración Segura de Alto Rendimiento: Índices Estratégicos para Consultas Rápidas
-- Permite que las búsquedas, embudo, contactos y dashboard respondan en milisegundos

CREATE INDEX IF NOT EXISTS "idx_contact_assigned_to" ON "Contact"("assignedToId");
CREATE INDEX IF NOT EXISTS "idx_contact_company" ON "Contact"("companyId");
CREATE INDEX IF NOT EXISTS "idx_contact_next_follow_up" ON "Contact"("nextFollowUp");
CREATE INDEX IF NOT EXISTS "idx_contact_updated_at" ON "Contact"("updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_proposal_assigned_to" ON "Proposal"("assignedToId");
CREATE INDEX IF NOT EXISTS "idx_proposal_contact" ON "Proposal"("contactId");
CREATE INDEX IF NOT EXISTS "idx_proposal_company" ON "Proposal"("companyId");
CREATE INDEX IF NOT EXISTS "idx_proposal_stage" ON "Proposal"("stage");
CREATE INDEX IF NOT EXISTS "idx_proposal_updated_at" ON "Proposal"("updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_activity_contact" ON "Activity"("contactId");
CREATE INDEX IF NOT EXISTS "idx_activity_proposal" ON "Activity"("proposalId");
CREATE INDEX IF NOT EXISTS "idx_activity_user" ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS "idx_activity_created_at" ON "Activity"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_company_name" ON "Company"("name");
