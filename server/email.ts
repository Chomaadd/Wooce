import nodemailer from "nodemailer";
import path from "path";
import { Resend } from "resend";
import { getEffectiveConfig } from "./site-config";

const LOGO_CID = "logo@wooce-novel";
const LOGO_PATH = path.resolve("public/image/icon-email-new.png");

const logoAttachment = {
  filename: "icon-email-new.png",
  path: LOGO_PATH,
  cid: LOGO_CID,
};

async function getBaseUrl(): Promise<string> {
  const config = await getEffectiveConfig();
  const raw = config.siteUrl ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://wooce-novel.replit.app");
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

const emailWrapper = (headerBg: string, headerTitle: string, headerSub: string, bodyContent: string, BASE_URL: string) => {
  return `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Top accent bar -->
        <tr>
          <td style="background:${headerBg};height:4px;padding:0;"></td>
        </tr>

        <!-- Header: Logo -->
        <tr>
          <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #f0f0f0;">
            <img src="${BASE_URL}/image/icon-email-new.png" alt="WOOCE Novel" style="height:56px;width:auto;max-width:280px;display:block;margin:0 auto;border-radius:6px;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${headerTitle}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">${headerSub}</p>
            ${bodyContent}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">

            <!-- Social Media -->
            <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 16px auto;">
              <tr>
                <!-- TikTok -->
                <td style="padding:0 5px;">
                  <a href="https://www.tiktok.com/@woocenovel" target="_blank" style="display:block;width:38px;height:38px;background:#18181b;border-radius:9px;text-decoration:none;" title="TikTok">
                    <table cellpadding="0" cellspacing="0" width="38" height="38"><tr><td align="center" valign="middle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.66a8.16 8.16 0 0 0 4.77 1.52V6.7a4.85 4.85 0 0 1-1-.01z"/>
                      </svg>
                    </td></tr></table>
                  </a>
                </td>
                <!-- Facebook -->
                <td style="padding:0 5px;">
                  <a href="https://www.facebook.com/woocenovel" target="_blank" style="display:block;width:38px;height:38px;background:#18181b;border-radius:9px;text-decoration:none;" title="Facebook">
                    <table cellpadding="0" cellspacing="0" width="38" height="38"><tr><td align="center" valign="middle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"/>
                      </svg>
                    </td></tr></table>
                  </a>
                </td>
                <!-- Instagram -->
                <td style="padding:0 5px;">
                  <a href="https://instagram.com/woocenovel" target="_blank" style="display:block;width:38px;height:38px;background:#18181b;border-radius:9px;text-decoration:none;" title="Instagram">
                    <table cellpadding="0" cellspacing="0" width="38" height="38"><tr><td align="center" valign="middle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                      </svg>
                    </td></tr></table>
                  </a>
                </td>
              </tr>
            </table>

            <!-- Policy links -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr><td align="center">
                <a href="${BASE_URL}/privacy" style="color:#6b7280;font-size:12px;text-decoration:underline;margin:0 8px;">Kebijakan Privasi</a>
                <span style="color:#d1d5db;font-size:12px;">|</span>
                <a href="${BASE_URL}/terms" style="color:#6b7280;font-size:12px;text-decoration:underline;margin:0 8px;">Syarat &amp; Ketentuan</a>
                <span style="color:#d1d5db;font-size:12px;">|</span>
                <a href="${BASE_URL}/contact" style="color:#6b7280;font-size:12px;text-decoration:underline;margin:0 8px;">Pusat Bantuan</a>
              </td></tr>
            </table>

            <!-- Disclaimer -->
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
              Email ini dikirim otomatis oleh WOOCE Novel. Mohon jangan membalas email ini.<br/>
              &copy; 2026 Choomad Group. Seluruh hak cipta dilindungi.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

function createGmailTransport(user: string, pass: string) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

/**
 * Buat transport terpadu:
 * - Jika RESEND_API_KEY ada → pakai Resend HTTP API (tidak diblokir Railway)
 * - Jika tidak → fallback ke Gmail SMTP
 */
function createUnifiedTransport(baseUrl: string, gmailUser?: string, gmailPass?: string, resendKey?: string, resendFrom?: string): { sendMail: (opts: any) => Promise<any> } {
  if (resendKey) {
    const resend = new Resend(resendKey);
    const fromAddr = resendFrom || process.env.RESEND_FROM_EMAIL || "WOOCE Novel <onboarding@resend.dev>";

    return {
      sendMail: async (opts: any) => {
        // Ganti CID logo dengan URL publik agar Resend bisa render gambar
        const html = typeof opts.html === "string"
          ? opts.html.replace(`cid:${LOGO_CID}`, `${baseUrl}/image/icon-email-new.png`)
          : opts.html || "";

        // Ambil lampiran non-logo (misal: PDF backup)
        const attachments = (opts.attachments as any[] || [])
          .filter((a: any) => a.cid !== LOGO_CID && !a.cid)
          .map((a: any) => ({
            filename: a.filename,
            content: a.content instanceof Buffer ? a.content.toString("base64") : a.content,
          }));

        const payload: any = {
          from: fromAddr,
          to: [opts.to as string],
          subject: opts.subject as string,
          html,
        };
        if (opts.replyTo) payload.reply_to = opts.replyTo;
        if (attachments.length > 0) payload.attachments = attachments;

        const { error } = await resend.emails.send(payload);
        if (error) throw new Error(`Resend error: ${(error as any).message || JSON.stringify(error)}`);
      },
    };
  }

  // Fallback: Gmail SMTP (berfungsi di Replit, tidak berfungsi di Railway)
  if (gmailUser && gmailPass) {
    return createGmailTransport(gmailUser, gmailPass) as any;
  }

  throw new Error("Tidak ada provider email aktif. Set RESEND_API_KEY atau konfigurasi Gmail.");
}

async function guard(fn: (t: ReturnType<typeof nodemailer.createTransport>, from: string, baseUrl: string) => Promise<any>): Promise<void> {
  const config = await getEffectiveConfig();
  const resendKey = config.resendApiKey;
  const hasResend = !!resendKey;
  const hasGmail = !!(config.gmailUser && config.gmailAppPassword);

  if (!hasResend && !hasGmail) {
    console.warn("[Email] Tidak ada provider email dikonfigurasi, email dilewati.");
    return;
  }

  try {
    const baseUrl = await getBaseUrl();
    const t = createUnifiedTransport(baseUrl, config.gmailUser, config.gmailAppPassword, resendKey, config.resendFromEmail) as any;
    const fromLabel = hasResend ? (config.resendFromEmail || "onboarding@resend.dev") : config.gmailUser!;
    await fn(t, fromLabel, baseUrl);
  } catch (err) {
    console.error("[Email] guard error:", err);
  }
}

async function guardSupport(fn: (t: ReturnType<typeof nodemailer.createTransport>, from: string, baseUrl: string) => Promise<any>): Promise<void> {
  const config = await getEffectiveConfig();
  const resendKey = config.resendApiKey;
  const hasResend = !!resendKey;
  const hasGmail = !!(config.gmailUser && config.gmailAppPassword);

  if (!hasResend && !hasGmail) {
    console.warn("[Email] Tidak ada provider email dikonfigurasi, email dilewati.");
    return;
  }

  try {
    const baseUrl = await getBaseUrl();
    const supportFrom = config.resendSupportEmail || config.resendFromEmail || (hasGmail ? config.gmailUser! : "onboarding@resend.dev");
    const t = createUnifiedTransport(baseUrl, config.gmailUser, config.gmailAppPassword, resendKey, supportFrom) as any;
    await fn(t, supportFrom, baseUrl);
  } catch (err) {
    console.error("[Email] guard error:", err);
  }
}

async function guardStrict(fn: (t: ReturnType<typeof nodemailer.createTransport>, from: string, baseUrl: string) => Promise<any>): Promise<void> {
  const config = await getEffectiveConfig();
  const resendKey = config.resendApiKey;
  const hasResend = !!resendKey;
  const hasGmail = !!(config.gmailUser && config.gmailAppPassword);

  if (!hasResend && !hasGmail) {
    throw new Error("Tidak ada provider email aktif. Atur Resend API Key di halaman Credentials, atau konfigurasi Gmail.");
  }

  const baseUrl = await getBaseUrl();
  const t = createUnifiedTransport(baseUrl, config.gmailUser, config.gmailAppPassword, resendKey, config.resendFromEmail) as any;
  const fromLabel = hasResend ? (config.resendFromEmail || "onboarding@resend.dev") : config.gmailUser!;
  await fn(t, fromLabel, baseUrl);
}

export async function sendContactNotification(data: { name: string; email: string; subject: string; message: string }) {
  return guardSupport((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to: from,
    replyTo: data.email,
    subject: `Pesan baru dari ${data.name} — ${data.subject}`,
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#1a1a2e 0%,#0f3460 60%,#16213e 100%)",
      "Pesan Baru Masuk",
      "Ada yang mengirim pesan lewat form contact",
      `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="padding:0 0 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;padding:14px 18px;">
            <tr>
              <td><span style="color:#7c3aed;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Nama</span><br/>
              <span style="color:#1f2937;font-size:15px;font-weight:600;">${data.name}</span></td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 0 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;padding:14px 18px;">
            <tr><td><span style="color:#2563eb;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Email</span><br/>
              <a href="mailto:${data.email}" style="color:#1f2937;font-size:15px;font-weight:600;text-decoration:none;">${data.email}</a></td></tr>
          </table>
        </td></tr>
      </table>
      <div style="border-left:4px solid #7c3aed;background:#fafafa;border-radius:0 12px 12px 0;padding:18px 22px;margin-bottom:28px;">
        <p style="margin:0 0 6px;color:#7c3aed;font-size:11px;font-weight:600;text-transform:uppercase;">Pesan</p>
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${data.message}</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:50px;">Balas Pesan</a>
      </td></tr></table>`,
      BASE_URL
    ),
  }));
}

export async function sendWriterPendingEmail(to: string, name: string) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Pengajuan Penulismu Sedang Ditinjau — WOOCE Novel",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#78350f 0%,#92400e 60%,#78350f 100%)",
      "Pengajuan Sedang Ditinjau",
      "Kami sudah menerima permohonanmu",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Permohonanmu untuk menjadi <strong>penulis di WOOCE Novel</strong> sudah kami terima dan sedang dalam proses peninjauan oleh tim admin.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">Proses peninjauan biasanya berlangsung <strong>1-3 hari kerja</strong>. Kamu akan mendapat email lanjutan setelah keputusan diambil.</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Sambil menunggu, kamu tetap bisa menikmati semua novel di platform kami.</p>`,
      BASE_URL
    ),
  }));
}

