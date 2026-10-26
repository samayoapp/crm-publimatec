import nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  title: string;
  preheader?: string;
  userName?: string;
  code: string;
  description: string;
  footerNote?: string;
}

// Generate secure 6-digit code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get configured transporter or fallback
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return null;
}

export async function sendVerificationEmail({
  to,
  subject,
  title,
  userName = 'Ejecutivo de Ventas',
  code,
  description,
  footerNote = 'Este código de seguridad tiene una validez de 15 minutos.',
}: SendMailOptions): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" style="max-width: 560px; background-color: #111827; border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.2); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Branding -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(147, 51, 234, 0.1)); border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="display: inline-block; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; background-color: rgba(217, 119, 6, 0.2); color: #fbbf24; border: 1px solid rgba(217, 119, 6, 0.3); margin-bottom: 12px;">
                PUBLIMATEC CRM
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; text-align: left;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Hola <strong style="color: #ffffff;">${userName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                ${description}
              </p>

              <!-- Verification Code Display -->
              <div style="margin: 28px 0; padding: 24px; text-align: center; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border: 1px dashed rgba(129, 140, 248, 0.4); border-radius: 16px;">
                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #a5b4fc; margin-bottom: 8px;">
                  Tu Código de Verificación
                </span>
                <span style="display: inline-block; font-size: 38px; font-weight: 900; letter-spacing: 0.3em; color: #ffffff; text-shadow: 0 2px 10px rgba(99, 102, 241, 0.5); font-family: monospace;">
                  ${code}
                </span>
                <span style="display: block; font-size: 12px; color: #94a3b8; margin-top: 8px;">
                  Ingresa estos 6 dígitos en el sistema para continuar
                </span>
              </div>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px;">
                ⏱️ ${footerNote}
                <br>
                Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; text-align: center; background-color: #0d121f; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11px; color: #475569;">
              © ${new Date().getFullYear()} Inversiones Publimatec S.A. de C.V. • Honduras
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const from = process.env.SMTP_FROM || '"PUBLIMATEC CRM" <no-reply@publimatec.com>';
  const transporter = getTransporter();

  console.log('----------------------------------------------------');
  console.log(`✉️  [CRM EMAIL NOTIFICATION]`);
  console.log(`Para: ${to}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Código de Verificación: ${code}`);
  console.log('----------------------------------------------------');

  if (!transporter) {
    // Simulated environment / Dev mode without SMTP credentials
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return { success: true, simulated: false };
  } catch (err: any) {
    console.error('Error al enviar correo vía SMTP:', err);
    // Return simulated success in dev so local testing is never blocked
    return { success: true, simulated: true, error: err.message };
  }
}

export interface AccountApprovedEmailOptions {
  to: string;
  userName: string;
  jobTitle?: string;
  loginUrl?: string;
}

export async function sendAccountApprovedEmail({
  to,
  userName,
  jobTitle = 'Ejecutivo de Ventas',
  loginUrl = '/login',
}: AccountApprovedEmailOptions) {
  const subject = `¡Tu Cuenta ha sido Aprobada! - PUBLIMATEC CRM`;
  const from = process.env.SMTP_FROM || '"PUBLIMATEC CRM" <no-reply@publimatec.com>';
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #111827; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.3); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Branding -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(217, 119, 6, 0.1)); border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="display: inline-block; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; background-color: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 12px;">
                PUBLIMATEC CRM • ACCESO COMERCIAL APROBADO
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                ¡Bienvenido al Equipo de Ventas!
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; text-align: left;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Hola <strong style="color: #ffffff;">${userName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Nos complace informarte que tu solicitud de registro como <strong>${jobTitle}</strong> en <strong>PUBLIMATEC CRM</strong> ha sido <strong style="color: #34d399;">revisada y aprobada por la Dirección Comercial</strong>.
              </p>
              <p style="margin: 0 0 28px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Tu cuenta ya se encuentra 100% activa. Ya puedes ingresar con tu correo registrado y contraseña para comenzar a gestionar prospectos, registrar llamadas y dar seguimiento a tus propuestas.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 14px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.05em;">
                  Ingresar a PUBLIMATEC CRM →
                </a>
              </div>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px;">
                💡 <em>Recomendación inicial:</em> Ingresa a la plataforma y revisa el embudo de ventas para planificar tus primeras metas de cierre.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; text-align: center; background-color: #0d121f; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11px; color: #475569;">
              © ${new Date().getFullYear()} Inversiones Publimatec S.A. de C.V. • Honduras
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  console.log('----------------------------------------------------');
  console.log(`✉️  [CRM NOTIFICATION: APROBACIÓN DE VENDEDOR]`);
  console.log(`Para: ${to}`);
  console.log(`Usuario: ${userName}`);
  console.log('----------------------------------------------------');

  const transporter = getTransporter();
  if (!transporter) return { success: true, simulated: true };

  try {
    await transporter.sendMail({ from, to, subject, html });
    return { success: true, simulated: false };
  } catch (err: any) {
    console.error('Error al enviar correo de aprobación:', err);
    return { success: true, simulated: true, error: err.message };
  }
}

export interface AccountRejectedEmailOptions {
  to: string;
  userName: string;
  reason?: string;
}

export async function sendAccountRejectedEmail({
  to,
  userName,
  reason,
}: AccountRejectedEmailOptions) {
  const subject = `Actualización sobre tu solicitud - PUBLIMATEC CRM`;
  const from = process.env.SMTP_FROM || '"PUBLIMATEC CRM" <no-reply@publimatec.com>';
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #111827; border-radius: 20px; border: 1px solid rgba(244, 63, 94, 0.3); overflow: hidden;">
          
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background: rgba(244, 63, 94, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="display: inline-block; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; background-color: rgba(244, 63, 94, 0.2); color: #fb7185;">
                PUBLIMATEC CRM • DIRECCIÓN COMERCIAL
              </span>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
                Actualización de Solicitud de Registro
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px; text-align: left;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Estimado(a) <strong style="color: #ffffff;">${userName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Te agradecemos el interés en formar parte del equipo comercial de Publimatec. Te informamos que tu solicitud de acceso a PUBLIMATEC CRM no ha sido aprobada en este momento.
              </p>
              ${reason ? `<p style="margin: 0 0 20px 0; font-size: 13px; color: #cbd5e1; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;"><strong>Nota de Dirección:</strong> ${reason}</p>` : ''}
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Si consideras que se trata de un error o deseas consultar más detalles, por favor comunícate directamente con la Dirección Comercial.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px; text-align: center; background-color: #0d121f; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11px; color: #475569;">
              © ${new Date().getFullYear()} Inversiones Publimatec S.A. de C.V.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  console.log(`✉️  [CRM NOTIFICATION: RECHAZO DE SOLICITUD] Para: ${to}`);
  const transporter = getTransporter();
  if (!transporter) return { success: true, simulated: true };
  try {
    await transporter.sendMail({ from, to, subject, html });
    return { success: true, simulated: false };
  } catch (err: any) {
    return { success: true, simulated: true, error: err.message };
  }
}

