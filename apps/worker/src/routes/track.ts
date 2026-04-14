import { Hono } from 'hono';
import Repository from '@muiad/db/src/repository';

const app = new Hono();

app.get('/click', async (c) => {
  const adId = c.req.query('ad');
  const zoneId = c.req.query('zone');
  const redirectUrl = c.req.query('redirect');

  if (!adId || !zoneId || !redirectUrl) {
    return c.text('Missing required parameters', 400);
  }

  const env = c.env;
  const repository = new Repository(env.DB);

  // 记录点击
  const ipHash = await hashIp(c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || '');
  await repository.createClick({
    zoneId,
    adId,
    ipHash,
    userAgent: c.req.header('user-agent') || undefined,
    referer: c.req.header('referer') || undefined,
  });

  // 重定向到目标 URL
  return c.redirect(decodeURIComponent(redirectUrl), 302);
});

// 简单的 IP 哈希函数
async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default app;