export async function sendWriterApprovedEmail(to: string, name: string) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Selamat! Kamu Diterima sebagai Penulis WOOCE Novel",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#064e3b 0%,#065f46 60%,#064e3b 100%)",
      "Pengajuan Diterima!",
      "Selamat bergabung sebagai penulis WOOCE Novel",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kabar baik! Pengajuanmu untuk menjadi penulis di <strong>WOOCE Novel</strong> telah <strong>disetujui</strong>. Kamu sekarang bisa mulai menulis dan mempublikasikan karyamu!</p>
      <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0 0 10px;color:#065f46;font-size:14px;font-weight:600;">Yang bisa kamu lakukan sekarang:</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
          <li>Upload cover dan buat cerita pertamamu</li>
          <li>Atur season dan jadwal rilis chapter</li>
          <li>Pantau statistik pembaca dari dashboard</li>
        </ul>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <a href="${BASE_URL}/writer/cerita" style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:50px;">Buka Dashboard Penulis</a>
      </td></tr></table>`,
      BASE_URL
    ),
  }));
}

export async function sendWriterRejectedEmail(to: string, name: string) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Pengajuan Penulis Ditolak — Bisa Coba Lagi dalam 7 Hari",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#7f1d1d 0%,#991b1b 60%,#7f1d1d 100%)",
      "Pengajuan Tidak Disetujui",
      "Jangan menyerah, kamu bisa coba lagi",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Setelah ditinjau, pengajuanmu untuk menjadi penulis di <strong>WOOCE Novel</strong> belum bisa kami setujui saat ini.</p>
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.6;">Kamu bisa mengajukan permohonan kembali setelah <strong>7 hari</strong> dari sekarang. Pastikan profilmu sudah lengkap sebelum mendaftar ulang.</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Tetap semangat menulis! Kami selalu terbuka untuk pengajuan berikutnya.</p>`,
      BASE_URL
    ),
  }));
}

