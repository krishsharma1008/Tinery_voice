/**
 * Dev-mode rate limiter for /api/realtime/session.
 *
 * Per PLAN §14.5: in production this MUST move to durable storage (Vercel KV /
 * Upstash Redis) because Vercel serverless instances reset on every cold start
 * and multiply across regions. This in-memory map is fine for local dev only.
 */
type Bucket = { count: number; resetAt: number };

const ipMinute = new Map<string, Bucket>();

const PER_IP_PER_MINUTE = 10;
const WINDOW_MS = 60_000;

export function rateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = ipMinute.get(ip);

  if (!bucket || bucket.resetAt < now) {
    ipMinute.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (bucket.count >= PER_IP_PER_MINUTE) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}
