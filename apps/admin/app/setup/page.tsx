'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, makeApi } from '@/lib/api';
import { DEFAULT_WORKER_URL, useConfig } from '@/lib/store';

export default function SetupPage() {
  const router = useRouter();
  const setConfig = useConfig((s) => s.setConfig);
  const existingUrl = useConfig((s) => s.workerUrl);
  const existingKey = useConfig((s) => s.apiKey);

  const [workerUrl, setWorkerUrl] = useState(DEFAULT_WORKER_URL);
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingUrl) setWorkerUrl(existingUrl);
    if (existingKey) setApiKey(existingKey);
  }, [existingUrl, existingKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setTesting(true);
    const cleanedUrl = workerUrl.trim().replace(/\/+$/, '');
    try {
      await makeApi(cleanedUrl, apiKey.trim()).zones.list();
      setConfig(cleanedUrl, apiKey.trim());
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`连接失败：HTTP ${err.status} — ${err.message}`);
      } else {
        setError('连不上这个 Worker。检查 URL 和 API key。');
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.24em] text-ember-deep">MuiAD // admin setup</p>
      <h1 className="font-serif text-5xl leading-[1.05] tracking-tight">
        连接到你的
        <br />
        <em className="italic text-ember-deep">MuiAD</em> 节点。
      </h1>
      <p className="mt-5 text-ink-soft">
        填入你的 Worker 地址和 <code className="font-mono text-[13px]">MUIAD_API_KEY</code>。信息只保存在浏览器
        localStorage 里，不会发往任何地方。
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label
            htmlFor="worker-url"
            className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft"
          >
            Worker URL
          </label>
          <input
            id="worker-url"
            type="url"
            required
            value={workerUrl}
            onChange={(e) => setWorkerUrl(e.target.value)}
            placeholder="https://api.muiad.meathill.com"
            className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

        <div>
          <label
            htmlFor="api-key"
            className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft"
          >
            API Key
          </label>
          <input
            id="api-key"
            type="password"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="muimui"
            className="w-full rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

        {error && <p className="rounded-md bg-ember/10 px-4 py-3 font-mono text-xs text-ember-deep">{error}</p>}

        <button
          type="submit"
          disabled={testing || !apiKey || !workerUrl}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
        >
          {testing ? '正在校验…' : '连接并进入'}
        </button>
      </form>
    </div>
  );
}
