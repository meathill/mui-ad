import { MCPTool } from "@modelcontextprotocol/sdk";
import Repository from "@muiad/db/src/repository";

const listAdsTool: MCPTool = {
  name: "muiad_list_ads",
  description: "列出所有广告",
  inputSchema: { type: "object", properties: {} },
  execute: async (input, context) => {
    const env = context.env as any;
    const repository = new Repository(env.DB);

    const ads = await repository.getAds();

    return {
      ads: ads.map((ad) => ({
        id: ad.id,
        product_id: ad.productId,
        title: ad.title,
        link_url: ad.linkUrl,
        weight: ad.weight,
        status: ad.status,
        created_at: ad.createdAt
      }))
    };
  }
};

export { listAdsTool as muiad_list_ads };
