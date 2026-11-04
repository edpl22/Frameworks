import { newElement, type CanvasEl, type ColorRef } from './canvas';
import type { Props, PropValue, SectionStyle } from './types';

// ════════════════════════════════════════════════════════════════
//  Ready-made free-form compositions and themed decorations.
//  Used by the Canvas "Elementos" panel and by the themed templates.
// ════════════════════════════════════════════════════════════════

export type Deco = 'none' | 'neon' | 'stars' | 'runes' | 'terminal' | 'playful' | 'pixel' | 'eq' | 'leaves' | 'orbs' | 'glitch' | 'crimson' | 'shelves';

const E = newElement;
const deco = (o: Partial<CanvasEl>) => E('shape', { mobileHidden: true, z: 0, ...o });

/** Decorative layer for a section, kept behind content and hidden on phones. */
export function decoration(kind: Deco, rows: number, side: 'right' | 'left' | 'both' = 'right'): CanvasEl[] {
  const r = side === 'left' ? 1 : 8;
  switch (kind) {
    case 'neon': return [
      deco({ col: r, row: 1, span: 5, rows: Math.max(4, rows - 2), shape: 'circle', fill: 'primary', blur: 70, opacity: 0.55 }),
      deco({ col: side === 'left' ? 4 : 10, row: Math.ceil(rows / 2), span: 3, rows: Math.max(3, Math.floor(rows / 2)), shape: 'circle', fill: 'secondary', blur: 60, opacity: 0.5 }),
      deco({ col: 1, row: rows, span: 12, rows: 1, shape: 'line', fill: 'primary', glow: true, opacity: 0.7 }),
    ];
    case 'stars': return [
      ...[[9, 1, 0.9], [12, 2, 0.6], [10, 4, 0.8], [8, 6, 0.5], [11, 7, 0.9], [7, 2, 0.6], [12, 5, 0.7], [2, 1, 0.8], [1, 6, 0.5], [3, 9, 0.7]].map(([c, w, o]) => deco({ col: c, row: w, span: 1, rows: 1, shape: 'dot', fill: 'white', opacity: o, glow: o > 0.75 })),
      deco({ col: r, row: 2, span: 4, rows: Math.max(4, rows - 3), shape: 'circle', fill: 'gradient', opacity: 0.9, glow: true }),
      deco({ col: r - 1 > 0 ? r - 1 : r, row: Math.floor(rows / 2), span: 6, rows: 2, shape: 'ring', fill: 'accent', radius: 2, opacity: 0.7 }),
    ];
    case 'runes': return [
      deco({ col: r, row: 1, span: 5, rows: Math.max(5, rows - 1), shape: 'ring', fill: 'primary', radius: 3, opacity: 0.6 }),
      deco({ col: r + 1, row: 2, span: 3, rows: Math.max(3, rows - 3), shape: 'ring', fill: 'secondary', radius: 2, opacity: 0.5 }),
      deco({ col: r, row: 1, span: 5, rows: Math.max(5, rows - 1), shape: 'circle', fill: 'primary', blur: 80, opacity: 0.25 }),
    ];
    case 'terminal': return [
      deco({ col: r, row: 1, span: 5, rows: Math.max(5, rows - 1), shape: 'rect', fill: 'surface', radius: 14, shadow: true }),
      ...[0, 1, 2, 3].map((k) => E('text', { col: r + 1, row: 2 + k, span: 4, rows: 1, size: 'sm', font: 'mono', color: k === 3 ? 'primary' : 'muted', text: ['$ npm create app', '✓ dependências instaladas', '✓ build em 1.2s', '▍ pronto para deploy'][k], mobileHidden: true, z: 1 })),
    ];
    case 'playful': return [
      deco({ col: r, row: 1, span: 4, rows: 4, shape: 'blob', fill: 'secondary', opacity: 0.9 }),
      deco({ col: r + 2 > 10 ? 10 : r + 2, row: Math.max(3, rows - 4), span: 3, rows: 3, shape: 'circle', fill: 'accent', opacity: 0.9 }),
      deco({ col: r + 1, row: Math.floor(rows / 2), span: 2, rows: 2, shape: 'rect', fill: 'primary', radius: 12, opacity: 0.9 }),
    ];
    case 'pixel': return [
      ...[[9, 1, 'primary'], [10, 2, 'secondary'], [11, 1, 'accent'], [12, 3, 'primary'], [9, 4, 'accent'], [11, 5, 'secondary'], [10, 6, 'primary']].map(([c, w, f]) =>
        deco({ col: c as number, row: w as number, span: 1, rows: 1, shape: 'rect', fill: f as ColorRef, radius: 0 })),
    ];
    case 'eq': return [
      ...[3, 6, 4, 8, 5, 7, 2, 5, 3].map((h, k) => deco({ col: 4 + k > 12 ? 12 : 4 + k, row: rows - h + 1, span: 1, rows: h, shape: 'pill', fill: k % 2 ? 'secondary' : 'primary', opacity: 0.85 })).filter((x) => x.col >= 8),
      deco({ col: 8, row: 1, span: 5, rows: Math.max(4, rows - 2), shape: 'circle', fill: 'accent', blur: 70, opacity: 0.35 }),
    ];
    case 'leaves': return [
      deco({ col: r, row: 1, span: 4, rows: Math.max(4, rows - 3), shape: 'blob', fill: 'primary', opacity: 0.85 }),
      deco({ col: r + 2 > 10 ? 10 : r + 2, row: Math.max(2, rows - 5), span: 3, rows: 4, shape: 'blob', fill: 'secondary', opacity: 0.8 }),
      deco({ col: r + 1, row: 2, span: 2, rows: 2, shape: 'circle', fill: 'accent', opacity: 0.9 }),
    ];
    case 'orbs': return [
      deco({ col: r, row: 1, span: 5, rows: Math.max(4, rows - 2), shape: 'circle', fill: 'gradient', blur: 60, opacity: 0.6 }),
    ];
    case 'glitch': {
      // Offset color slabs and scan bars: a block peeking out from behind the image, glitch strips around it.
      const m = (c: number, span: number) => (side === 'left' ? 14 - c - span : c);
      return [
        deco({ col: m(9, 4), row: 2, span: 4, rows: Math.max(4, rows - 1), shape: 'rect', fill: 'primary', radius: 0 }),
        deco({ col: m(7, 2), row: Math.max(2, rows - 3), span: 2, rows: 1, shape: 'rect', fill: 'accent', radius: 0, opacity: 0.9 }),
        deco({ col: m(12, 1), row: 1, span: 1, rows: 1, shape: 'rect', fill: 'secondary', radius: 0, glow: true }),
        deco({ col: m(6, 3), row: 2, span: 3, rows: 1, shape: 'line', fill: 'secondary', opacity: 0.8 }),
        deco({ col: 1, row: rows, span: 6, rows: 1, shape: 'line', fill: 'primary', glow: true, opacity: 0.8 }),
      ];
    }
    case 'crimson': return [
      deco({ col: r + 1 > 9 ? 9 : r + 1, row: 1, span: 4, rows: Math.max(4, rows - 1), shape: 'rect', fill: 'primary', radius: 0, opacity: 0.92 }),
      deco({ col: r, row: Math.max(2, rows - 4), span: 3, rows: 3, shape: 'ring', fill: 'accent', radius: 3, opacity: 0.85 }),
      deco({ col: r, row: Math.max(2, rows - 4), span: 3, rows: 3, shape: 'circle', fill: 'primary', blur: 50, opacity: 0.45 }),
      deco({ col: 1, row: rows, span: 12, rows: 1, shape: 'line', fill: 'primary', opacity: 0.85 }),
      ...[[7, 1], [12, 3], [6, rows - 1]].map(([c, w]) => deco({ col: c, row: Math.max(1, w), span: 1, rows: 1, shape: 'dot', fill: 'accent', opacity: 0.8 })),
    ];
    case 'shelves': {
      // A row of book spines standing on a shelf, with a warm lamp glow behind.
      const spines: [number, ColorRef][] = [[8, 'primary'], [9, 'secondary'], [7, 'accent'], [9, 'secondary'], [8, 'primary']];
      const c0 = side === 'left' ? 1 : 8;
      return [
        deco({ col: r, row: 1, span: 5, rows: Math.max(4, rows - 2), shape: 'circle', fill: 'primary', blur: 80, opacity: 0.3 }),
        ...spines.flatMap(([h, f], k) => {
          const tall = Math.min(h, rows - 1);
          const top = rows - tall;
          // Gilded bands near the head and foot of each spine.
          const band: ColorRef = f === 'secondary' ? 'primary' : 'bg';
          return [
            deco({ col: c0 + k, row: top, span: 1, rows: tall, shape: 'rect', fill: f, radius: 4, opacity: 0.95 }),
            deco({ col: c0 + k, row: top + 1, span: 1, rows: 1, shape: 'line', fill: band, opacity: 0.8, z: 1 }),
            deco({ col: c0 + k, row: rows - 2, span: 1, rows: 1, shape: 'line', fill: band, opacity: 0.8, z: 1 }),
          ];
        }),
        deco({ col: c0, row: rows, span: 5, rows: 1, shape: 'line', fill: 'primary', opacity: 0.9 }),
      ];
    }
    default: return [];
  }
}

