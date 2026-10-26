# Reglas de Seguridad y Despliegue del Proyecto

## 1. Prohibición Estricta de SSH a Producción
- **EL ASISTENTE TIENE ESTRICTAMENTE PROHIBIDO EJECUTAR COMANDOS SSH HACIA EL SERVIDOR DE PRODUCCIÓN** (e.g. `ssh asamayoa@100.111.49.82` o cualquier otro host remoto).
- Toda operación en el servidor, reinicio de contenedores en producción y despliegue debe ser ejecutada manualmente por el usuario (Allan).
- El asistente únicamente debe:
  1. Trabajar en el código local (`/home/asamayoa/Development/CRM-PUBLIMATEC`).
  2. Hacer commits y push a GitHub (`origin main`).
  3. Proveer instrucciones claras y detalladas al usuario para que él ejecute las acciones en su servidor.

## 2. Protección de Base de Datos
- **NUNCA** incluir `npx prisma db push` en comandos automáticos de inicio de contenedores (`docker-compose.yml`).
- **NUNCA** incluir métodos destructivos como `prisma.*.deleteMany({})` en scripts de seed (`prisma/seed.ts`).
- Todo cambio de esquema para producción debe realizarse mediante migraciones controladas o generación de tipos con respaldo previo obligatorio.
