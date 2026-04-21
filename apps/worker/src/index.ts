import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuth } from './auth';
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
app.on(['GET', 'POST'], '/auth/*', async (c) => {
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