export interface Composition { rows: number; rowHeight?: number; elements: CanvasEl[]; style?: Partial<SectionStyle> }

export function toProps(c: Composition): Props {
  return { rows: c.rows, rowHeight: c.rowHeight ?? 40, elements: c.elements as unknown as PropValue };
}

// ─── compositions ───────────────────────────────────────────────
export interface HeroCopy { eyebrow?: string; title: string; text: string; primary?: string; secondary?: string; image?: boolean; deco?: Deco; center?: boolean }

export function heroComp(c: HeroCopy): Composition {
  const rows = 11;
  if (c.center) {
    // Keep solid decorations at the edges so they never cover a centered headline.
    const edge = (e: CanvasEl): CanvasEl => {
      if (e.blur || e.shape === 'dot' || e.shape === 'line') return e;
      const span = Math.min(e.span, 2);
      return { ...e, span, rows: Math.min(e.rows, 4), col: e.col >= 6 ? 13 - span : 1 };
    };
    return {
      rows,
      elements: [
        ...decoration(c.deco ?? 'none', rows, 'both').map(edge),
        ...(c.eyebrow ? [E('badge', { col: 5, span: 4, row: 1, text: c.eyebrow, align: 'center', fill: 'surface', color: 'primary', z: 2 })] : []),
        E('heading', { col: 2, span: 10, row: 2, rows: 4, text: c.title, size: 'display', align: 'center', level: 1, z: 2 }),
        E('text', { col: 3, span: 8, row: 6, rows: 2, text: c.text, align: 'center', size: 'md', z: 2 }),
        ...(c.primary ? [E('button', { col: c.secondary ? 4 : 5, span: c.secondary ? 3 : 4, row: 9, text: c.primary, href: '#', variant: 'primary', z: 2 })] : []),
        ...(c.secondary ? [E('button', { col: 7, span: 3, row: 9, text: c.secondary, href: '#', variant: 'secondary', z: 2 })] : []),
      ],
    };
  }
  return {
    rows,
    elements: [
      ...decoration(c.deco ?? 'none', rows, 'right'),
      ...(c.eyebrow ? [E('badge', { col: 1, span: 3, row: 1, text: c.eyebrow, fill: 'surface', color: 'primary', z: 2 })] : []),
      E('heading', { col: 1, span: 7, row: 2, rows: 4, text: c.title, size: 'display', level: 1, z: 2 }),
      E('text', { col: 1, span: 6, row: 6, rows: 2, text: c.text, size: 'md', z: 2 }),
      ...(c.primary ? [E('button', { col: 1, span: 3, row: 9, text: c.primary, href: '#', variant: 'primary', z: 2 })] : []),
      ...(c.secondary ? [E('button', { col: 4, span: 3, row: 9, text: c.secondary, href: '#', variant: 'secondary', z: 2 })] : []),
      ...(c.image ? [E('image', { col: 8, span: 5, row: 1, rows: 10, alt: '', radius: 20, z: 2, shadow: true })] : []),
    ],
  };
}

