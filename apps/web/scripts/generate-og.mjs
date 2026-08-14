// 构建期生成 public/og.png —— OG 图从动态渲染改为纯静态资源，CDN 可 immutable 缓存。
// 设计必须与历史 opengraph-image.tsx 保持视觉一致（Instrument Serif + JetBrains Mono + 纸色背景）。
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { ImageResponse } from 'next/og.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og.png');

const SERIF_URL =
  'https://raw.githubusercontent.com/Instrument/instrument-serif/main/fonts/ttf/InstrumentSerif-Regular.ttf';
const SERIF_ITALIC_URL =
  'https://raw.githubusercontent.com/Instrument/instrument-serif/main/fonts/ttf/InstrumentSerif-Italic.ttf';
const MONO_URL = 'https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@master/fonts/ttf/JetBrainsMono-Regular.ttf';

const PAPER = '#faf5ea';
const INK = '#1a1a17';
const INK_SOFT = '#5b564c';
const EMBER = '#c76a2b';
const RULE = '#d9d2c1';

const h = React.createElement;

async function generate() {
  const [serif, serifItalic, mono] = await Promise.all([
    fetch(SERIF_URL).then((r) => r.arrayBuffer()),
    fetch(SERIF_ITALIC_URL).then((r) => r.arrayBuffer()),
    fetch(MONO_URL).then((r) => r.arrayBuffer()),
  ]);

  const row = (children, extra = {}) =>
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...extra } }, children);

  const response = new ImageResponse(
    h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          background: PAPER,
          color: INK,
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          fontFamily: 'Geist, sans-serif',
        },
      },
      [
        row([
          h(
            'span',
            {
              style: {
                fontFamily: 'JetBrains Mono',
                fontSize: 18,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: EMBER,
              },
            },
            'MCP-first // self-hosted // open source',
          ),
          h('span', { style: { display: 'flex', alignItems: 'baseline', gap: 12, color: INK_SOFT } }, [
            h(
              'span',
              { style: { fontFamily: 'Instrument Serif', fontSize: 32, letterSpacing: 0, color: INK } },
              'MuiAD',
            ),
            h('span', { style: { fontSize: 14 } }, 'v1 · public beta'),
          ]),
        ]),
        h(
          'div',
          { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: 40 } },
          [
            h(
              'div',
              {
                style: {
                  fontFamily: 'Instrument Serif',
                  fontSize: 128,
                  lineHeight: 1.02,
                  letterSpacing: '-0.01em',
                  color: INK,
                  display: 'flex',
                  flexDirection: 'column',
                },
              },
              [
                h('span', null, 'Write code.'),
                h('span', { style: { display: 'flex', gap: 28 } }, [
                  h('span', null, 'Let the AI'),
                  h('span', { style: { fontStyle: 'italic', color: EMBER } }, 'run'),
                ]),
                h('span', null, 'your marketing.'),
              ],
            ),
          ],
        ),
        row(
          [h('span', null, 'muiad.meathill.com'), h('span', null, 'self-hosted · MCP-first · cloudflare workers AI')],
          {
            paddingTop: 28,
            borderTop: `1px solid ${RULE}`,
            fontFamily: 'JetBrains Mono',
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          },
        ),
      ],
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Instrument Serif', data: serif, style: 'normal', weight: 400 },
        { name: 'Instrument Serif', data: serifItalic, style: 'italic', weight: 400 },
        { name: 'JetBrains Mono', data: mono, style: 'normal', weight: 400 },
      ],
    },
  );

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, Buffer.from(await response.arrayBuffer()));
  console.log(`OG image generated: ${OUT}`);
}

await generate();
