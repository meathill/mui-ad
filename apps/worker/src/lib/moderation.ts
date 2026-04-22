import type { Env } from '../env';

export type ModerationResult = {
  /** true = 允许自动上线；false = 进 pending */
  allowed: boolean;
  /** 简短理由，写进 zone_ads.review_note */
  reason: string;
};

const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';
const VISION_MODEL = '@cf/llava-hf/llava-1.5-7b-hf';

/** 超过这个大小的图片直接拒审，不喂给模型（省钱 + 避免 OOM） */
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

const TEXT_SYSTEM_PROMPT = `You moderate banner ads for a developer ad network. Decide if the ad is SAFE to run on a third-party website without human review.

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

const IMAGE_PROMPT = `You moderate banner images for a developer ad network. Is this image SAFE for a professional developer-audience website?

Block if the image contains any of:
- nudity, sexual content
- graphic violence, gore, weapons
- drugs, drug paraphernalia
- hate symbols, extremist imagery
- misleading clickbait (fake buttons, fake system alerts, deceptive UI)
- unreadable / low-quality / clearly AI-slop with no relation to a product

Respond with RAW JSON only (no markdown):
{"safe": true, "reason": "short reason under 80 chars"}`;

/**
 * 对广告内容做 AI 审核：先审文本，过了再审图。任何一步 fail 整体就 fail。
 * 任何异常（模型挂、JSON 解析失败、图片拉不到、超大）一律 fail-closed，
 * 降级到 pending，让 zone 所有者手动决定——比误放有害内容安全。
 */
export async function moderateAd(
  env: Env,
  ad: { title: string; content?: string | null; linkUrl: string; imageUrl?: string | null },
): Promise<ModerationResult> {
  if (!env.AI) {
    return { allowed: false, reason: 'AI binding not configured' };
  }

  const textVerdict = await moderateText(env, ad);
  if (!textVerdict.allowed) return textVerdict;

  // 文本放行后再看图片；没图片就直接过
  if (!ad.imageUrl) {
    return { allowed: true, reason: textVerdict.reason || 'AI: text-only, looks safe' };
  }

  const imgVerdict = await moderateImage(env, ad.imageUrl);
  if (!imgVerdict.allowed) return imgVerdict;

  return { allowed: true, reason: 'AI: text + image looked fine' };
}

async function moderateText(
  env: Env,
  ad: { title: string; content?: string | null; linkUrl: string },
): Promise<ModerationResult> {
  const userPrompt = [
    `Title: ${ad.title}`,
    `Description: ${ad.content ?? '(none)'}`,
    `Landing URL: ${ad.linkUrl}`,
  ].join('\n');

  try {
    const res = (await env.AI.run(TEXT_MODEL, {
      messages: [
        { role: 'system', content: TEXT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 128,
    })) as { response?: string };
    return parseVerdict(res.response ?? '', 'text');
  } catch (e) {
    return { allowed: false, reason: `AI text moderation failed: ${errStr(e)}` };
  }
}

async function moderateImage(env: Env, imageUrl: string): Promise<ModerationResult> {
  let bytes: ArrayBuffer;
  try {
    const resp = await fetch(imageUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) {
      return { allowed: false, reason: `image fetch failed: HTTP ${resp.status}` };
    }
    // 抢在下载完之前看 Content-Length；没有就下载到上限后截断
    const lenHeader = resp.headers.get('content-length');
    if (lenHeader && Number(lenHeader) > MAX_IMAGE_BYTES) {
      return { allowed: false, reason: `image too large: ${lenHeader} bytes` };
    }
    bytes = await resp.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return { allowed: false, reason: `image too large: ${bytes.byteLength} bytes` };
    }
  } catch (e) {
    return { allowed: false, reason: `image fetch failed: ${errStr(e)}` };
  }

  try {
    // llava-1.5-7b-hf 接收 number[] 格式的图像字节
    const res = (await env.AI.run(VISION_MODEL, {
      image: Array.from(new Uint8Array(bytes)),
      prompt: IMAGE_PROMPT,
      max_tokens: 128,
    })) as { description?: string; response?: string };
    // 不同模型版本字段名不同，兼容一下
    const text = res.description ?? res.response ?? '';
    return parseVerdict(text, 'image');
  } catch (e) {
    return { allowed: false, reason: `AI image moderation failed: ${errStr(e)}` };
  }
}

function parseVerdict(raw: string, kind: 'text' | 'image'): ModerationResult {
  const trimmed = raw.trim();
  const json = extractJson(trimmed);
  if (!json) {
    return { allowed: false, reason: `AI (${kind}) returned non-JSON; sent to manual review` };
  }
  try {
    const parsed = JSON.parse(json) as { safe?: boolean; reason?: string };
    const reason = (parsed.reason ?? '').slice(0, 160);
    const prefix = kind === 'image' ? 'image' : 'text';
    return {
      allowed: parsed.safe === true,
      reason: reason || (parsed.safe ? `AI: ${prefix} ok` : `AI: ${prefix} needs review`),
    };
  } catch {
    return { allowed: false, reason: `AI (${kind}) JSON parse failed` };
  }
}

/** 从模型输出里抠出第一段 {...}。模型偶尔会带 markdown 栅栏。 */
function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function errStr(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
