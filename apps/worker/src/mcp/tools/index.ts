import type { McpTool } from '../types';
import { createAdTool } from './create-ad';
import { createZoneTool } from './create-zone';
import { getAdConversionsTool } from './get-ad-conversions';
import { getZoneStatsTool } from './get-zone-stats';
import { listAdsTool } from './list-ads';
import { listAdsPerformanceTool } from './list-ads-performance';
import { listPendingAttachmentsTool } from './list-pending-attachments';
import { listZonesTool } from './list-zones';
import { registerProductTool } from './register-product';
import { reviewAttachmentTool } from './review-attachment';
import { scanZonesTool } from './scan-zones';
import { setAdStatusTool } from './set-ad-status';

export const ALL_TOOLS: McpTool<never>[] = [
  // 发布方（zone 所有者）视角
  createZoneTool as McpTool<never>,
  listZonesTool as McpTool<never>,
  listPendingAttachmentsTool as McpTool<never>,
  reviewAttachmentTool as McpTool<never>,
  // 广告主视角
  scanZonesTool as McpTool<never>,
  registerProductTool as McpTool<never>,
  createAdTool as McpTool<never>,
  listAdsTool as McpTool<never>,
  setAdStatusTool as McpTool<never>,
  listAdsPerformanceTool as McpTool<never>,
  // 数据查询
  getZoneStatsTool as McpTool<never>,
  getAdConversionsTool as McpTool<never>,
];
