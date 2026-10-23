# CRM PixelMedia • Inversiones Publimatec S.A. de C.V.

Sistema comercial y de seguimiento de prospectos (*leads*) para **PixelMedia** ([pixelmediahn.com](https://pixelmediahn.com)), marca de **Inversiones Publimatec S.A. de C.V.**

---

## 🚀 Arquitectura y Tecnologías
- **Entorno:** Docker & Docker Compose (100% aislado, sin dependencias locales en el host).
- **Base de Datos:** PostgreSQL 16 (con volumen persistente `publimatec_crm_data`).
- **Backend & Frontend:** Next.js 14 (App Router) + TypeScript.
- **ORM:** Prisma ORM.
- **Estilos & Apariencia:** Tailwind CSS + Lucide Icons con **Selector de Tema Dinámico (Modo Claro / Modo Oscuro)** accesible desde el menú lateral y la barra superior, con persistencia en `localStorage`.
- **Seguridad:** Sesiones JWT cifradas con cookies `HttpOnly` y passwords encriptados con `bcryptjs`.

---

## 📦 Ejecución con Docker

### Iniciar el CRM
```bash
docker compose up -d
```
El CRM estará disponible de inmediato en:
👉 **http://localhost:3010**

### Ver los logs en vivo
```bash
docker compose logs -f publimatec_crm_app
```

### Detener los contenedores
```bash
docker compose down
```

---

## 👥 Credenciales de Acceso Iniciales

| Rol | Correo | Contraseña | Perfil |
| :--- | :--- | :--- | :--- |
| **Dirección (Admin)** | `admin@pixelmediahn.com` | `admin123` | Control total, métricas globales, asignación de leads y creación de vendedores. |
| **Asesor Comercial** | `carlos.ventas@pixelmediahn.com` | `ventas123` | Carlos Mendoza (gestión de sus prospectos, bitácora y embudo). |
| **Asesora Comercial** | `sofia.ventas@pixelmediahn.com` | `ventas123` | Sofía Reyes (gestión de sus prospectos, bitácora y embudo). |

*(En la pantalla de inicio de sesión cuentas con botones de "Cargar" para probar cada usuario con 1 solo clic).*

---

## 🎯 Módulos Implementados (Fase 1 MVP)

1. **Dashboard General (`/dashboard`):**
   - KPI de valor en negociación ($ USD), ventas ganadas, tasa de cierre y prospectos activos.
   - Alertas de **Próximos Seguimientos** con botón directo de WhatsApp.
   - Bitácora de actividades recientes del equipo comercial.

2. **Embudo de Ventas Visual Kanban (`/pipeline`):**
   - 6 etapas adaptadas a agencia: *Nuevo Prospecto*, *Diagnóstico / Contactado*, *Propuesta Enviada*, *En Negociación*, *Cerrado Ganado* y *Cerrado Perdido*.
   - Contadores y montos acumulados por etapa.
   - Avance/retroceso rápido de etapas con registro automático en la bitácora.
   - Filtros por vendedor, servicio y búsqueda en vivo.

3. **Directorio de Prospectos (`/leads` y `/leads/[id]`):**
   - Tabla interactiva con filtros por servicio y etapa.
   - Vista detallada del cliente con datos de contacto, notas de diagnóstico y fecha de seguimiento.
   - **Bitácora Cronológica:** Registro de llamadas, mensajes de WhatsApp, reuniones y correos con usuario responsable y fecha.
   - Disparador de **WhatsApp** con saludo personalizado según el proyecto.

4. **Equipo Comercial (`/team`):**
   - Listado de asesores y dirección con estadísticas individuales (leads totales, activos, cerrados y facturación ganada).
   - Formulario para que el administrador registre nuevos vendedores o active/desactive cuentas.

5. **Catálogo de Servicios (`/services`):**
   - Guía comercial de servicios de PixelMedia (*Branding*, *Desarrollo Web*, *Pauta & Social Media*, *Producción 4K*, *Estrategia 360*) con entregables y rangos de inversión de referencia.

---

## 🔮 Roadmap de Crecimiento (Próximas Fases)
- **Fase 2:** Generador de cotizaciones en PDF con catálogo y membrete oficial de Inversiones Publimatec.
- **Fase 3:** Webhook para captar leads en tiempo real desde formularios de `pixelmediahn.com`.
- **Fase 4:** Pase automático a operaciones / gestión de proyectos cuando una venta se marca como "Cerrado Ganado".
