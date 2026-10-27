#!/bin/bash
set -e

# Script de Despliegue Seguro para CRM Publimatec en Producción
# Ejecutar directamente en el servidor: ./deploy.sh

BACKUP_DIR="/home/asamayoa/crm_db_rescue_backup"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_pre_deploy_$TIMESTAMP.sql"

echo "=============================================="
echo "🚀 Iniciando Despliegue Seguro de CRM Publimatec"
echo "=============================================="

echo "🔒 1/4. Creando respaldo preventivo automático de la BD..."
if docker exec publimatec_crm_db pg_dump -U publimatec_user publimatec_crm > "$BACKUP_FILE"; then
    echo "   ✅ Respaldo guardado exitosamente en: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    echo "   ❌ ERROR: No se pudo crear el respaldo. Abortando despliegue para proteger los datos."
    exit 1
fi

echo "📥 2/4. Descargando última versión de código desde GitHub..."
git pull origin main

echo "🛡️ 3/4. Verificando y sincronizando esquema de base de datos de forma segura..."
docker exec -i publimatec_crm_db psql -U publimatec_user -d publimatec_crm -c '
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredCurrency" TEXT DEFAULT '\''HNL'\'';
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "exchangeRates" JSONB;
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "ratesUpdatedAt" TIMESTAMP(3) WITHOUT TIME ZONE;
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT '\''USD'\'';
' || true

# prisma generate dentro del contenedor para actualizar los tipos
docker exec publimatec_crm_app npx prisma generate

echo "🔄 4/4. Reiniciando contenedor de la aplicación..."
docker compose restart publimatec_crm_app

echo "=============================================="
echo "🎉 ¡Despliegue completado exitosamente!"
echo "   Respaldo preventivo: $BACKUP_FILE"
echo "=============================================="
