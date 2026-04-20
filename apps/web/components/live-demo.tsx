'use client';

import { useEffect, useRef } from 'react';

const ZONE_ID = '29e56581-3dcf-4164-acff-32c36bc71f77';
const API_BASE = 'https://api.muiad.meathill.com';

/**
 * Embeds MuiAD's own widget.js on our landing page. The ad rendered
 * inside the 300x250 slot is served by the same pipeline a third-party
 * site would hit — every landing visit fires a real impression, every
 * click on it fires a real click.
 */
export default function LiveDemo() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const s = document.createElement('script');
    s.src = `${API_BASE}/widget.js`;
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div
      data-muiad={ZONE_ID}
      style={{ width: 300, height: 250 }}
      className="rounded-2xl border border-rule bg-paper shadow-[0_20px_60px_-30px_oklch(0.2_0.05_50/0.35)]"
    />
  );
}
