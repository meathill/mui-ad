import { ads, createDb, products } from '@muiad/db';
import { moderateAd } from '../../lib/moderation';
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
  async handler(args, env, caller) {
    const db = createDb(env.DB);
    const weight = args.weight ?? 1;
    // 先校验 product_id 的归属：per-user 调用不能往别人的产品下挂广告
    const product = await products.get(db, args.product_id, caller.user?.id);
    if (!product) {
      return textResult(`找不到 product_id=${args.product_id}（可能不存在，或不属于你）。`);
    }
    const ad = await ads.create(db, {
      id: crypto.randomUUID(),
      productId: args.product_id,
      title: args.title,
      content: args.content,
      imageUrl: args.image_url,
      linkUrl: args.link_url,
      weight,
      status: 'active',
      ownerId: caller.user?.id ?? null,
      createdAt: new Date().toISOString(),
    });
    // 放开跨用户投放：调 attachToZones，内部按每个 zone 所有者的 approval_mode
    // 决定是立即上线还是排队等审核
    const attach = await ads.attachToZones(db, ad.id, args.zone_ids, {
      weight,
      advertiserId: caller.user?.id ?? null,
      moderate: ({ ad }) => moderateAd(env, ad),
    });
    const lines = [
      `已创建广告「${ad.title}」`,
      `- ad_id: ${ad.id}`,
      `- 落地页: ${ad.linkUrl}`,
      `- 已直接上线: ${attach.active.length}`,
      `- 等待 zone 所有者审批: ${attach.pending.length}`,
    ];
    if (attach.skipped.length > 0) lines.push(`- 跳过（zone 不存在或已暂停）: ${attach.skipped.length}`);
    return textResult(lines.join('\n'));
  },
};
