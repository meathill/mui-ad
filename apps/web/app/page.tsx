import WaitlistForm from '@/components/waitlist-form';

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.28em] text-ember-deep">
          ✺ MCP-first · self-hosted · 去中心化
        </p>
        <h1 className="max-w-4xl font-serif text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02] tracking-tight">
          写完代码，
          <br />让 AI <em className="italic text-ember-deep">顺手</em> 帮你
          <br />
          把产品推出去。
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
          MuiAD 是一个跑在你自己 Cloudflare 账号里的开发者推广网络。 你的 AI Coding Agent 直接通过 MCP
          创建广告位、投放产品、记录转化——
          <span className="text-ink">不用登广告后台，不用付广告费，不用打开另一个 SaaS。</span>
        </p>

        <div className="mt-12 grid max-w-2xl gap-6">
          <WaitlistForm />
        </div>

        <dl className="mt-20 grid max-w-3xl grid-cols-2 gap-x-10 gap-y-6 border-t border-rule/60 pt-8 md:grid-cols-4">
          <Stat label="交付形态" value="Cloudflare Worker" />
          <Stat label="接入方式" value="MCP / REST" />
          <Stat label="数据归属" value="你自己" />
          <Stat label="广告费" value="0" />
        </dl>
      </section>

      <section className="border-y border-rule/60 bg-paper-deep/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div className="md:pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft">01 · 工作原理</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              你跟 Claude 说一句话，
              <br />
              其他的它自己搞定。
            </h2>
            <p className="mt-6 text-ink-soft">
              MuiAD 把"广告位管理 / 投放 / 归因"抽象成 6 个 MCP Tool。 任何支持 MCP 的 AI Coding
              Agent——Claude、Cursor、Zed—— 都能把它当成一只手直接调用。
            </p>
            <ul className="mt-8 space-y-2 font-mono text-[13px] text-ink-soft">
              <li>
                → <span className="text-ink">muiad_create_zone</span> 创建广告位
              </li>
              <li>
                → <span className="text-ink">muiad_register_product</span> 登记产品
              </li>
              <li>
                → <span className="text-ink">muiad_create_ad</span> 生成投放
              </li>
              <li>
                → <span className="text-ink">muiad_get_zone_stats</span> 看数据
              </li>
            </ul>
          </div>

          <div className="self-start overflow-hidden rounded-2xl border border-rule bg-ink text-paper shadow-[0_20px_60px_-30px_oklch(0.2_0.05_50/0.5)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50">
              <span className="size-2 rounded-full bg-ember" />
              claude · agentic session
            </div>
            <div className="space-y-4 p-5 font-mono text-[13px] leading-relaxed">
              <p>
                <span className="text-paper/50">you ›</span> 我刚把 foo-cli 发到 npm 了，顺便推一下。
              </p>
              <p className="text-paper/80">
                <span className="text-ember">claude ›</span> 好。我先把它登记成产品，然后挂到我管理的 12 个广告位上。
              </p>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-paper/70">
                <p>
                  <span className="text-ember-deep">→</span> muiad_register_product
                  {'  '}
                  <span className="text-paper/40">{'{ name: "foo-cli", url: "https://foo-cli.dev" }'}</span>
                </p>
                <p className="mt-1.5">
                  <span className="text-ember-deep">→</span> muiad_create_ad
                  {'  '}
                  <span className="text-paper/40">{'{ product_id: "…", zones: "*" }'}</span>
                </p>
              </div>
              <p className="text-paper/80">
                <span className="text-ember">claude ›</span> 投放完成。 7
                天窗口里会自动优化文案；要我明天早上把首日数据发你邮箱吗？
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft">02 · 诚实的现状</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              我们在哪、
              <br />
              下一步去哪。
            </h2>
          </div>
          <div className="space-y-5 text-[15px] leading-relaxed text-ink-soft">
            <p>
              MuiAD 现在处于 <strong className="text-ink">MVP-0</strong> 阶段：单实例广告投放 + MCP 接入 +
              广告渲染。核心数据库和部分 MCP Tool 已经可以工作。
            </p>
            <p>
              接下来依次是：
              <span className="ml-1 text-ink">
                归因追踪 → 智能优化 Agent → 去中心化节点互联 → 基于积分的流量互换经济。
              </span>
            </p>
            <p>
              加入 waitlist 意味着：在每个阶段开放自托管时，你都会第一时间拿到部署包和迁移脚本。
              不会有推销、不会被转卖邮箱、随时可以退订。
            </p>
            <p className="pt-2">
              <a
                href="https://github.com/meathill/mui-ad"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[12px] uppercase tracking-[0.18em] text-ember-deep underline-offset-4 hover:underline"
              >
                在 GitHub 上围观进度 →
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">{label}</dt>
      <dd className="mt-2 font-serif text-xl text-ink">{value}</dd>
    </div>
  );
}
