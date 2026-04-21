import OpenAI from 'openai';
import { base64ToArrayBuffer, type ImageProvider } from './types';

export const openaiProvider: ImageProvider = {
  id: 'openai',
  label: 'OpenAI',
  keyUrl: 'https://platform.openai.com/api-keys',
  models: [
    {
      id: 'gpt-image-1.5',
      label: 'GPT Image 1.5',
      defaultSize: '1024x1024',
      sizes: ['1024x1024', '1024x1536', '1536x1024'],
    },
    {
      id: 'gpt-image-1',
      label: 'GPT Image 1 (legacy)',
      defaultSize: '1024x1024',
      sizes: ['1024x1024', '1024x1536', '1536x1024'],
    },
  ],
  async generate(input, apiKey) {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const result = await client.images.generate({
      model: input.model,
      prompt: input.prompt,
      size: (input.size ?? '1024x1024') as '1024x1024',
      n: 1,
    });
    const entry = result.data?.[0];
    if (!entry) throw new Error('OpenAI returned no image data');

    let bytes: ArrayBuffer;
    let contentType = 'image/png';
    if (entry.b64_json) {
      bytes = base64ToArrayBuffer(entry.b64_json);
    } else if (entry.url) {
      const r = await fetch(entry.url);
      if (!r.ok) throw new Error(`Failed to fetch generated image: ${r.status}`);
      bytes = await r.arrayBuffer();
      contentType = r.headers.get('content-type') ?? contentType;
    } else {
      throw new Error('OpenAI response missing both b64_json and url');
    }

    return {
      bytes,
      contentType,
      model: input.model,
      provider: 'openai',
    };
  },
};
