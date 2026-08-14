import { storeAsset } from '../../lib/assets';
import { type McpTool, textResult } from '../types';

interface Args {
  /** base64 编码的图片字节，或 data URL（推荐，自带 content type） */
  data: string;
  /** 裸 base64 且无法从魔数识别类型时必填（如 SVG） */
  content_type?: string;
}

const DATA_URL_RE = /^data:([^;,]+)(?:;base64)?,/;

/** 从文件头魔数推断图片类型；识别不了返回 null（SVG 之类需要显式 content_type） */
function sniffContentType(bytes: Uint8Array): string | null {
  const head = bytes.subarray(0, 12);
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    return 'image/png';
  }
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg';
  }
  if (head.length >= 4 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x38) {
    return 'image/gif';
  }
  if (head.length >= 12 && head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46) {
    const brand = new TextDecoder().decode(head.subarray(8, 12));
    if (brand === 'WEBP') return 'image/webp';
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') return 'image/avif';
  }
  return null;
}

function base64ToBytes(input: string): Uint8Array {
  const normalized = input.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
    throw new Error('Invalid base64 data');
  }
  const bin = atob(normalized);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export const uploadAssetTool: McpTool<Args> = {
  name: 'muiad_upload_asset',
  description:
    '上传图片素材到 MuiAD 自托管存储，返回可直接用作 create_ad 的 image_url 的公网 URL。' +
    'data 接受 data URL（如 data:image/png;base64,...）或裸 base64；大小上限 5MB，支持 jpeg/png/webp/gif/avif/svg。',
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'base64 编码的图片字节，或带 mime 前缀的 data URL（推荐）',
      },
      content_type: {
        type: 'string',
        description: '图片的 MIME 类型（裸 base64 且魔数识别不了时必填，如 image/svg+xml）',
      },
    },
    required: ['data'],
  },
  async handler(args, env) {
    const dataUrl = DATA_URL_RE.exec(args.data);
    let bytes: Uint8Array;
    let contentType: string | null;

    if (dataUrl) {
      contentType = dataUrl[1].toLowerCase();
      bytes = base64ToBytes(args.data.slice(dataUrl[0].length));
    } else {
      bytes = base64ToBytes(args.data);
      contentType = args.content_type?.toLowerCase() ?? sniffContentType(bytes);
    }
    if (!contentType) {
      throw new Error('无法识别图片类型：请使用 data URL 或提供 content_type 参数');
    }

    const asset = await storeAsset(env, bytes.buffer as ArrayBuffer, contentType);
    const lines = [
      '已上传素材',
      `- key: ${asset.key}`,
      `- 公网 URL（create_ad 的 image_url 直接用这个）: ${asset.url}`,
      `- 类型: ${asset.contentType}`,
      `- 大小: ${asset.size} bytes`,
    ];
    return textResult(lines.join('\n'));
  },
};
