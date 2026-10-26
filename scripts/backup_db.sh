#!/bin/bash
set -e

# ==============================================================
# Script de Respaldo Automático para CRM Publimatec (PostgreSQL)
# ==============================================================

BACKUP_DIR="/home/asamayoa/crm_backups"
DAYS_TO_KEEP=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/crm_publimatec_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Iniciando respaldo de PostgreSQL..."

# Ejecuta pg_dump dentro del contenedor y comprime directamente con gzip
if docker exec publimatec_crm_db pg_dump -U publimatec_user publimatec_crm | gzip > "$BACKUP_FILE"; then
    FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Respaldo generado con éxito: $BACKUP_FILE ($FILESIZE)"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: Falló la generación del respaldo."
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Elimina respaldos con más de 30 días para cuidar el espacio en disco
DELETED_COUNT=$(find "$BACKUP_DIR" -name "crm_publimatec_*.sql.gz" -mtime +$DAYS_TO_KEEP -type f | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    find "$BACKUP_DIR" -name "crm_publimatec_*.sql.gz" -mtime +$DAYS_TO_KEEP -type f -delete
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🧹 Limpieza: se eliminaron $DELETED_COUNT respaldos con más de $DAYS_TO_KEEP días."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✨ Proceso de respaldo completado."
