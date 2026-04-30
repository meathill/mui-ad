import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import LiveDemo from '@/components/live-demo';
import WaitlistForm from '@/components/waitlist-form';

const ADMIN_URL = 'https://admin.muiad.meathill.com';
const REPO_URL = 'https://github.com/meathill/mui-ad';
const AGENT_GUIDE_URL = 'https://github.com/meathill/mui-ad/blob/main/docs/AGENT_GUIDE.md';

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.28em] text-ember-deep">
          ✺ MCP-first · self-hosted · 去中心化
        </p>
        <h1 className="max-w-5xl font-serif text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02] tracking-tight">
          Self-hosted ad network
          <br />
          for the <em className="italic text-ember-deep">MCP era</em>.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
          你的 AI Coding Agent 通过 MCP 创建广告位、生成物料、自动审核、自动优化——
          <span className="text-ink">全部跑在你自己的 Cloudflare 账号里。</span>
          一行代码不写，一分广告费不付。
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ember-deep"
          >
            部署到我的节点
            <ArrowRight size={14} weight="bold" />
          </a>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 rounded-full border border-rule px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
          >
            加入 waitlist
            <ArrowRight size={14} weight="bold" />
          </a>
        </div>

        <dl className="mt-20 grid max-w-3xl grid-cols-2 gap-x-10 gap-y-6 border-t border-rule/60 pt-8 md:grid-cols-4">
          <Stat label="数据归属" value="你自己" />
          <Stat label="接入方式" value="MCP / REST" />
          <Stat label="AI 审核" value="Workers AI 内置" />
          <Stat label="广告费" value="0" />
        </dl>
      </section>

      {/* 01 · 工作原理 */}
      <section className="border-y border-rule/60 bg-paper-deep/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div className="md:pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft">01 · 工作原理</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              MCP tool 不止 12 个，
              <br />
              AI 不止<em className="italic text-ember-deep">"会创建"</em>。
            </h2>
            <p className="mt-6 text-ink-soft">
              你的 AI Coding Agent 调一次就闭环——扫描 → 生成 → 投放 → 审核 → 监控 → 优化，全自动跑在背景里。
            </p>
            <ul className="mt-8 space-y-3 text-[14px] text-ink-soft">
              <li>
                <span className="font-mono text-ember-deep">扫描</span>
                <span className="ml-2 font-mono text-[12px] text-ink-soft/70">muiad_scan_zones</span>
                <br />
                <span className="text-ink-soft/80">跨节点找匹配的广告位</span>
              </li>
              <li>
                <span className="font-mono text-ember-deep">生成</span>
                <span className="ml-2 font-mono text-[12px] text-ink-soft/70">OpenAI / Gemini · BYOK</span>
                <br />
                <span className="text-ink-soft/80">banner 图，钱花在你自己的 key 上</span>
              </li>
              <li>
                <span className="font-mono text-ember-deep">投放</span>
                <span className="ml-2 font-mono text-[12px] text-ink-soft/70">muiad_create_ad</span>
                <br />
                <span className="text-ink-soft/80">一次挂到多个 zone</span>
              </li>
              <li>
                <span className="font-mono text-ember-deep">审核</span>
                <span className="ml-2 font-mono text-[12px] text-ink-soft/70">Workers AI · text + image</span>
                <br />
                <span className="text-ink-soft/80">fail-closed，宁挡勿放</span>
              </li>
              <li>
                <span className="font-mono text-ember-deep">监控</span>
                <span className="ml-2 font-mono text-[12px] text-ink-soft/70">muiad_list_ads_performance</span>
                <br />
                <span className="text-ink-soft/80">一次拿全量、按 zone 拆开</span>
              </li>
              <li>
                <span className="font-mono text-ember-deep">优化</span>
                <span className="ml-2 font-mono text-[12px] text-ink-soft/70">muiad_set_ad_status</span>
                <br />
                <span className="text-ink-soft/80">给 AI 一个 CTR 阈值，它自己暂停烂广告</span>
              </li>
            </ul>
            <p className="mt-8 font-serif text-xl text-ink">
              你做的事：跟 Claude 说<em className="italic text-ember-deep">一句话</em>。
            </p>
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
                <span className="text-ember">claude ›</span> 好。我先扫一下匹配的广告位，再让 banner
                生成器跑一张图，挂上去——别人节点的位置 Workers AI 会帮我们过审。
              </p>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-paper/70">
                <p>
                  <span className="text-ember-deep">→</span> muiad_scan_zones
                  {'  '}
                  <span className="text-paper/40">{'{ category: "devtools" }'}</span>
                </p>
                <p className="mt-1.5">
                  <span className="text-ember-deep">→</span> muiad_register_product
                </p>
                <p className="mt-1.5">
                  <span className="text-ember-deep">→</span> muiad_create_ad
                  {'  '}
                  <span className="text-paper/40">{'{ zones: ["..." × 6] }'}</span>
                </p>
              </div>
              <p className="text-paper/80">
                <span className="text-ember">claude ›</span> 投放完成。4 个直接上线，2 个进了对方的人工审批队列。
              </p>
              <p className="border-t border-white/10 pt-4 text-paper/60">
                <span className="text-paper/40">— 两天后 —</span>
              </p>
              <p className="text-paper/80">
                <span className="text-ember">claude ›</span> 看了下数据：foo-cli 在 zone X 上 CTR 4.7%，在 zone Y 上
                0.3%——我先把 Y 上的暂停了，要不要在 X 上加大权重？
              </p>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-paper/70">
                <p>
                  <span className="text-ember-deep">→</span> muiad_list_ads_performance
                </p>
                <p className="mt-1.5">
                  <span className="text-ember-deep">→</span> muiad_set_ad_status
                  {'  '}
                  <span className="text-paper/40">{'{ status: "paused" }'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 · 现场演示（保留，不动） */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ember-deep">02 · 现场演示</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              右边这格广告位，
              <br />
              是它<em className="italic text-ember-deep">自己</em>投的。
            </h2>
            <p className="mt-6 text-ink-soft">
              你现在看到的 300×250 是一个真实的 MuiAD 广告位，嵌入这个 landing 本身。 广告是通过 MCP 调用创建的：
              <span className="ml-1 font-mono text-[13px] text-ink">register_product → create_zone → create_ad</span>
              ，全在 Claude Code 里几句话完成。
            </p>
            <p className="mt-4 text-ink-soft">
              每一次你刷新这个页面都会触发一次 impression，每一次点击都会被
              <span className="ml-1 text-ink">/track/click</span> 记下来——跟第三方站点嵌入的 体验一模一样，没有任何
              hack。
            </p>
            <p className="pt-6">
              <a
                href="https://api.muiad.meathill.com/serve?zone=29e56581-3dcf-4164-acff-32c36bc71f77"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember-deep underline-offset-4 hover:underline"
              >
                直接看 /serve 返回的 JSON →
              </a>
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* 03 · 自托管 */}
      <section className="border-y border-rule/60 bg-paper-deep/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft">03 · 自托管</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              你的节点，
              <br />
              你的<em className="italic text-ember-deep">规则</em>。
            </h2>
            <p className="mt-6 text-ink-soft">
              MuiAD 整套跑在<span className="text-ink">你自己的 Cloudflare 账号里</span>——D1、R2、Workers、Workers AI
              都是。 没有外部 SaaS 在中间抽水或读你的数据。
            </p>
          </div>
          <ul className="space-y-5 text-[15px] leading-relaxed">
            <OwnershipItem accent="数据" body="D1 是你的——展示 / 点击 / 转化 / 用户记录全部在你账号里，没人能看。" />
            <OwnershipItem
              accent="自由度"
              body="4 档审批模式（auto / manual / warm / Workers AI），你决定别人的广告能不能落地。"
            />
            <OwnershipItem
              accent="预算"
              body="Workers AI 审核走免费配额；OpenAI / Gemini banner 生成走你自己的 key。"
            />
            <OwnershipItem accent="网络" body="每个 MuiAD 节点都是平等的，未来会通过 MCP 互联（MVP-3 节点联邦）。" />
          </ul>
        </div>
      </section>

      {/* 04 · 接入 */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.3fr] md:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ember-deep">04 · 接入</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              一行接入
              <br />
              <em className="italic text-ember-deep">Claude Code</em>。
            </h2>
            <p className="mt-6 text-ink-soft">
              生成一个 per-user API key，黏到你的 MCP 客户端里，下一次 prompt 就能用。
            </p>
            <p className="mt-4 text-ink-soft">
              Cursor / Claude Desktop / Zed 同样支持，详见{' '}
              <a
                href={AGENT_GUIDE_URL}
                target="_blank"
                rel="noreferrer"
                className="text-ember-deep underline-offset-4 hover:underline"
              >
                AGENT_GUIDE
              </a>
              。
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-rule bg-ink text-paper shadow-[0_20px_60px_-30px_oklch(0.2_0.05_50/0.5)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50">
              <span className="size-2 rounded-full bg-ember" />
              terminal
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
              <code>
                <span className="text-paper/40">$ </span>
                <span className="text-paper">claude mcp add --transport http muiad</span>
                {'\n    '}
                <span className="text-ember">https://你的节点.dev/mcp</span>
                {' \\'}
                {'\n    '}
                <span className="text-paper/70">
                  --header <span className="text-ember">"Authorization: Bearer muiad_xxx"</span>
                </span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* 05 · 发布方 */}
      <section className="border-y border-rule/60 bg-paper-deep/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_1.3fr] md:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft">05 · 发布方</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              有流量？
              <br />
              把它租给 <em className="italic text-ember-deep">AI Agent</em>。
            </h2>
            <p className="mt-6 text-ink-soft">
              你跑了一个 indie hacker 博客 / 工具站 / docs 站？开一个 MuiAD 节点，把广告位描述清楚（category / tags /
              audience），让别人的 AI Agent 自动找上门。
            </p>
            <p className="mt-4 text-ink-soft/70 text-sm">
              当前阶段没有钱流（MVP-4 才上积分系统）——早期免费做关系、攒数据、试 AI 自动审核。
            </p>
            <p className="mt-6">
              <a
                href={ADMIN_URL}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember-deep underline-offset-4 hover:underline"
              >
                看一眼 admin 面板 →
              </a>
            </p>
          </div>
          <ul className="space-y-5 text-[15px] leading-relaxed">
            <OwnershipItem
              accent="审你能接受的"
              body="4 档审批模式让你说了算——全部自动 / 全部人审 / 信任老熟客 / Workers AI 把第一关。"
            />
            <OwnershipItem
              accent="不被中间商抽水"
              body="广告主直接把广告挂到你的 zone，没有 ad network 在中间收 30%。"
            />
            <OwnershipItem accent="数据全归你" body="CTR / 转化 / UTM 来源 / referer 全看得见，可以拿来调内容方向。" />
          </ul>
        </div>
      </section>

      {/* 06 · 路线图 */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-soft">06 · 路线图</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              去过的地方，
              <br />
              要去的地方。
            </h2>
          </div>
          <div className="space-y-8">
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">已发布 ✅</p>
              <ul className="space-y-2 text-[15px] leading-relaxed text-ink">
                <li>
                  <span className="font-mono text-[12px] text-ember-deep">MVP-0</span>{' '}
                  <span className="text-ink-soft">·</span> 单实例 + MCP + 广告渲染
                </li>
                <li>
                  <span className="font-mono text-[12px] text-ember-deep">MVP-1</span>{' '}
                  <span className="text-ink-soft">·</span> 完整归因追踪（UTM / 转化 / 独立访客）
                </li>
                <li>
                  <span className="font-mono text-[12px] text-ember-deep">MVP-2</span>{' '}
                  <span className="text-ink-soft">·</span> AI Agent 闭环（扫描 / 生成 / 审核 / 优化 / 跨用户市场）
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">还在路上 ⏳</p>
              <ul className="space-y-2 text-[15px] leading-relaxed text-ink-soft">
                <li>
                  <span className="font-mono text-[12px] text-ink-soft/70">MVP-3</span> · 节点联邦（A 节点的 Agent 看到
                  B 节点的广告位）
                </li>
                <li>
                  <span className="font-mono text-[12px] text-ink-soft/70">MVP-4</span> · 流量经济（积分互换 / Rev share
                  / 公共节点）
                </li>
              </ul>
            </div>
            <div className="border-t border-rule/60 pt-8">
              <p className="text-[15px] leading-relaxed text-ink">
                <span className="font-serif text-lg italic text-ember-deep">现在能做：</span> 自部署一个节点跑起来 / 把
                MCP 接上你的 Claude Code / 在 admin 里跑全套流程。
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                <span className="font-serif text-lg italic text-ink">加入 waitlist：</span> MVP-3 公测时第一批拉你进群——
                不营销、不转卖、随时退订。
              </p>
              <div className="mt-8 max-w-xl">
                <WaitlistForm />
              </div>
              <p className="mt-6">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] uppercase tracking-[0.18em] text-ember-deep underline-offset-4 hover:underline"
                >
                  在 GitHub 上围观进度 →
                </a>
              </p>
            </div>
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

function OwnershipItem({ accent, body }: { accent: string; body: string }) {
  return (
    <li className="rounded-2xl border border-rule/60 bg-paper p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">{accent}</p>
      <p className="mt-2 text-ink">{body}</p>
    </li>
  );
}
