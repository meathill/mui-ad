import { ads, createDb, products, zones } from '@muiad/db';
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
    // per-user 调用：只能挂到自己名下的 zone；root key 不过滤
    let attachedZoneIds = args.zone_ids;
    if (caller.user) {
      const mine = await zones.list(db, caller.user.id);
      const mySet = new Set(mine.map((z) => z.id));
      attachedZoneIds = args.zone_ids.filter((id) => mySet.has(id));
    }
    if (attachedZoneIds.length > 0) {
      await ads.attachToZones(db, ad.id, attachedZoneIds, weight);
    }
    const skipped = args.zone_ids.length - attachedZoneIds.length;
    return textResult(
      `已创建广告「${ad.title}」\n` +
        `- ad_id: ${ad.id}\n` +
        `- 落地页: ${ad.linkUrl}\n` +
        `- 已投放到 ${attachedZoneIds.length} 个广告位` +
        (skipped > 0 ? `（${skipped} 个不在你名下，已跳过）` : ''),
    );
  },
};
