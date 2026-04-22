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
      'muiad_scan_zones',
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
    expect(a.result.content[0]?.text).toContain('已直接上线: 1');

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

// 走 dispatchMcp 直调 —— 验证 per-user scoping，不依赖 auth middleware 配置
describe('/mcp — per-user scoping', () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await makeEnv();
    // 预置 alice / bob 两个用户，让 FK 能过
    for (const uid of ['alice', 'bob']) {
      await (env.DB as { prepare: (s: string) => { bind: (...a: unknown[]) => { run: () => Promise<unknown> } } })
        .prepare('INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)')
        .bind(uid, uid, `${uid}@t.invalid`, Date.now(), Date.now())
        .run();
    }
  });

  async function call(name: string, args: Record<string, unknown>, userId?: string) {
    const { dispatchMcp } = await import('../src/mcp/server');
    const caller = userId ? { user: { id: userId, email: `${userId}@t.invalid`, name: userId } } : { user: null };
    const res = await dispatchMcp(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } },
      env as never,
      caller,
    );
    if (!res || 'error' in res) throw new Error(JSON.stringify(res));
    return res.result as { content: Array<{ text: string }>; isError?: boolean };
  }

  it('两个用户各自 list_zones 只看到自己创建的', async () => {
    const z1 = await call(
      'muiad_create_zone',
      { name: 'alice-zone', site_url: 'https://a.com', width: 300, height: 250 },
      'alice',
    );
    const z2 = await call(
      'muiad_create_zone',
      { name: 'bob-zone', site_url: 'https://b.com', width: 728, height: 90 },
      'bob',
    );
    expect(z1.isError).toBeFalsy();
    expect(z2.isError).toBeFalsy();

    const aliceList = await call('muiad_list_zones', {}, 'alice');
    expect(aliceList.content[0]?.text).toContain('alice-zone');
    expect(aliceList.content[0]?.text).not.toContain('bob-zone');

    const bobList = await call('muiad_list_zones', {}, 'bob');
    expect(bobList.content[0]?.text).toContain('bob-zone');
    expect(bobList.content[0]?.text).not.toContain('alice-zone');

    // root key（caller.user = null）能看全
    const rootList = await call('muiad_list_zones', {});
    expect(rootList.content[0]?.text).toContain('alice-zone');
    expect(rootList.content[0]?.text).toContain('bob-zone');
  });

  // 跨用户投放 + approval_mode 行为
  async function setMode(userId: string, mode: 'auto' | 'manual' | 'warm' | 'ai') {
    const { userSettings } = await import('@muiad/db');
    const { createDb } = await import('@muiad/db');
    const db = createDb(env.DB as never);
    await userSettings.upsert(db, userId, { approvalMode: mode });
  }

  it('approval mode=auto（默认）：bob 的广告立刻出现在 alice 的 zone 上', async () => {
    const z = await call(
      'muiad_create_zone',
      { name: 'alice-zone', site_url: 'https://a.com', width: 300, height: 250 },
      'alice',
    );
    const aliceZoneId = /zone_id: (\S+)/.exec(z.content[0]?.text ?? '')?.[1]!;

    const bp = await call('muiad_register_product', { name: 'bob-prod', url: 'https://b.com' }, 'bob');
    const bobProductId = /product_id: (\S+)/.exec(bp.content[0]?.text ?? '')?.[1]!;

    const ad = await call(
      'muiad_create_ad',
      { product_id: bobProductId, title: 'bob-ad', link_url: 'https://b.com/l', zone_ids: [aliceZoneId] },
      'bob',
    );
    expect(ad.content[0]?.text).toContain('已直接上线: 1');
    expect(ad.content[0]?.text).toContain('等待 zone 所有者审批: 0');
  });

  it('approval mode=manual：bob 的广告进入 alice 的待审列表', async () => {
    await setMode('alice', 'manual');

    const z = await call(
      'muiad_create_zone',
      { name: 'alice-zone', site_url: 'https://a.com', width: 300, height: 250 },
      'alice',
    );
    const aliceZoneId = /zone_id: (\S+)/.exec(z.content[0]?.text ?? '')?.[1]!;

    const bp = await call('muiad_register_product', { name: 'bob-prod', url: 'https://b.com' }, 'bob');
    const bobProductId = /product_id: (\S+)/.exec(bp.content[0]?.text ?? '')?.[1]!;

    const ad = await call(
      'muiad_create_ad',
      { product_id: bobProductId, title: 'bob-ad', link_url: 'https://b.com/l', zone_ids: [aliceZoneId] },
      'bob',
    );
    expect(ad.content[0]?.text).toContain('已直接上线: 0');
    expect(ad.content[0]?.text).toContain('等待 zone 所有者审批: 1');
  });

  it('approval mode=ai：测试环境没有 AI binding，兜底 pending 并写 review_note', async () => {
    await setMode('alice', 'ai');

    const z = await call(
      'muiad_create_zone',
      { name: 'alice-zone', site_url: 'https://a.com', width: 300, height: 250 },
      'alice',
    );
    const aliceZoneId = /zone_id: (\S+)/.exec(z.content[0]?.text ?? '')?.[1]!;

    const bp = await call('muiad_register_product', { name: 'bob-prod', url: 'https://b.com' }, 'bob');
    const bobProductId = /product_id: (\S+)/.exec(bp.content[0]?.text ?? '')?.[1]!;

    const ad = await call(
      'muiad_create_ad',
      { product_id: bobProductId, title: 'bob-ad', link_url: 'https://b.com/l', zone_ids: [aliceZoneId] },
      'bob',
    );
    expect(ad.content[0]?.text).toContain('等待 zone 所有者审批: 1');

    // review_note 应该被填上（说明 AI 不可用）
    // biome-ignore lint/suspicious/noExplicitAny: test DB shim
    const rows = await (env.DB as any)
      .prepare('SELECT review_note, status FROM zone_ads WHERE zone_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(aliceZoneId)
      .all();
    const row = rows.results[0] as { review_note: string | null; status: string };
    expect(row?.status).toBe('pending');
    expect(row?.review_note ?? '').toMatch(/AI/);
  });

  it('mode=manual 下自己挂自己仍然直通', async () => {
    await setMode('alice', 'manual');

    const ap = await call('muiad_register_product', { name: 'alice-prod', url: 'https://a.com' }, 'alice');
    const aliceProductId = /product_id: (\S+)/.exec(ap.content[0]?.text ?? '')?.[1]!;
    const z = await call(
      'muiad_create_zone',
      { name: 'alice-zone', site_url: 'https://a.com', width: 300, height: 250 },
      'alice',
    );
    const aliceZoneId = /zone_id: (\S+)/.exec(z.content[0]?.text ?? '')?.[1]!;

    const ad = await call(
      'muiad_create_ad',
      { product_id: aliceProductId, title: 'own-ad', link_url: 'https://a.com/l', zone_ids: [aliceZoneId] },
      'alice',
    );
    expect(ad.content[0]?.text).toContain('已直接上线: 1');
  });

  it('muiad_scan_zones 跨用户返回全市场 active zones + category 过滤', async () => {
    // alice 创建 blog zone
    await call(
      'muiad_create_zone',
      {
        name: 'alice-blog',
        site_url: 'https://a.com',
        width: 300,
        height: 250,
        category: 'blog',
        description: 'indie hackers writing TypeScript',
        tags: 'typescript,devtools',
      },
      'alice',
    );
    // bob 创建 docs zone
    await call(
      'muiad_create_zone',
      {
        name: 'bob-docs',
        site_url: 'https://b.com',
        width: 728,
        height: 90,
        category: 'docs',
        tags: 'ai',
      },
      'bob',
    );

    // 无过滤：bob 也能扫到 alice 的广告位（market 语义跨用户）
    const all = await call('muiad_scan_zones', {}, 'bob');
    expect(all.content[0]?.text).toContain('alice-blog');
    expect(all.content[0]?.text).toContain('bob-docs');
    expect(all.content[0]?.text).toContain('typescript,devtools');

    // category 过滤
    const blogs = await call('muiad_scan_zones', { category: 'blog' }, 'bob');
    expect(blogs.content[0]?.text).toContain('alice-blog');
    expect(blogs.content[0]?.text).not.toContain('bob-docs');

    // tag 过滤
    const aiOnly = await call('muiad_scan_zones', { tag: 'ai' }, 'alice');
    expect(aiOnly.content[0]?.text).toContain('bob-docs');
    expect(aiOnly.content[0]?.text).not.toContain('alice-blog');
  });

  it('get_zone_stats / get_ad_conversions 对别人的 id 返回错误', async () => {
    const z = await call(
      'muiad_create_zone',
      { name: 'alice-zone', site_url: 'https://a.com', width: 300, height: 250 },
      'alice',
    );
    const zoneId = /zone_id: (\S+)/.exec(z.content[0]?.text ?? '')?.[1];

    const bobSees = await call('muiad_get_zone_stats', { zone_id: zoneId! }, 'bob');
    expect(bobSees.isError).toBe(true);
    expect(bobSees.content[0]?.text).toContain('不属于你');
  });
});
