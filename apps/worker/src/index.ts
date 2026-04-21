import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuth, hasAnyUser } from './auth';
import type { HonoEnv } from './env';
import { bearerAuth } from './middleware/auth';
import api from './routes/api';
import files from './routes/files';
import mcp from './routes/mcp';
import serve from './routes/serve';
import track from './routes/track';
import uploads from './routes/uploads';
import widget from './routes/widget';

const app = new Hono<HonoEnv>();

// Public endpoints — permissive CORS so widget.js + /serve can be embedded anywhere.
app.use('/serve/*', cors());
app.use('/widget.js', cors());
app.use('/files/*', cors());
app.use(
  '/track/*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    maxAge: 600,
  }),
);

// Authed endpoints — allow any origin but require Bearer.
// CORS must come BEFORE bearerAuth so OPTIONS preflight (no Authorization header)
// gets a 204 instead of 401.
// credentials: true 要求 origin 是具体值（不能是 *），用回显
const authedCors = cors({
  origin: (origin) => origin ?? '',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 600,
});
app.use('/api/*', authedCors);
app.use('/mcp', authedCors);
app.use('/uploads', authedCors);

app.get('/', (c) => c.json({ name: 'muiad-api', status: 'ok' }));

// better-auth: 需要它自带的 CORS（credentials: include），必须在 Hono 的通用 CORS 前挂
app.use('/auth/*', (c, next) =>
  cors({
    origin: (origin) => origin ?? '',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    maxAge: 600,
  })(c, next),
);
// 公共端点：admin UI 用它判断是否该显示 /signup
// 与 /auth/* 不同名，所以要单独挂 CORS（不然浏览器 fetch 会被拦）
app.use(
  '/auth-meta',
  cors({
    origin: (origin) => origin ?? '',
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'OPTIONS'],
    credentials: true,
    maxAge: 600,
  }),
);
app.get('/auth-meta', async (c) => {
  return c.json({ signupOpen: !(await hasAnyUser(c.env)) });
});

app.on(['GET', 'POST'], '/auth/*', async (c) => {
  // 关掉公开 sign-up：一旦有用户，新账号必须由 admin 从 /users 创建
  const url = new URL(c.req.url);
  if (c.req.method === 'POST' && url.pathname === '/auth/sign-up/email') {
    if (await hasAnyUser(c.env)) {
      return c.json({ error: 'Public signup is closed. Ask the admin to create an account for you.' }, 403);
    }
  }
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.use('/api/*', bearerAuth);
app.route('/api', api);

app.use('/mcp', bearerAuth);
app.route('/mcp', mcp);

app.use('/uploads', bearerAuth);
app.route('/uploads', uploads);

app.route('/serve', serve);
app.route('/track', track);
app.route('/widget.js', widget);
app.route('/files', files);

export default app;
