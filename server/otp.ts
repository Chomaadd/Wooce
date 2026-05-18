const otpStore = new Map<string, { otp: string; expires: number }>();

export function generateOtp(email: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email.toLowerCase(), { otp, expires: Date.now() + 10 * 60 * 1000 });
  return otp;
}

export function verifyOtp(email: string, otp: string): boolean {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expires) { otpStore.delete(email.toLowerCase()); return false; }
  if (entry.otp !== otp) return false;
  otpStore.delete(email.toLowerCase());
  return true;
}

// Rate limiter sederhana (in-memory) — kedaluwarsa setelah 1 jam
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}
