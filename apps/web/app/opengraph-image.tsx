import { ImageResponse } from 'next/og';

export const alt = 'MuiAD — Write code. Let the AI run your marketing.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SERIF_URL =
  'https://raw.githubusercontent.com/Instrument/instrument-serif/main/fonts/ttf/InstrumentSerif-Regular.ttf';
const SERIF_ITALIC_URL =
  'https://raw.githubusercontent.com/Instrument/instrument-serif/main/fonts/ttf/InstrumentSerif-Italic.ttf';
const MONO_URL = 'https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@master/fonts/ttf/JetBrainsMono-Regular.ttf';

export default async function OpengraphImage() {
  const [serif, serifItalic, mono] = await Promise.all([
    fetch(SERIF_URL).then((r) => r.arrayBuffer()),
    fetch(SERIF_ITALIC_URL).then((r) => r.arrayBuffer()),
    fetch(MONO_URL).then((r) => r.arrayBuffer()),
  ]);

  const PAPER = '#faf5ea';
  const INK = '#1a1a17';
  const INK_SOFT = '#5b564c';
  const EMBER = '#c76a2b';
  const RULE = '#d9d2c1';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: PAPER,
        color: INK,
        display: 'flex',
        flexDirection: 'column',
        padding: '80px',
        fontFamily: 'Geist, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono',
          fontSize: 18,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: EMBER,
        }}
      >
        <span>MCP-first // self-hosted // open source</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 12, color: INK_SOFT }}>
          <span style={{ fontFamily: 'Instrument Serif', fontSize: 32, letterSpacing: 0, color: INK }}>MuiAD</span>
          <span style={{ fontSize: 14 }}>v0 · beta</span>
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginTop: 40,
        }}
      >
        <div
          style={{
            fontFamily: 'Instrument Serif',
            fontSize: 128,
            lineHeight: 1.02,
            letterSpacing: '-0.01em',
            color: INK,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Write code.</span>
          <span style={{ display: 'flex', gap: 28 }}>
            <span>Let the AI</span>
            <span style={{ fontStyle: 'italic', color: EMBER }}>run</span>
          </span>
          <span>your marketing.</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 28,
          borderTop: `1px solid ${RULE}`,
          fontFamily: 'JetBrains Mono',
          fontSize: 18,
          color: INK_SOFT,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        <span>muiad.meathill.com</span>
        <span>built on cloudflare · by @meathill</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Instrument Serif', data: serif, style: 'normal', weight: 400 },
        { name: 'Instrument Serif', data: serifItalic, style: 'italic', weight: 400 },
        { name: 'JetBrains Mono', data: mono, style: 'normal', weight: 400 },
      ],
    },
  );
}