export async function sendOtpEmail(to: string, name: string, otp: string) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Kode Verifikasi Hapus Akun — WOOCE Novel",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#7f1d1d 0%,#991b1b 60%,#7f1d1d 100%)",
      "Verifikasi Penghapusan Akun",
      "Masukkan kode OTP untuk mengonfirmasi",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami menerima permintaan untuk <strong>menghapus akunmu</strong> di WOOCE Novel. Gunakan kode OTP berikut untuk melanjutkan:</p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#7f1d1d,#991b1b);border-radius:16px;padding:20px 40px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#ffffff;font-family:monospace;">${otp}</span>
        </div>
      </div>
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:14px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">Kode ini berlaku selama <strong>10 menit</strong>. Jika kamu tidak meminta ini, abaikan email ini — akunmu aman.</p>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;text-align:center;">Penghapusan akun bersifat <strong>permanen</strong> dan tidak dapat dibatalkan.</p>`,
      BASE_URL
    ),
  }));
}

export async function sendAccountDeletedByAdminEmail(to: string, name: string) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Akunmu di WOOCE Novel Telah Dihapus",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#1f2937 0%,#111827 60%,#1f2937 100%)",
      "Akun Dihapus",
      "Pemberitahuan resmi dari WOOCE Novel",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami memberitahu bahwa akunmu di <strong>WOOCE Novel</strong> telah <strong>dihapus permanen</strong> oleh tim admin karena melanggar standar komunitas, ketentuan layanan, dan/atau kebijakan privasi platform kami.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">Semua data yang terkait dengan akunmu telah dihapus dari sistem kami. Jika kamu merasa ini adalah kesalahan, silakan hubungi kami melalui halaman kontak.</p>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Terima kasih atas pemahaman dan kerja samamu.</p>`,
      BASE_URL
    ),
  }));
}

