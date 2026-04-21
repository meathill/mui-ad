import { createDb, products } from '@muiad/db';
import { type McpTool, textResult } from '../types';

interface Args {
  name: string;
  url: string;
  description?: string;
}

export const registerProductTool: McpTool<Args> = {
  name: 'muiad_register_product',
  description: '登记一个要推广的产品，返回产品 ID，供后续创建广告时引用。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '产品名称' },
      url: { type: 'string', description: '产品官网 URL' },
      description: { type: 'string', description: '产品简介（可选）' },
    },
    required: ['name', 'url'],
  },
  async handler(args, env, caller) {
    const db = createDb(env.DB);
    const product = await products.create(db, {
      id: crypto.randomUUID(),
      name: args.name,
      url: args.url,
      description: args.description,
      ownerId: caller.user?.id ?? null,
      createdAt: new Date().toISOString(),
    });
    return textResult(`已登记产品「${product.name}」\n- product_id: ${product.id}\n- url: ${product.url}`);
  },
};