export function cardsComp(c: { eyebrow?: string; title: string; items: { icon: string; title: string; text: string }[]; cardFill?: ColorRef }): Composition {
  const n = Math.min(4, c.items.length);
  const span = 12 / n;
  const top = c.eyebrow ? 2 : 1;
  const cardRow = top + 3;
  return {
    rows: cardRow + 6,
    elements: [
      ...(c.eyebrow ? [E('text', { col: 1, span: 6, row: 1, rows: 1, text: c.eyebrow, size: 'xs', color: 'primary', upper: true })] : []),
      E('heading', { col: 1, span: 8, row: top, rows: 2, text: c.title, size: 'xl' }),
      ...c.items.slice(0, n).flatMap((it, k) => {
        const col = 1 + k * span;
        return [
          E('shape', { col, span, row: cardRow, rows: 6, shape: 'rect', fill: c.cardFill ?? 'surface', radius: 18, z: 0, group: `card-${k}` }),
          E('icon', { col: col, span: 1, row: cardRow + 1, rows: 1, icon: it.icon, color: 'primary', z: 1, group: `card-${k}` }),
          E('heading', { col, span, row: cardRow + 2, rows: 1, text: it.title, size: 'lg', z: 1, level: 3, group: `card-${k}` }),
          E('text', { col, span, row: cardRow + 3, rows: 3, text: it.text, size: 'sm', z: 1, group: `card-${k}` }),
        ];
      }),
    ],
  };
}

