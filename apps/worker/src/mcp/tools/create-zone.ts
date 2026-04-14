import { MCPTool } from '@modelcontextprotocol/sdk';
import Repository from '@muiad/db/src/repository';

const createZoneTool: MCPTool = {
  name: 'muiad_create_zone',
  description: '创建广告位',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '广告位名称' },
      site_url: { type: 'string', description: '所属站点 URL' },
      width: { type: 'integer', description: '宽度（px）' },
      height: { type: 'integer', description: '高度（px）' },
    },
    required: ['name', 'site_url', 'width', 'height'],
  },
  execute: async (input, context) => {
    const { name, site_url, width, height } = input;
    const env = context.env as any;
    const repository = new Repository(env.DB);

    const [zone] = await repository.createZone({
      name,
      siteUrl: site_url,
      width,
      height,
      status: 'active',
    });

    const widgetCode = `<script src="${env.MUIAD_URL}/widget.js" data-zone="${zone.id}" async></script>`;

    return {
      zone_id: zone.id,
      widget_code: widgetCode,
      message: '广告位创建成功',
    };
  },
};

export { createZoneTool as muiad_create_zone };
