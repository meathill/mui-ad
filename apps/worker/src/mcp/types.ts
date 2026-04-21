import type { Env } from '../env';

export type JsonSchema = Record<string, unknown>;

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** 调用 MCP tool 的鉴权上下文。root key → user=null（跨用户）；per-user key → user 即调用者。 */
export interface McpCaller {
  user: { id: string; email: string; name: string } | null;
}

export interface McpTool<Args = Record<string, unknown>> {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler: (args: Args, env: Env, caller: McpCaller) => Promise<ToolResult>;
}

export function textResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

export function errorResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}