export function splitComp(c: { eyebrow?: string; title: string; text: string; button?: string; imageLeft?: boolean; deco?: Deco }): Composition {
  const rows = 10;
  const imgCol = c.imageLeft ? 1 : 7;
  const txtCol = c.imageLeft ? 7 : 1;
  return {
    rows,
    elements: [
      ...decoration(c.deco ?? 'none', rows, c.imageLeft ? 'left' : 'right').filter((e) => e.kind === 'shape').slice(0, 1),
      E('image', { col: imgCol, span: 6, row: 1, rows: 10, alt: '', radius: 20, z: 1 }),
      ...(c.eyebrow ? [E('text', { col: txtCol, span: 6, row: 2, rows: 1, text: c.eyebrow, size: 'xs', color: 'primary', upper: true, z: 2 })] : []),
      E('heading', { col: txtCol, span: 6, row: 3, rows: 3, text: c.title, size: 'xl', z: 2 }),
      E('text', { col: txtCol, span: 6, row: 6, rows: 2, text: c.text, z: 2 }),
      ...(c.button ? [E('button', { col: txtCol, span: 3, row: 9, text: c.button, href: '#', variant: 'secondary', z: 2 })] : []),
    ],
  };
}

export function statsComp(items: { value: string; label: string }[]): Composition {
  const n = Math.min(4, items.length);
  const span = 12 / n;
  return {
    rows: 3,
    elements: items.slice(0, n).flatMap((it, k) => [
      E('heading', { col: 1 + k * span, span, row: 1, rows: 2, text: it.value, size: 'xl', color: 'primary', align: 'center', level: 3, group: `stat-${k}` }),
      E('text', { col: 1 + k * span, span, row: 3, rows: 1, text: it.label, size: 'sm', align: 'center', group: `stat-${k}` }),
    ]),
  };
}

