import type { McpTool } from '../types';
import { createAdTool } from './create-ad';
import { createZoneTool } from './create-zone';
import { getAdConversionsTool } from './get-ad-conversions';
import { getZoneStatsTool } from './get-zone-stats';
import { listAdsTool } from './list-ads';
import { listZonesTool } from './list-zones';
import { registerProductTool } from './register-product';
import { scanZonesTool } from './scan-zones';

export const ALL_TOOLS: McpTool<never>[] = [
  createZoneTool as McpTool<never>,
  listZonesTool as McpTool<never>,
  scanZonesTool as McpTool<never>,
  registerProductTool as McpTool<never>,
  createAdTool as McpTool<never>,
  listAdsTool as McpTool<never>,
  getZoneStatsTool as McpTool<never>,
  getAdConversionsTool as McpTool<never>,
];
