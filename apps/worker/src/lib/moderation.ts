import type { Env } from '../env';

export type ModerationResult = {
  /** true = 允许自动上线；false = 进 pending */
  allowed: boolean;
  /** 简短理由，写进 zone_ads.review_note */
  reason: string;
};

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `You moderate banner ads for a developer ad network. Decide if the ad is SAFE to run on a third-party website without human review.

Block the ad if it contains any of:
- illegal activity (drugs, weapons, fraud)
- explicit sexual content
- hate speech, harassment, violence against a group
- malware, phishing, scams ("you won!", "click to claim")
- deceptive medical / financial claims
- unclear or suspicious landing page URL

Respond with RAW JSON only (no markdown, no code fence):
{"safe": true, "reason": "short reason"}

"safe": true means auto-approve. "safe": false means send to manual review.
Keep "reason" under 80 chars.`;

/**
 * 对广告内容做 AI 审核。只审文本（title/content/linkUrl），图片留给后续 step。
 * 任何异常（模型挂了、JSON 解析失败、超时）一律当 "不放行"，降级到 pending，
 * 让 zone 所有者手动决定——比误放有害内容安全。
 */
export async function moderateAd(
  env: Env,
  ad: { title: string; content?: string | null; linkUrl: string },
): Promise<ModerationResult> {
  if (!env.AI) {
    return { allowed: false, reason: 'AI binding not configured' };
  }
  const userPrompt = [
    `Title: ${ad.title}`,
    `Description: ${ad.content ?? '(none)'}`,
    `Landing URL: ${ad.linkUrl}`,
  ].join('\n');

  try {
    const res = (await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 128,
    })) as { response?: string };

    const raw = (res.response ?? '').trim();
    const json = extractJson(raw);
    if (!json) {
      return { allowed: false, reason: 'AI returned non-JSON; sent to manual review' };
    }
    const parsed = JSON.parse(json) as { safe?: boolean; reason?: string };
    const reason = (parsed.reason ?? '').slice(0, 160);
    return { allowed: parsed.safe === true, reason: reason || (parsed.safe ? 'AI: looks safe' : 'AI: needs review') };
  } catch (e) {
    return { allowed: false, reason: `AI moderation failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/** 从模型输出里抠出第一段 {...}。模型偶尔会带 markdown 栅栏。 */
function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}
