import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { HonoEnv } from './env';
import { bearerAuth } from './middleware/auth';
import api from './routes/api';
import serve from './routes/serve';
import track from './routes/track';
import widget from './routes/widget';

const app = new Hono<HonoEnv>();

app.use('/serve/*', cors());
app.use('/widget.js', cors());

app.get('/', (c) => c.json({ name: 'muiad-api', status: 'ok' }));

app.use('/api/*', bearerAuth);
app.route('/api', api);

app.route('/serve', serve);
app.route('/track', track);
app.route('/widget.js', widget);

export default app;