/** Closing call to action on a colored panel. `fill`/`ink` let light panels (e.g. a yellow block) use dark text. */
export function ctaComp(c: { title: string; text: string; button: string; deco?: Deco; fill?: ColorRef; ink?: ColorRef; radius?: number }): Composition {
  const rows = 8;
  const ink = c.ink ?? 'white';
  return {
    rows,
    elements: [
      E('shape', { col: 1, span: 12, row: 1, rows, shape: 'rect', fill: c.fill ?? 'gradient', radius: c.radius ?? 28, z: 0 }),
      ...decoration(c.deco ?? 'none', rows, 'right').slice(0, 1).map((d) => ({ ...d, z: 1, opacity: 0.35 })),
      E('heading', { col: 2, span: 8, row: 2, rows: 2, text: c.title, size: 'xl', color: ink, z: 2 }),
      E('text', { col: 2, span: 7, row: 4, rows: 2, text: c.text, color: ink, opacity: 0.88, z: 2 }),
      E('button', { col: 2, span: 3, row: 6, text: c.button, href: '#', variant: 'secondary', color: ink, z: 2 }),
    ],
  };
}

export function galleryComp(c: { title: string; captions: string[] }): Composition {
  return {
    rows: 12,
    elements: [
      E('heading', { col: 1, span: 8, row: 1, rows: 2, text: c.title, size: 'xl' }),
      E('image', { col: 1, span: 7, row: 4, rows: 9, alt: c.captions[0] ?? '', radius: 18 }),
      E('image', { col: 8, span: 5, row: 4, rows: 4, alt: c.captions[1] ?? '', radius: 18 }),
      E('image', { col: 8, span: 5, row: 8, rows: 5, alt: c.captions[2] ?? '', radius: 18 }),
    ],
  };
}

export function quoteComp(c: { quote: string; author: string }): Composition {
  return {
    rows: 7,
    elements: [
      E('heading', { col: 1, span: 1, row: 1, rows: 2, text: '“', size: 'display', color: 'primary' }),
      E('heading', { col: 2, span: 10, row: 2, rows: 4, text: c.quote, size: 'lg', italic: true, level: 3 }),
      E('text', { col: 2, span: 6, row: 6, rows: 1, text: c.author, size: 'xs', upper: true, color: 'muted' }),
    ],
  };
}

/**
 * Numbered index (chapters, floors, stops): header on top, then one row per entry
 * (numeral · title · description) separated by rules. Every entry lives on its own
 * grid row, so the phone reading order stays numeral → title → description.
 */
export function listComp(c: { eyebrow?: string; title: string; text?: string; items: { title: string; text: string }[]; numerals?: 'roman' | 'arabic' }): Composition {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const items = c.items.slice(0, 10);
  const top = c.eyebrow ? 2 : 1;
  const start = top + (c.text ? 3 : 2) + 1;
  return {
    rows: start + items.length * 2 - 2,
    elements: [
      ...(c.eyebrow ? [E('text', { col: 1, span: 6, row: 1, rows: 1, text: c.eyebrow, size: 'xs', color: 'primary', upper: true })] : []),
      E('heading', { col: 1, span: 8, row: top, rows: 2, text: c.title, size: 'xl' }),
      ...(c.text ? [E('text', { col: 1, span: 6, row: top + 2, rows: 1, text: c.text, size: 'sm', color: 'muted' })] : []),
      ...items.flatMap((it, k) => {
        const row = start + k * 2;
        return [
          E('heading', { col: 1, span: 1, row, rows: 1, text: c.numerals === 'arabic' ? String(k + 1).padStart(2, '0') : roman[k], size: 'lg', color: 'primary', level: 3 }),
          E('heading', { col: 2, span: 5, row, rows: 1, text: it.title, size: 'lg', level: 3 }),
          E('text', { col: 7, span: 6, row, rows: 1, text: it.text, size: 'sm' }),
          ...(k < items.length - 1 ? [E('divider', { col: 1, span: 12, row: row + 1, rows: 1, color: 'border' })] : []),
        ];
      }),
    ],
  };
}

