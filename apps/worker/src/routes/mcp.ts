import { Hono } from 'hono';
import { MCP } from '@modelcontextprotocol/sdk';
import * as tools from '../mcp/tools';

const app = new Hono();

app.post('/', async (c) => {
  const mcp = new MCP({ tools: Object.values(tools) });
  const body = await c.req.json();
  const response = await mcp.handleRequest(body);
  return c.json(response);
});

export default app;
