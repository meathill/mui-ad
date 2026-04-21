import { createDb, zones } from '@muiad/db';
import { type McpTool, textResult } from '../types';

interface Args {
  name: string;
  site_url: string;
  width: number;
  height: number;
}

export const createZoneTool: McpTool<Args> = {
  name: 'muiad_create_zone',
  description: '创建广告位。返回新广告位的 ID 以及可直接嵌入站点的 HTML 代码片段。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '广告位名称，用于后台识别' },
      site_url: { type: 'string', description: '所属站点 URL' },
      width: { type: 'integer', description: '宽度（px）' },
      height: { type: 'integer', description: '高度（px）' },
    },
    required: ['name', 'site_url', 'width', 'height'],
  },
  async handler(args, env, caller) {
    const db = createDb(env.DB);
    const zone = await zones.create(db, {
      id: crypto.randomUUID(),
      name: args.name,
      siteUrl: args.site_url,
      width: args.width,
      height: args.height,
      status: 'active',
      ownerId: caller.user?.id ?? null,
      createdAt: new Date().toISOString(),
    });

    const embed = `<div data-muiad="${zone.id}" style="width:${zone.width}px;height:${zone.height}px"></div>\n<script src="${env.MUIAD_URL}/widget.js" async></script>`;

    return textResult(
      `已创建广告位「${zone.name}」\n` +
        `- zone_id: ${zone.id}\n` +
        `- 尺寸: ${zone.width}×${zone.height}\n` +
        `- 站点: ${zone.siteUrl}\n\n` +
        '嵌入代码：\n```html\n' +
        embed +
        '\n```',
    );
  },
};
