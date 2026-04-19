import type { Env } from '../env';

export type JsonSchema = Record<string, unknown>;

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface McpTool<Args = Record<string, unknown>> {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler: (args: Args, env: Env) => Promise<ToolResult>;
}

export function textResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

export function errorResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}
