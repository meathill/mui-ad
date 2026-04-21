import { beforeEach, describe, expect, it } from 'vitest';
import { API_KEY, app, authed, makeEnv, type TestEnv } from './helpers';

async function rpc(env: TestEnv, method: string, params?: unknown, id: number | string | null = 1): Promise<Response> {
  const body: Record<string, unknown> = { jsonrpc: '2.0', method };
  if (params !== undefined) body.params = params;
  if (id !== null) body.id = id;
  return app.request(
    '/mcp',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    env,
  );
}

describe('/mcp — transport', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('rejects without bearer', async () => {
    const res = await app.request(
      '/mcp',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
      },
      env,
    );
    expect(res.status).toBe(401);
  });

  it('initialize echoes the client protocol version', async () => {
    const res = await rpc(env, 'initialize', { protocolVersion: '2025-03-26' });
    const body = (await res.json()) as { result: { protocolVersion: string; serverInfo: { name: string } } };
    expect(body.result.protocolVersion).toBe('2025-03-26');
    expect(body.result.serverInfo.name).toBe('muiad');
  });

  it('notifications/initialized returns 204 no body', async () => {
    const res = await app.request(
      '/mcp',
      authed({
        method: 'POST',
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      }),
      env,
    );
    expect(res.status).toBe(204);
  });

  it('unknown method returns JSON-RPC error', async () => {
    const res = await rpc(env, 'bogus');
    const body = (await res.json()) as { error: { code: number } };
    expect(body.error.code).toBe(-32601);
  });
});

describe('/mcp — tools/list', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  it('returns all muiad_* tools', async () => {
    const res = await rpc(env, 'tools/list');
    const body = (await res.json()) as { result: { tools: Array<{ name: string }> } };
    const names = body.result.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'muiad_create_ad',
      'muiad_create_zone',
      'muiad_get_ad_conversions',
      'muiad_get_zone_stats',
      'muiad_list_ads',
      'muiad_list_zones',
      'muiad_register_product',
    ]);
  });
});

describe('/mcp — tools/call happy paths', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
  });

  async function callTool(name: string, args: Record<string, unknown>) {
    const res = await rpc(env, 'tools/call', { name, arguments: args });
    return (await res.json()) as { result: { content: Array<{ text: string }>; isError?: boolean } };
  }

  it('muiad_create_zone → embed snippet + zone_id', async () => {
    const body = await callTool('muiad_create_zone', {
      name: 'sidebar',
      site_url: 'https://blog.dev',
      width: 300,
      height: 250,
    });
    const text = body.result.content[0]?.text ?? '';
    expect(text).toContain('已创建广告位');
    expect(text).toMatch(/zone_id: [0-9a-f-]{36}/);
    expect(text).toContain('data-muiad=');
  });

  it('end-to-end: register → create zones → create ad → list ads → stats', async () => {
    // 1. register product
    const p = await callTool('muiad_register_product', {
      name: 'foo-cli',
      url: 'https://foo.dev',
    });
    const productId = p.result.content[0]?.text.match(/product_id: ([0-9a-f-]{36})/)?.[1];
    expect(productId).toBeDefined();

    // 2. create zone
    const z = await callTool('muiad_create_zone', {
      name: 'z',
      site_url: 'https://s.dev',
      width: 300,
      height: 250,
    });
    const zoneId = z.result.content[0]?.text.match(/zone_id: ([0-9a-f-]{36})/)?.[1];
    expect(zoneId).toBeDefined();

    // 3. create ad attaching to zone
    const a = await callTool('muiad_create_ad', {
      product_id: productId!,
      title: 'Try foo-cli',
      link_url: 'https://foo.dev/landing',
      zone_ids: [zoneId!],
      weight: 5,
    });
    expect(a.result.content[0]?.text).toContain('已投放到 1 个广告位');

    // 4. list ads
    const listed = await callTool('muiad_list_ads', {});
    expect(listed.result.content[0]?.text).toContain('Try foo-cli');
    expect(listed.result.content[0]?.text).toContain('权重 5');

    // 5. zone stats (no impressions yet)
    const stats = await callTool('muiad_get_zone_stats', { zone_id: zoneId! });
    const t = stats.result.content[0]?.text ?? '';
    expect(t).toContain('展示量: 0');
    expect(t).toContain('点击量: 0');
    expect(t).toContain('CTR: 0.00%');
  });

  it('unknown tool returns JSON-RPC error (-32601)', async () => {
    const res = await rpc(env, 'tools/call', { name: 'nonexistent', arguments: {} });
    const body = (await res.json()) as { error: { code: number; message: string } };
    expect(body.error.code).toBe(-32601);
    expect(body.error.message).toContain('nonexistent');
  });
});