export async function sendWriterAccountDeletedByAdminEmail(to: string, name: string, pdfBuffer: Buffer) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Akun Penulismu Dihapus — Backup Cerita Terlampir",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    attachments: [
      {
        filename: `backup-cerita-${name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
    html: emailWrapper(
      "linear-gradient(135deg,#1f2937 0%,#111827 60%,#1f2937 100%)",
      "Akun Penulis Dihapus",
      "Backup cerita kamu terlampir di email ini",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Akunmu sebagai penulis di <strong>WOOCE Novel</strong> telah <strong>dihapus permanen</strong> oleh tim admin karena melanggar standar komunitas dan ketentuan layanan kami.</p>
      <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#065f46;font-size:13px;font-weight:600;">Backup Cerita</p>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">Kami telah menyertakan <strong>file PDF backup</strong> berisi semua data cerita yang pernah kamu tulis di platform ini sebagai lampiran email ini. Harap simpan file tersebut.</p>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Jika kamu merasa ini adalah kesalahan, silakan hubungi kami melalui halaman kontak.</p>`,
      BASE_URL
    ),
  }));
}

export async function sendSelfDeleteConfirmedEmail(to: string, name: string) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Akunmu Berhasil Dihapus — WOOCE Novel",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#374151 0%,#1f2937 60%,#374151 100%)",
      "Akun Berhasil Dihapus",
      "Permintaanmu telah diproses",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Akunmu di <strong>WOOCE Novel</strong> telah berhasil dihapus sesuai permintaanmu. Semua data akun telah dihapus dari sistem kami.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">Terima kasih sudah menjadi bagian dari WOOCE Novel. Kamu selalu bisa mendaftar ulang kapan saja.</p>
      </div>`,
      BASE_URL
    ),
  }));
}

export async function sendWriterSelfDeleteConfirmedEmail(to: string, name: string, pdfBuffer: Buffer) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Akunmu Dihapus — Backup Cerita Terlampir",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    attachments: [
      {
        filename: `backup-cerita-${name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
    html: emailWrapper(
      "linear-gradient(135deg,#374151 0%,#1f2937 60%,#374151 100%)",
      "Akun Berhasil Dihapus",
      "Backup cerita kamu terlampir",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Akunmu di <strong>WOOCE Novel</strong> telah berhasil dihapus sesuai permintaanmu.</p>
      <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#065f46;font-size:13px;font-weight:600;">File Backup Ceritamu</p>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">Semua data cerita yang pernah kamu tulis sudah kami kemas dalam <strong>file PDF</strong> yang terlampir. Harap simpan file ini sebagai arsibmu.</p>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Terima kasih sudah menjadi bagian dari WOOCE Novel. Semoga karyamu terus berkembang!</p>`,
      BASE_URL
    ),
  }));
}

