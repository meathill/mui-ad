import type { Env } from '../env';
import { ALL_TOOLS } from './tools';
import { errorResult } from './types';

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_INFO = { name: 'muiad', version: '0.1.0' };

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: JsonRpcId; result: unknown }
  | { jsonrpc: '2.0'; id: JsonRpcId; error: { code: number; message: string; data?: unknown } };

/**
 * Handle a single JSON-RPC 2.0 message from an MCP client.
 * Returns `null` for notifications (where the spec forbids a response).
 */
export async function dispatchMcp(req: JsonRpcRequest, env: Env): Promise<JsonRpcResponse | null> {
  const { id, method, params } = req;
  const isNotification = id === undefined;

  const ok = (result: unknown): JsonRpcResponse => ({
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  });
  const err = (code: number, message: string): JsonRpcResponse => ({
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message },
  });

  switch (method) {
    case 'initialize': {
      const clientVersion = (params?.protocolVersion as string) ?? PROTOCOL_VERSION;
      return ok({
        protocolVersion: clientVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });
    }

    case 'ping':
      return ok({});

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;

    case 'tools/list':
      return ok({
        tools: ALL_TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case 'tools/call': {
      const name = params?.name as string | undefined;
      const args = (params?.arguments as Record<string, unknown> | undefined) ?? {};
      if (!name) return err(-32602, 'Missing "name" in tools/call params');

      const tool = ALL_TOOLS.find((t) => t.name === name);
      if (!tool) return err(-32601, `Unknown tool: ${name}`);

      try {
        const result = await tool.handler(args as never, env);
        return ok(result);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return ok(errorResult(`Tool "${name}" failed: ${message}`));
      }
    }

    default:
      if (isNotification) return null;
      return err(-32601, `Method not found: ${method}`);
  }
}
