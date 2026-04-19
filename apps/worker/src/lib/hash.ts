/**
 * Hash a string with SHA-256, returning the hex digest.
 * Used for privacy-preserving IP recording on impressions / clicks.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Pull the client IP from a Hono request, preferring Cloudflare's own header.
 * Returns empty string if nothing is available.
 */
export function clientIp(req: { header: (name: string) => string | undefined }): string {
  return req.header('cf-connecting-ip') ?? req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
}
