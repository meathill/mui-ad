import { MCPTool } from "@modelcontextprotocol/sdk";
import Repository from "@muiad/db/src/repository";

const listZonesTool: MCPTool = {
  name: "muiad_list_zones",
  description: "列出所有广告位",
  inputSchema: { type: "object", properties: {} },
  execute: async (input, context) => {
    const env = context.env as any;
    const repository = new Repository(env.DB);

    const zones = await repository.getZones();

    return {
      zones: zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        site_url: zone.siteUrl,
        width: zone.width,
        height: zone.height,
        status: zone.status,
        created_at: zone.createdAt
      }))
    };
  }
};

export { listZonesTool as muiad_list_zones };
