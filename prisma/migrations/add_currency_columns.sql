-- Migración Segura y No Destructiva para Soporte Multi-Moneda
-- Agrega columnas necesarias sin afectar ningún dato existente

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredCurrency" TEXT DEFAULT 'HNL';
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "exchangeRates" JSONB;
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "ratesUpdatedAt" TIMESTAMP(3) WITHOUT TIME ZONE;
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';
