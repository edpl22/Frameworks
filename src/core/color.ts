// Color utilities: conversions, WCAG contrast and harmony-based palette generation.

export type HSL = { h: number; s: number; l: number };

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

export function normalizeHex(hex: string): string {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return '#000000';
  return '#' + h.toLowerCase();
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}

export function hexToHsl(hex: string): HSL {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: HSL): string {
  const S = clamp(s / 100);
  const L = clamp(l / 100);
  const k = (n: number) => (n + ((h % 360) + 360) % 360 / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function wcagLevel(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

/** Best readable foreground (near-white or near-black) for a given background. */
export function readableOn(bg: string): string {
  return contrastRatio(bg, '#ffffff') >= contrastRatio(bg, '#0b0b12') ? '#ffffff' : '#0b0b12';
}

export function shift(hex: string, dl: number, ds = 0, dh = 0): string {
  const c = hexToHsl(hex);
  return hslToHex({ h: c.h + dh, s: clamp(c.s + ds, 0, 100), l: clamp(c.l + dl, 0, 100) });
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Tailwind-like 50..950 tonal scale. */
export function tonalScale(hex: string): Record<string, string> {
  const base = hexToHsl(hex);
  const stops: [string, number][] = [
    ['50', 97], ['100', 93], ['200', 86], ['300', 76], ['400', 64], ['500', 54],
    ['600', 45], ['700', 37], ['800', 29], ['900', 22], ['950', 13],
  ];
  return Object.fromEntries(stops.map(([k, l]) => [k, hslToHex({ h: base.h, s: base.s, l })]));
}

export type Harmony = 'complementary' | 'analogous' | 'triadic' | 'split' | 'monochrome';

export function harmonyPalette(seed: string, harmony: Harmony, mode: 'light' | 'dark') {
  const s = hexToHsl(seed);
  const offsets: Record<Harmony, [number, number]> = {
    complementary: [180, 30],
    analogous: [30, -30],
    triadic: [120, 240],
    split: [150, 210],
    monochrome: [0, 0],
  };
  const [o1, o2] = offsets[harmony];
  const sat = Math.max(s.s, 55);
  const primary = hslToHex({ h: s.h, s: sat, l: clamp(s.l, 42, 62) });
  const secondary = harmony === 'monochrome'
    ? hslToHex({ h: s.h, s: sat * 0.6, l: mode === 'dark' ? 70 : 30 })
    : hslToHex({ h: s.h + o1, s: sat * 0.85, l: 52 });
  const accent = harmony === 'monochrome'
    ? hslToHex({ h: s.h, s: sat, l: 75 })
    : hslToHex({ h: s.h + o2, s: Math.min(95, sat + 10), l: 58 });

  if (mode === 'dark') {
    return {
      primary, secondary, accent,
      background: hslToHex({ h: s.h, s: 25, l: 5 }),
      surface: hslToHex({ h: s.h, s: 18, l: 10 }),
      text: hslToHex({ h: s.h, s: 20, l: 96 }),
      muted: hslToHex({ h: s.h, s: 10, l: 64 }),
      border: hslToHex({ h: s.h, s: 14, l: 18 }),
    };
  }
  return {
    primary, secondary, accent,
    background: '#ffffff',
    surface: hslToHex({ h: s.h, s: 30, l: 97 }),
    text: hslToHex({ h: s.h, s: 30, l: 9 }),
    muted: hslToHex({ h: s.h, s: 10, l: 42 }),
    border: hslToHex({ h: s.h, s: 18, l: 90 }),
  };
}

export function randomSeed(): string {
  return hslToHex({ h: Math.random() * 360, s: 60 + Math.random() * 30, l: 50 + Math.random() * 10 });
}
