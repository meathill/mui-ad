import { Hono } from "hono";
import Repository from "@muiad/db/src/repository";

const app = new Hono();

app.get("/", async (c) => {
  const zoneId = c.req.query("zone");
  if (!zoneId) {
    return c.text("Missing zone parameter", 400);
  }

  const env = c.env;
  const repository = new Repository(env.DB);

  // 获取广告位下的所有活跃广告
  const adsWithWeight = await repository.getAdsByZoneId(zoneId);
  if (adsWithWeight.length === 0) {
    return c.text("No ads available for this zone", 204);
  }

  // 按权重随机选择广告
  const totalWeight = adsWithWeight.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedAd;

  for (const item of adsWithWeight) {
    random -= item.weight;
    if (random <= 0) {
      selectedAd = item.ad;
      break;
    }
  }

  if (!selectedAd) {
    return c.text("No ads available", 204);
  }

  // 记录展示
  const ipHash = await hashIp(c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || "");
  await repository.createImpression({
    zoneId,
    adId: selectedAd.id,
    ipHash,
    userAgent: c.req.header("user-agent") || undefined,
  });

  // 构建广告 HTML
  const adHtml = `
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #eee; border-radius: 4px; padding: 16px;">
      ${selectedAd.imageUrl ? `<img src="${selectedAd.imageUrl}" style="max-width: 100%; max-height: 120px; margin-bottom: 8px;" alt="${selectedAd.title}">` : ""}
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${selectedAd.title}</h3>
      ${selectedAd.content ? `<p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">${selectedAd.content}</p>` : ""}
      <a href="${env.MUIAD_URL}/track/click?ad=${selectedAd.id}&zone=${zoneId}&redirect=${encodeURIComponent(selectedAd.linkUrl)}" style="display: inline-block; padding: 8px 16px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">了解更多</a>
    </div>
  `;

  return c.html(adHtml);
});

// 简单的 IP 哈希函数
async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export default app;