/** Presets offered in the Canvas "Adicionar seção" list. */
export const SECTION_PRESETS: { id: string; label: string; build: () => Composition }[] = [
  { id: 'blank', label: 'Em branco', build: () => ({ rows: 8, elements: [] }) },
  { id: 'hero', label: 'Abertura', build: () => heroComp({ eyebrow: 'Novo', title: 'Um título que *chama atenção*', text: 'Explique em uma frase o valor do que você oferece.', primary: 'Começar', secondary: 'Saiba mais', image: true, deco: 'orbs' }) },
  { id: 'hero-center', label: 'Abertura centralizada', build: () => heroComp({ eyebrow: 'Lançamento', title: 'Grande ideia, *em destaque*', text: 'Uma frase de apoio curta e direta.', primary: 'Quero ver', center: true, deco: 'orbs' }) },
  { id: 'cards', label: 'Três cards', build: () => cardsComp({ eyebrow: 'Recursos', title: 'Por que escolher a gente', items: [{ icon: 'zap', title: 'Rápido', text: 'Resultado em minutos, não semanas.' }, { icon: 'shield', title: 'Seguro', text: 'Seus dados protegidos de ponta a ponta.' }, { icon: 'heart', title: 'Humano', text: 'Suporte de verdade quando precisar.' }] }) },
  { id: 'split', label: 'Imagem + texto', build: () => splitComp({ eyebrow: 'Sobre', title: 'Uma história *que vale contar*', text: 'Conte de onde você veio e para onde vai.', button: 'Conheça' }) },
  { id: 'stats', label: 'Números', build: () => statsComp([{ value: '12k', label: 'clientes' }, { value: '98%', label: 'satisfação' }, { value: '24/7', label: 'suporte' }, { value: '3x', label: 'mais rápido' }]) },
  { id: 'gallery', label: 'Galeria', build: () => galleryComp({ title: 'Destaques', captions: ['Destaque principal', 'Detalhe', 'Bastidores'] }) },
  { id: 'list', label: 'Lista numerada', build: () => listComp({ eyebrow: 'Sumário', title: 'Capítulos da *história*', items: [{ title: 'O começo', text: 'De onde tudo partiu.' }, { title: 'A virada', text: 'O momento que mudou o rumo.' }, { title: 'O agora', text: 'Onde estamos e para onde vamos.' }] }) },
  { id: 'quote', label: 'Citação', build: () => quoteComp({ quote: 'Uma frase marcante de um cliente ou da marca.', author: 'Nome — Cargo' }) },
  { id: 'cta', label: 'Chamada final', build: () => ctaComp({ title: 'Pronto para começar?', text: 'Uma última frase para convencer.', button: 'Falar com a gente' }) },
];

/** Single elements offered in the Canvas "Elementos" panel. */
export const TEXT_PRESETS: { label: string; sample: string; make: () => CanvasEl }[] = [
  { label: 'Adicionar título', sample: 'display', make: () => E('heading', { span: 8, rows: 3, size: 'display', text: 'Título em destaque' }) },
  { label: 'Adicionar subtítulo', sample: 'xl', make: () => E('heading', { span: 7, rows: 2, size: 'xl', text: 'Subtítulo da seção' }) },
  { label: 'Adicionar título pequeno', sample: 'lg', make: () => E('heading', { span: 5, rows: 1, size: 'lg', text: 'Título pequeno', level: 3 }) },
  { label: 'Adicionar texto', sample: 'md', make: () => E('text', { span: 6, rows: 2, size: 'md', text: 'Escreva um parágrafo curto, direto e útil para quem lê.' }) },
  { label: 'Adicionar legenda', sample: 'xs', make: () => E('text', { span: 4, rows: 1, size: 'xs', upper: true, color: 'primary', text: 'Sobretítulo' }) },
];
