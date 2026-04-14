import { MCPTool } from '@modelcontextprotocol/sdk';
import Repository from '@muiad/db/src/repository';

const registerProductTool: MCPTool = {
  name: 'muiad_register_product',
  description: '注册产品',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '产品名称' },
      url: { type: 'string', description: '产品 URL' },
      description: { type: 'string', description: '产品描述' },
    },
    required: ['name', 'url'],
  },
  execute: async (input, context) => {
    const { name, url, description } = input;
    const env = context.env as any;
    const repository = new Repository(env.DB);

    const [product] = await repository.createProduct({
      name,
      url,
      description,
    });

    return {
      product_id: product.id,
      message: '产品注册成功',
    };
  },
};

export { registerProductTool as muiad_register_product };
