import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not configured, skipping email notification.");
    return;
  }

  const mailOptions = {
    from: `"iamchomad.my.id" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    replyTo: data.email,
    subject: `✉️ Pesan baru dari ${data.name} — ${data.subject}`,
    html: `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Pesan Baru</title>
</head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 60%,#16213e 100%);border-radius:20px 20px 0 0;padding:40px 40px 36px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:rgba(255,255,255,0.08);border-radius:16px;margin-bottom:16px;">
                <span style="font-size:28px;">✉️</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.3px;">Pesan Baru Masuk</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.55);font-size:14px;">Ada yang mengirim pesan lewat form contact kamu</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;">

              <!-- INFO CARDS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <!-- Nama -->
                <tr>
                  <td style="padding:0 0 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;padding:16px 20px;">
                      <tr>
                        <td style="width:36px;vertical-align:middle;">
                          <div style="width:32px;height:32px;background:#7c3aed;border-radius:8px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:32px;font-size:15px;">👤</div>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="display:block;color:#7c3aed;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Nama</span>
                          <span style="display:block;color:#1f2937;font-size:15px;font-weight:600;margin-top:2px;">${data.name}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Email -->
                <tr>
                  <td style="padding:0 0 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;padding:16px 20px;">
                      <tr>
                        <td style="width:36px;vertical-align:middle;">
                          <div style="width:32px;height:32px;background:#2563eb;border-radius:8px;text-align:center;line-height:32px;font-size:15px;">📧</div>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="display:block;color:#2563eb;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Email</span>
                          <a href="mailto:${data.email}" style="display:block;color:#1f2937;font-size:15px;font-weight:600;margin-top:2px;text-decoration:none;">${data.email}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Subjek -->
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:16px 20px;">
                      <tr>
                        <td style="width:36px;vertical-align:middle;">
                          <div style="width:32px;height:32px;background:#16a34a;border-radius:8px;text-align:center;line-height:32px;font-size:15px;">💬</div>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="display:block;color:#16a34a;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Subjek</span>
                          <span style="display:block;color:#1f2937;font-size:15px;font-weight:600;margin-top:2px;">${data.subject}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- MESSAGE BOX -->
              <div style="border-left:4px solid #7c3aed;background:#fafafa;border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:32px;">
                <p style="margin:0 0 8px;color:#7c3aed;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Pesan</p>
                <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${data.message}</p>
              </div>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.2px;">
                      Balas Pesan →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 20px 20px;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">Email ini dikirim otomatis dari</p>
              <a href="https://iamchomad.my.id" style="color:#7c3aed;font-size:12px;font-weight:600;text-decoration:none;">iamchomad.my.id</a>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">Choiril Ahmad · Mad · @iamchomad</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
