import type { Product } from '@muiad/db';

export function defaultPrompt(product: Product): string {
  return `Refined editorial-style banner artwork for "${product.name}".

About the product: ${product.description ?? 'A developer tool.'}

Style direction:
- Clean, minimal, premium aesthetic with a single strong focal element.
- Warm neutral background (off-white / paper), one ember-orange accent.
- New York Times editorial feel. No embedded text, words, or logos.
- AVOID generic AI aesthetics: no purple-blue gradients, no holographic slop,
  no neon on dark backgrounds.`;
}
