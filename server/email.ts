import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const BASE_URL = process.env.SITE_URL || "https://wooce.replit.app";

const emailWrapper = (headerBg: string, headerTitle: string, headerSub: string, bodyContent: string) => `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:${headerBg};border-radius:20px 20px 0 0;padding:40px 40px 36px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:rgba(255,255,255,0.15);border-radius:18px;margin-bottom:16px;overflow:hidden;">
              <img src="${BASE_URL}/image/icon-navbar.png" alt="WOOCE Novel" style="width:72px;height:72px;object-fit:cover;border-radius:18px;" />
            </div>
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
            <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">Email ini dikirim otomatis dari platform</p>
            <a href="${BASE_URL}" style="color:#7c3aed;font-size:13px;font-weight:600;text-decoration:none;">WOOCE Novel</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

function guard(fn: () => Promise<any>): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not configured, skipping email.");
    return Promise.resolve();
  }
  return fn().then(() => {}).catch(err => console.error("Email send error:", err));
}

export async function sendContactNotification(data: { name: string; email: string; subject: string; message: string }) {
  return guard(() => transporter.sendMail({
    from: `"WOOCE Novel" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    replyTo: data.email,
    subject: `✉️ Pesan baru dari ${data.name} — ${data.subject}`,
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
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:50px;">Balas Pesan →</a>
      </td></tr></table>`
    ),
  }));
}

export async function sendWriterPendingEmail(to: string, name: string) {
  return guard(() => transporter.sendMail({
    from: `"WOOCE Novel" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Pengajuan Penulismu Sedang Ditinjau — WOOCE Novel",
    html: emailWrapper(
      "linear-gradient(135deg,#78350f 0%,#92400e 60%,#78350f 100%)",
      "Pengajuan Sedang Ditinjau",
      "Kami sudah menerima permohonanmu",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Permohonanmu untuk menjadi <strong>penulis di WOOCE Novel</strong> sudah kami terima dan sedang dalam proses peninjauan oleh tim admin.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">⏳ Proses peninjauan biasanya berlangsung <strong>1–3 hari kerja</strong>. Kamu akan mendapat email lanjutan setelah keputusan diambil.</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Sambil menunggu, kamu tetap bisa menikmati semua novel di platform kami.</p>`
    ),
  }));
}

export async function sendWriterApprovedEmail(to: string, name: string) {
  return guard(() => transporter.sendMail({
    from: `"WOOCE Novel" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Selamat! Kamu Diterima sebagai Penulis WOOCE Novel",
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
        <a href="${BASE_URL}/writer/cerita" style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:50px;">Buka Dashboard Penulis →</a>
      </td></tr></table>`
    ),
  }));
}

export async function sendWriterRejectedEmail(to: string, name: string) {
  return guard(() => transporter.sendMail({
    from: `"WOOCE Novel" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Pengajuan Penulis Ditolak — Bisa Coba Lagi dalam 7 Hari",
    html: emailWrapper(
      "linear-gradient(135deg,#7f1d1d 0%,#991b1b 60%,#7f1d1d 100%)",
      "Pengajuan Tidak Disetujui",
      "Jangan menyerah, kamu bisa coba lagi",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Setelah ditinjau, pengajuanmu untuk menjadi penulis di <strong>WOOCE Novel</strong> belum bisa kami setujui saat ini.</p>
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.6;">⏱ Kamu bisa mengajukan permohonan kembali setelah <strong>7 hari</strong> dari sekarang. Pastikan profilmu sudah lengkap sebelum mendaftar ulang.</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Tetap semangat menulis! Kami selalu terbuka untuk pengajuan berikutnya.</p>`
    ),
  }));
}

export async function sendWriterSuspendedEmail(to: string, name: string) {
  return guard(() => transporter.sendMail({
    from: `"WOOCE Novel" <${process.env.GMAIL_USER}>`,
    to,
    subject: "⚠️ Akun Penulismu di WOOCE Novel Telah Disuspend",
    html: emailWrapper(
      "linear-gradient(135deg,#7c2d12 0%,#9a3412 60%,#7c2d12 100%)",
      "Akun Disuspend",
      "Tindakan diperlukan pada akunmu",
      `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Hai <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Kami ingin memberitahu bahwa akun penulismu di <strong>WOOCE Novel</strong> telah <strong>disuspend</strong> oleh tim admin karena melanggar panduan konten platform.</p>
      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:18px 22px;margin-bottom:24px;">
        <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.6;">🔒 Akses ke dashboard penulis dan manajemen ceritamu sementara dinonaktifkan. Kamu bisa mengajukan permohonan kembali setelah <strong>30 hari</strong>.</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Jika kamu merasa ini adalah kesalahan, hubungi tim kami melalui halaman kontak.</p>`
    ),
  }));
}
