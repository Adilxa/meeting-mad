import { Inter, JetBrains_Mono, Unbounded } from 'next/font/google';

/*
 * Substitutes from the design reference (docs/DESIGN.md): ObviouslyVariable → Unbounded,
 * the closest wide geometric display face that also has Cyrillic; Degular → Inter;
 * Bergen Mono → JetBrains Mono.
 */
export const displayFont = Unbounded({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-unbounded',
  display: 'swap',
});

export const sansFont = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const monoFont = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});
