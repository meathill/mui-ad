import { ads, createDb } from '@muiad/db';
import { type McpTool, textResult } from '../types';

interface Args {
  product_id: string;
  title: string;
  content?: string;
  image_url?: string;
  link_url: string;
  zone_ids: string[];
  weight?: number;
}

export const createAdTool: McpTool<Args> = {
  name: 'muiad_create_ad',
  description: '创建广告并直接投放到指定的广告位。返回广告 ID。',
  inputSchema: {
    type: 'object',
    properties: {
      product_id: { type: 'string', description: '关联产品 ID（由 muiad_register_product 返回）' },
      title: { type: 'string', description: '广告标题' },
      content: { type: 'string', description: '广告描述文案（可选）' },
      image_url: { type: 'string', description: 'Banner 图片 URL（可选）' },
      link_url: { type: 'string', description: '点击后跳转的落地页 URL' },
      zone_ids: {
        type: 'array',
        items: { type: 'string' },
        description: '要投放到的广告位 ID 列表（由 muiad_list_zones 查到）',
      },
      weight: { type: 'integer', description: '权重，默认 1', default: 1 },
    },
    required: ['product_id', 'title', 'link_url', 'zone_ids'],
  },
  async handler(args, env) {
    const db = createDb(env.DB);
    const weight = args.weight ?? 1;
    const ad = await ads.create(db, {
      id: crypto.randomUUID(),
      productId: args.product_id,
      title: args.title,
      content: args.content,
      imageUrl: args.image_url,
      linkUrl: args.link_url,
      weight,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    if (args.zone_ids.length > 0) {
      await ads.attachToZones(db, ad.id, args.zone_ids, weight);
    }
    return textResult(
      `已创建广告「${ad.title}」\n` +
        `- ad_id: ${ad.id}\n` +
        `- 落地页: ${ad.linkUrl}\n` +
        `- 已投放到 ${args.zone_ids.length} 个广告位`,
    );
  },
};
