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
<body style="margin:0;padding:0;background:#0d0d1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:${headerBg};border-radius:20px 20px 0 0;padding:36px 40px 32px;text-align:center;">
            <img src="cid:${LOGO_CID}" alt="WOOCE Novel" width="120" style="width:120px;max-width:30%;height:auto;display:block;margin:0 auto 16px;border-radius:10px;" />
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${headerTitle}</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:14px;">${headerSub}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-radius:0 0 20px 20px;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr><td align="center">
                <a href="https://www.tiktok.com/@woocenovel" style="display:inline-block;margin:0 5px;width:28px;height:28px;background:#111827;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">Tt</a>
                <a href="https://www.facebook.com/woocenovel" style="display:inline-block;margin:0 5px;width:28px;height:28px;background:#1877f2;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">f</a>
                <a href="https://instagram.com/woocenovel" style="display:inline-block;margin:0 5px;width:28px;height:28px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">in</a>
              </td></tr>
            </table>
            <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">Email ini dikirim otomatis dari platform</p>
            <a href="${BASE_URL}" style="color:#7c3aed;font-size:13px;font-weight:600;text-decoration:none;">WOOCE Novel</a>
            <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">&copy; 2026 Choomad Group. Seluruh hak cipta dilindungi.</p>
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
          ? opts.html.replace(`cid:${LOGO_CID}`, `${baseUrl}/image/landscape-wooce.png`)
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
    attachments: [logoAttachment],
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
    attachments: [logoAttachment],
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
    attachments: [logoAttachment],
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
    attachments: [logoAttachment],
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
    attachments: [logoAttachment],
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
    attachments: [logoAttachment],
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
      logoAttachment,
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
    attachments: [logoAttachment],
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
      logoAttachment,
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
      logoAttachment,
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
    attachments: [logoAttachment],
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
      logoAttachment,
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

export async function sendTestEmail(to: string) {
  return guardStrict((t, from, BASE_URL) => t.sendMail({
    from: `"WOOCE Novel" <${from}>`,
    to,
    subject: "Test Email — WOOCE Novel",
    headers: { "X-Mailer": "WOOCE Novel Mailer" },
    attachments: [logoAttachment],
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