export async function sendStoryDeletedByWriterEmail(to: string, writerName: string, storyTitle: string, pdfBuffer: Buffer) {
  const safeFilename = storyTitle.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: `Backup Novel "${storyTitle}" — WOOCE Novel`,
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    attachments: [
      {
        filename: `backup-novel-${safeFilename}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
    html: emailWrapper(
      "linear-gradient(135deg,#5b21b6 0%,#7c3aed 60%,#4c1d95 100%)",
      "Backup Novel Tersimpan",
      `"${storyTitle}" telah dihapus dari platform`,
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${writerName}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Novel <strong>"${storyTitle}"</strong> telah berhasil dihapus dari WOOCE Novel sesuai permintaanmu.</p>
      <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#065f46;font-size:13px;font-weight:600;">📄 File Backup Terlampir</p>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">Kami telah menyiapkan <strong>backup lengkap</strong> seluruh isi novel ini — semua season dan chapter — dalam file PDF yang terlampir. Simpan file ini sebagai arsip pribadimu.</p>
      </div>
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:14px;padding:16px 22px;margin-bottom:24px;">
        <p style="margin:0;color:#5b21b6;font-size:13px;line-height:1.6;">Karya yang pernah kamu tulis adalah bagian dari perjalananmu. Siapa tahu suatu saat kamu ingin melanjutkannya kembali — dan kami selalu terbuka untukmu. ✨</p>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Terima kasih sudah berkarya di WOOCE Novel, <strong>${writerName}</strong>. Sampai jumpa di karya selanjutnya!</p>`,
      BASE_URL
    ),
  }));
}

export async function sendWriterSuspendedEmail(to: string, name: string) {
  return guard((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Akun Penulismu di WOOCE Novel Telah Disuspend",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#7c2d12 0%,#9a3412 60%,#7c2d12 100%)",
      "Akun Disuspend",
      "Tindakan diperlukan pada akunmu",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami ingin memberitahu bahwa akun penulismu di <strong>WOOCE Novel</strong> telah <strong>disuspend</strong> oleh tim admin karena melanggar panduan konten platform.</p>
      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.6;">Akses ke dashboard penulis dan manajemen ceritamu sementara dinonaktifkan. Kamu bisa mengajukan permohonan kembali setelah <strong>30 hari</strong>.</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Jika kamu merasa ini adalah kesalahan, hubungi tim kami melalui halaman kontak.</p>`,
      BASE_URL
    ),
  }));
}

