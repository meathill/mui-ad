import { MCPTool } from "@modelcontextprotocol/sdk";
import Repository from "@muiad/db/src/repository";

const getZoneStatsTool: MCPTool = {
  name: "muiad_get_zone_stats",
  description: "查看广告位统计数据",
  inputSchema: {
    type: "object",
    properties: {
      zone_id: { type: "string", description: "广告位 ID" },
    },
    required: ["zone_id"]
  },
  execute: async (input, context) => {
    const { zone_id } = input;
    const env = context.env as any;
    const repository = new Repository(env.DB);

    const stats = await repository.getZoneStats(zone_id);

    return stats;
  }
};

export { getZoneStatsTool as muiad_get_zone_stats };
