import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { basicAuth } from 'hono/basic-auth';
import * as schema from '@muiad/db/src/schema';
import Repository from '@muiad/db/src/repository';

// 导入路由
import mcpRoutes from './routes/mcp';
import apiRoutes from './routes/api';
import serveRoutes from './routes/serve';
import trackRoutes from './routes/track';

// 环境类型
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  MUIAD_URL: string;
  MUIAD_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// 中间件
app.use('/*', cors());

// 认证中间件
const authMiddleware = basicAuth({
  username: '',
  password: (c) => c.env.MUIAD_API_KEY,
  realm: 'MuiAD',
});

// 路由
app.use('/api/*', authMiddleware);
app.use('/mcp', authMiddleware);
app.route('/api', apiRoutes);
app.route('/mcp', mcpRoutes);
app.route('/serve', serveRoutes);
app.route('/track', trackRoutes);

// 静态文件
app.get('/widget.js', async (c) => {
  const widgetContent = await c.env.CACHE.get('widget.js');
  if (widgetContent) {
    return c.text(widgetContent, 200, { 'Content-Type': 'application/javascript' });
  }
  // 从文件系统读取
  const fs = require('fs');
  const path = require('path');
  const widgetPath = path.join(__dirname, '../public/widget.js');
  const content = fs.readFileSync(widgetPath, 'utf8');
  await c.env.CACHE.put('widget.js', content, { expirationTtl: 3600 });
  return c.text(content, 200, { 'Content-Type': 'application/javascript' });
});

export default app;