export async function sendStoryRemovedByReportEmail(
  to: string,
  name: string,
  storyTitle: string,
  reason: string,
  pdfBuffer: Buffer
) {
  const safeFilename = storyTitle.replace(/[^a-z0-9\s]/gi, "_").replace(/\s+/g, "_") + "_backup.pdf";
  return guardSupport((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: `Ceritamu "${storyTitle}" Telah Dihapus — WOOCE Novel`,
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    attachments: [
      { filename: safeFilename, content: pdfBuffer, contentType: "application/pdf" },
    ],
    html: emailWrapper(
      "linear-gradient(135deg,#7c1d1d 0%,#991b1b 60%,#7c2d12 100%)",
      "Cerita Dihapus dari Platform",
      "Konten melanggar ketentuan WOOCE Novel",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami ingin memberitahukan bahwa ceritamu <strong>"${storyTitle}"</strong> telah <strong>dihapus permanen</strong> dari platform WOOCE Novel setelah ditinjau oleh tim admin.</p>
      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 6px;color:#9a3412;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Alasan Penghapusan</p>
        <p style="margin:0;color:#7c2d12;font-size:15px;font-weight:600;">${reason}</p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:14px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0 0 6px;color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">File Backup Terlampir</p>
        <p style="margin:0;color:#15803d;font-size:14px;line-height:1.6;">Seluruh konten ceritamu (semua season dan chapter) telah kami simpankan dalam file PDF yang terlampir di email ini. Silakan simpan file tersebut sebagai arsip pribadimu.</p>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Jika kamu merasa penghapusan ini adalah kesalahan, hubungi tim kami melalui halaman <a href="${BASE_URL}/kontak" style="color:#7c3aed;">Kontak</a> di platform.</p>`,
      BASE_URL
    ),
  }));
}

export function generateEmailHtml(type: string, baseUrl: string): string {
  const wrap = (bg: string, title: string, sub: string, body: string) =>
    emailWrapper(bg, title, sub, body, baseUrl);

  switch (type) {
    case "otp":
      return wrap(
        "linear-gradient(90deg,#dc2626,#b91c1c)",
        "Verifikasi Penghapusan Akun",
        "Masukkan kode OTP untuk mengonfirmasi",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>Choiril</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami menerima permintaan untuk <strong>menghapus akunmu</strong> di WOOCE Novel. Gunakan kode OTP berikut:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td align="center">
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:24px 40px;display:inline-block;">
            <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#7c3aed;font-family:'Courier New',monospace;">482916</span>
          </div>
        </td></tr></table>
        <div style="background:#fff7ed;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">Kode ini berlaku selama <strong>10 menit</strong>. Jika kamu tidak meminta ini, abaikan email ini — akunmu aman.</p>
        </div>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;text-align:center;">Penghapusan akun bersifat <strong>permanen</strong> dan tidak dapat dibatalkan.</p>`
      );

    case "writer-pending":
      return wrap(
        "linear-gradient(90deg,#d97706,#b45309)",
        "Pengajuan Sedang Ditinjau",
        "Kami sudah menerima permohonanmu",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>Choiril</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Permohonanmu untuk menjadi <strong>penulis di WOOCE Novel</strong> sudah kami terima dan sedang dalam proses peninjauan oleh tim admin.</p>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
          <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">Proses peninjauan biasanya berlangsung <strong>1-3 hari kerja</strong>. Kamu akan mendapat email lanjutan setelah keputusan diambil.</p>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Sambil menunggu, kamu tetap bisa menikmati semua novel di platform kami.</p>`
      );

    case "writer-approved":
      return wrap(
        "linear-gradient(90deg,#059669,#10b981)",
        "Pengajuan Diterima! 🎉",
        "Selamat bergabung sebagai penulis WOOCE Novel",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>Choiril</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kabar baik! Pengajuanmu untuk menjadi penulis di <strong>WOOCE Novel</strong> telah <strong>disetujui</strong>. Kamu sekarang bisa mulai menulis dan mempublikasikan karyamu!</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#065f46;">Yang bisa kamu lakukan sekarang:</p>
          <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.9;">
            <li>Upload cover dan buat cerita pertamamu</li>
            <li>Atur season dan jadwal rilis chapter</li>
            <li>Pantau statistik pembaca dari dashboard</li>
          </ul>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <a href="${baseUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:6px;">Buka Dashboard Penulis</a>
        </td></tr></table>`
      );

    case "writer-rejected":
      return wrap(
        "linear-gradient(90deg,#dc2626,#b91c1c)",
        "Pengajuan Tidak Disetujui",
        "Jangan menyerah, kamu bisa coba lagi",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>Choiril</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Setelah ditinjau, pengajuanmu untuk menjadi penulis di <strong>WOOCE Novel</strong> belum bisa kami setujui saat ini.</p>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
          <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.6;">Kamu bisa mengajukan permohonan kembali setelah <strong>7 hari</strong>. Pastikan profilmu sudah lengkap sebelum mendaftar ulang.</p>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Tetap semangat menulis! Kami selalu terbuka untuk pengajuan berikutnya.</p>`
      );

    case "writer-suspended":
      return wrap(
        "linear-gradient(90deg,#ea580c,#c2410c)",
        "Akun Disuspend",
        "Tindakan diperlukan pada akunmu",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>Choiril</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami ingin memberitahu bahwa akun penulismu di <strong>WOOCE Novel</strong> telah <strong>disuspend</strong> oleh tim admin karena melanggar panduan konten platform.</p>
        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
          <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.6;">Akses ke dashboard penulis sementara dinonaktifkan. Kamu bisa mengajukan permohonan kembali setelah <strong>30 hari</strong>.</p>
        </div>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Jika kamu merasa ini adalah kesalahan, hubungi tim kami melalui halaman kontak.</p>`
      );

    case "account-deleted":
      return wrap(
        "linear-gradient(90deg,#374151,#111827)",
        "Akun Dihapus",
        "Pemberitahuan resmi dari WOOCE Novel",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>Choiril</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami memberitahu bahwa akunmu di <strong>WOOCE Novel</strong> telah <strong>dihapus permanen</strong> oleh tim admin karena melanggar standar komunitas dan ketentuan layanan kami.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">Semua data yang terkait dengan akunmu telah dihapus dari sistem kami. Jika kamu merasa ini adalah kesalahan, silakan hubungi kami melalui halaman kontak.</p>
        </div>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Terima kasih atas pemahaman dan kerja samamu.</p>`
      );

    case "story-backup":
      return wrap(
        "linear-gradient(90deg,#5b21b6,#7c3aed)",
        "Backup Novel Tersimpan",
        "Novel telah dihapus dari platform",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>Choiril</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Novel <strong>"Jejak Abyss"</strong> telah berhasil dihapus dari WOOCE Novel sesuai permintaanmu.</p>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#065f46;font-size:13px;font-weight:600;">📄 File Backup Terlampir</p>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">Kami telah menyiapkan <strong>backup lengkap</strong> seluruh isi novel ini dalam file PDF yang terlampir. Simpan file ini sebagai arsip pribadimu.</p>
        </div>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:14px;padding:16px 22px;margin-bottom:24px;">
          <p style="margin:0;color:#5b21b6;font-size:13px;line-height:1.6;">Karya yang pernah kamu tulis adalah bagian dari perjalananmu. Siapa tahu suatu saat kamu ingin melanjutkannya kembali — dan kami selalu terbuka untukmu. ✨</p>
        </div>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Terima kasih sudah berkarya di WOOCE Novel, <strong>Choiril</strong>. Sampai jumpa di karya selanjutnya!</p>`
      );

    case "contact":
      return wrap(
        "linear-gradient(90deg,#2563eb,#1d4ed8)",
        "Pesan Baru Masuk",
        "Ada yang mengirim pesan lewat form contact",
        `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="padding:0 0 10px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;padding:14px 18px;">
              <tr><td><span style="color:#7c3aed;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Nama</span><br/>
              <span style="color:#1f2937;font-size:15px;font-weight:600;">Choiril Ahmad</span></td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 0 10px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;padding:14px 18px;">
              <tr><td><span style="color:#2563eb;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Email</span><br/>
              <span style="color:#1f2937;font-size:15px;font-weight:600;">choiril@example.com</span></td></tr>
            </table>
          </td></tr>
        </table>
        <div style="border-left:4px solid #7c3aed;background:#fafafa;border-radius:0 12px 12px 0;padding:18px 22px;margin-bottom:28px;">
          <p style="margin:0 0 6px;color:#7c3aed;font-size:11px;font-weight:600;text-transform:uppercase;">Pesan</p>
          <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">Halo, saya ingin bertanya mengenai cara mendaftar sebagai penulis di platform WOOCE Novel. Terima kasih!</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <a href="#" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:50px;">Balas Pesan</a>
        </td></tr></table>`
      );

    case "story-report-removed":
      return wrap(
        "linear-gradient(90deg,#dc2626,#9a3412)",
        "Cerita Dihapus dari Platform",
        "Konten melanggar ketentuan WOOCE Novel",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>Choiril</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami ingin memberitahukan bahwa ceritamu <strong>"Jejak Abyss"</strong> telah <strong>dihapus permanen</strong> dari platform WOOCE Novel setelah ditinjau oleh tim admin.</p>
        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:18px 22px;margin:0 0 24px;">
          <p style="margin:0 0 6px;color:#9a3412;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Alasan Penghapusan</p>
          <p style="margin:0;color:#7c2d12;font-size:15px;font-weight:600;">Konten mengandung unsur kekerasan yang berlebihan</p>
        </div>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:14px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 6px;color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">File Backup Terlampir</p>
          <p style="margin:0;color:#15803d;font-size:14px;line-height:1.6;">Seluruh konten ceritamu telah kami simpankan dalam file PDF yang terlampir di email ini.</p>
        </div>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Jika kamu merasa penghapusan ini adalah kesalahan, hubungi tim kami melalui halaman Kontak.</p>`
      );

    default: // "test"
      return wrap(
        "linear-gradient(90deg,#7c3aed,#a855f7)",
        "Test Email Berhasil!",
        "Konfigurasi email kamu sudah benar",
        `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Email ini dikirim sebagai konfirmasi bahwa konfigurasi email di <strong>WOOCE Novel</strong> sudah berfungsi dengan baik.</p>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:14px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">Sistem email siap digunakan untuk notifikasi penulis, OTP, dan pesan kontak.</p>
        </div>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">Salam,<br/><strong style="color:#111827;">Tim WOOCE Novel</strong></p>`
      );
  }
}

export async function sendTestEmail(to: string) {
  return guardStrict((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Test Email — WOOCE Novel",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    html: emailWrapper(
      "linear-gradient(135deg,#1a1a2e 0%,#0f3460 60%,#16213e 100%)",
      "Test Email Berhasil!",
      "Konfigurasi email kamu sudah benar",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Email ini dikirim sebagai konfirmasi bahwa konfigurasi Gmail kamu di <strong>WOOCE Novel</strong> sudah berfungsi dengan baik.</p>
      <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:14px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">Sistem email siap digunakan untuk notifikasi penulis, OTP, dan pesan kontak.</p>
      </div>`,
      BASE_URL
    ),
  }));
}
