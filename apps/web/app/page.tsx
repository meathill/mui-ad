import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail('');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Internal server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            MCP-first、Self-hosted、AI 驱动的去中心化开发者推广网络
          </h1>
          <p className="text-xl opacity-90 mb-8">让开发者在写代码的时候，顺便就让 AI 把推广的事办了。</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link
              href="#deploy"
              className="px-6 py-3 bg-white text-blue-600 rounded-md font-medium hover:bg-opacity-90 transition-colors"
            >
              开始部署
            </Link>
            <Link
              href="#docs"
              className="px-6 py-3 bg-transparent border border-white text-white rounded-md font-medium hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              查看文档
            </Link>
          </div>

          {/* Waitlist Form */}
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">加入等待列表</h2>
            <p className="mb-6 opacity-90">获取最新功能更新和部署指南</p>
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入你的邮箱"
                className="flex-1 px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-700 text-white rounded-md font-medium hover:bg-blue-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '提交中...' : '加入'}
              </button>
            </form>
            {message && <p className="mt-4 text-green-300">{message}</p>}
            {error && <p className="mt-4 text-red-300">{error}</p>}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">MCP-first 交互</h3>
              <p className="text-gray-600">通过 MCP Tool 与 AI Agent 交互，让 AI 帮你管理广告和推广。</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Self-hosted</h3>
              <p className="text-gray-600">数据在你自己的 Cloudflare 账户中，完全掌控，安全可靠。</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI 驱动</h3>
              <p className="text-gray-600">AI 自动生成广告物料、优化投放策略，最大化推广效果。</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">去中心化网络</h3>
              <p className="text-gray-600">节点间直接通信，流量互换，扩大推广覆盖面。</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">积分系统</h3>
              <p className="text-gray-600">通过展示广告赚取积分，用积分让别人展示你的广告。</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">归因追踪</h3>
              <p className="text-gray-600">完整的转化追踪，了解每个广告的效果。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deploy Section */}
      <section id="deploy" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">快速开始</h2>
          <div className="bg-white p-8 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">部署 MuiAD Worker</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-medium mb-2">1. 克隆仓库</h4>
                <pre className="bg-gray-100 p-4 rounded-md text-sm">
                  git clone https://github.com/yourusername/mui-ad.git
                </pre>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">2. 安装依赖</h4>
                <pre className="bg-gray-100 p-4 rounded-md text-sm">cd mui-ad && pnpm install</pre>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">3. 配置 Cloudflare</h4>
                <p className="text-gray-600 mb-2">创建 D1 数据库和 KV 命名空间，然后更新 wrangler.jsonc 中的配置。</p>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">4. 部署 Worker</h4>
                <pre className="bg-gray-100 p-4 rounded-md text-sm">cd apps/worker && pnpm deploy</pre>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">5. 访问管理面板</h4>
                <p className="text-gray-600">部署完成后，访问你的 Worker URL 即可开始使用。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Docs Section */}
      <section id="docs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">文档</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">MCP Tools</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• muiad_create_zone - 创建广告位</li>
                <li>• muiad_list_zones - 列出所有广告位</li>
                <li>• muiad_register_product - 注册产品</li>
                <li>• muiad_create_ad - 创建广告</li>
                <li>• muiad_list_ads - 列出所有广告</li>
                <li>• muiad_get_zone_stats - 查看广告位统计数据</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">API 端点</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• /api/v1/zones - 广告位 CRUD</li>
                <li>• /api/v1/ads - 广告 CRUD</li>
                <li>• /api/v1/products - 产品 CRUD</li>
                <li>• /api/v1/stats - 统计数据</li>
                <li>• /mcp - MCP Server 端点</li>
                <li>• /serve - 广告渲染端点</li>
                <li>• /track/click - 点击追踪</li>
                <li>• /widget.js - 广告渲染脚本</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
