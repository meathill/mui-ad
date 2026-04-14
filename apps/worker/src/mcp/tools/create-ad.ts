import { MCPTool } from "@modelcontextprotocol/sdk";
import Repository from "@muiad/db/src/repository";

const createAdTool: MCPTool = {
  name: "muiad_create_ad",
  description: "创建广告",
  inputSchema: {
    type: "object",
    properties: {
      product_id: { type: "string", description: "关联产品 ID" },
      title:      { type: "string", description: "广告标题" },
      content:    { type: "string", description: "广告文案" },
      image_url:  { type: "string", description: "Banner 图片 URL" },
      link_url:   { type: "string", description: "落地页链接" },
      zone_ids:   { type: "array", items: { type: "string" }, description: "投放到的广告位 ID 列表" },
      weight:     { type: "integer", description: "权重，默认 1" },
    },
    required: ["product_id", "title", "link_url", "zone_ids"]
  },
  execute: async (input, context) => {
    const { product_id, title, content, image_url, link_url, zone_ids, weight = 1 } = input;
    const env = context.env as any;
    const repository = new Repository(env.DB);

    // 创建广告
    const [ad] = await repository.createAd({
      productId: product_id,
      title,
      content,
      imageUrl: image_url,
      linkUrl: link_url,
      weight,
      status: "active",
    });

    // 关联广告位
    for (const zoneId of zone_ids) {
      await repository.createZoneAd({
        zoneId,
        adId: ad.id,
        weight,
      });
    }

    return {
      ad_id: ad.id,
      message: "广告创建成功"
    };
  }
};

export { createAdTool as muiad_create_ad };
