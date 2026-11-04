import type { Page, Project, Props, PropValue, Section, TargetStack } from './types';
import { SECTION_MAP } from './sections';
import { contrastRatio, tonalScale, wcagLevel } from './color';
import { anchorId } from './render/SiteSection';

export interface PromptOptions {
  detail: 'concise' | 'standard' | 'exhaustive';
  includeContent: boolean;
  includeTokens: boolean;
  includeJsonSpec: boolean;
  includeAcceptance: boolean;
  includePlan: boolean;
  promptLanguage: 'pt-BR' | 'en';
}

export const DEFAULT_PROMPT_OPTIONS: PromptOptions = {
  detail: 'standard',
  includeContent: true,
  includeTokens: true,
  includeJsonSpec: false,
  includeAcceptance: true,
  includePlan: true,
  promptLanguage: 'pt-BR',
};

export const STACKS: Record<TargetStack, { label: string; summary: string; structure: string; styling: string }> = {
  'next-tailwind': {
    label: 'Next.js 15 + Tailwind CSS',
    summary: 'Next.js 15 (App Router, React Server Components), TypeScript strict, Tailwind CSS v4, Framer Motion para animações, lucide-react para ícones, next/font para fontes e next/image para imagens.',
    structure: `app/\n  layout.tsx          # fontes, metadata, <html lang>\n  page.tsx            # composição das seções\n  globals.css         # tokens (@theme) + base\ncomponents/\n  sections/           # um arquivo por seção\n  ui/                 # Button, Card, Container, Badge, Input\nlib/\n  content.ts          # todo o conteúdo textual tipado\n  utils.ts`,
    styling: 'Declare os tokens em `@theme` no globals.css (Tailwind v4) e use classes utilitárias. Nenhuma cor hardcoded fora dos tokens.',
  },
  'react-vite': {
    label: 'React 19 + Vite + Tailwind CSS',
    summary: 'React 19 + Vite, TypeScript strict, Tailwind CSS v4, Framer Motion, lucide-react e react-router (se houver múltiplas páginas).',
    structure: `src/\n  main.tsx\n  App.tsx\n  index.css           # tokens + base\n  sections/           # um componente por seção\n  components/ui/      # primitives reutilizáveis\n  content/site.ts     # conteúdo tipado`,
    styling: 'Tokens em CSS custom properties expostos ao Tailwind via `@theme`. Componentes pequenos e compostos.',
  },
  astro: {
    label: 'Astro 5 + Tailwind CSS',
    summary: 'Astro 5 (output estático), TypeScript, Tailwind CSS v4, ilhas React apenas onde houver interatividade, astro:assets para imagens.',
    structure: `src/\n  layouts/Base.astro\n  pages/index.astro\n  components/sections/*.astro\n  components/islands/*.tsx\n  styles/global.css\n  content/site.ts`,
    styling: 'Zero JS por padrão. Tokens em `@theme`. Hidrate apenas componentes interativos (FAQ, formulários, menu mobile).',
  },
  nuxt: {
    label: 'Nuxt 3 + Tailwind CSS',
    summary: 'Nuxt 3, Vue 3 <script setup> + TypeScript, Tailwind CSS, @nuxt/image, @nuxtjs/google-fonts, @vueuse/motion.',
    structure: `app.vue\npages/index.vue\ncomponents/sections/*.vue\ncomponents/ui/*.vue\nassets/css/main.css\ncontent/site.ts`,
    styling: 'Tokens como CSS variables mapeadas no tailwind.config. Componentes SFC enxutos.',
  },
  sveltekit: {
    label: 'SvelteKit + Tailwind CSS',
    summary: 'SvelteKit 2 (Svelte 5 runes), TypeScript, Tailwind CSS v4, adapter-static, transições nativas do Svelte.',
    structure: `src/\n  routes/+layout.svelte\n  routes/+page.svelte\n  lib/sections/*.svelte\n  lib/ui/*.svelte\n  lib/content.ts\n  app.css`,
    styling: 'Tokens em `@theme`. Use actions do Svelte para animações on-scroll.',
  },
  html: {
    label: 'HTML + CSS + JavaScript (vanilla)',
    summary: 'HTML5 semântico, CSS moderno (custom properties, grid, container queries, clamp), JavaScript vanilla ES2022 sem dependências.',
    structure: `index.html\nassets/\n  css/tokens.css\n  css/main.css\n  js/main.js          # menu mobile, reveal on scroll, formulários\n  img/`,
    styling: 'Metodologia BEM ou classes utilitárias próprias. Tokens em `:root`.',
  },
};

const L = (o: PromptOptions, pt: string, en: string) => (o.promptLanguage === 'en' ? en : pt);

function fmtValue(v: PropValue, indent = ''): string {
  if (Array.isArray(v)) {
    return v.map((x, i) => (typeof x === 'object' && x !== null
      ? `${indent}${i + 1}. ${Object.entries(x as Props).filter(([, vv]) => vv !== '' && vv !== false).map(([k, vv]) => `**${k}**: ${String(vv).replace(/\n/g, ' · ')}`).join(' — ')}`
      : `${indent}- ${String(x)}`)).join('\n');
  }
  return String(v).replace(/\n/g, ' · ');
}

function sectionContent(s: Section): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(s.props)) {
    if (v === '' || v === false || v === undefined) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      lines.push(`- \`${k}\`:\n${fmtValue(v, '   ')}`);
    } else lines.push(`- \`${k}\`: ${fmtValue(v)}`);
  }
  return lines.join('\n');
}

const bgLabel: Record<string, string> = {
  default: 'cor de fundo padrão (--color-background)',
  surface: 'superfície (--color-surface)',
  primary: 'cor primária sólida',
  gradient: 'gradiente primário → secundário (135deg)',
  dark: 'fundo escuro de alto contraste',
  image: 'imagem de fundo com overlay escuro',
  mesh: 'mesh gradient sutil (radiais de primary/secondary/accent sobre o fundo)',
};
const padLabel: Record<string, string> = { none: '0', sm: '~40px', md: '~72px', lg: '~112px', xl: '~160px' };

function sectionSpec(s: Section, idx: number, o: PromptOptions): string {
  const def = SECTION_MAP[s.type];
  const variant = def.variants.find((v) => v.id === s.variant)?.label ?? s.variant;
  const st = s.style;
  const parts = [
    `#### ${idx + 1}. ${s.name || def.label} — \`<${def.label.replace(/\s/g, '')} />\` · id \`#${anchorId(s)}\``,
    `- **${L(o, 'Objetivo', 'Purpose')}:** ${def.intent}`,
    `- **${L(o, 'Layout', 'Layout')}:** ${variant}${s.type === 'features' && s.props.columns ? ` · ${s.props.columns} ${L(o, 'colunas', 'columns')}` : ''} · ${L(o, 'alinhamento', 'alignment')} ${st.align} · ${L(o, 'largura', 'width')} ${st.maxWidth}`,
    `- **${L(o, 'Fundo', 'Background')}:** ${bgLabel[st.background]}${st.backgroundImage ? ` (\`${st.backgroundImage}\`)` : ''}`,
    `- **${L(o, 'Espaçamento vertical', 'Vertical padding')}:** ${padLabel[st.paddingY]}${st.divider ? ` · ${L(o, 'borda superior divisória', 'top divider')}` : ''}`,
    `- **${L(o, 'Animação de entrada', 'Entrance animation')}:** ${st.animation === 'none' ? L(o, 'nenhuma', 'none') : `${st.animation} (on-scroll, uma vez, respeitar prefers-reduced-motion)`}`,
  ];
  if (o.includeContent) {
    const c = sectionContent(s);
    if (c) parts.push(`- **${L(o, 'Conteúdo (use exatamente estes textos)', 'Content (use this copy verbatim)')}:**\n${c.split('\n').map((l) => '  ' + l).join('\n')}`);
  }
  if (s.notes?.trim()) parts.push(`- **${L(o, 'Instruções específicas', 'Specific instructions')}:** ${s.notes.trim()}`);
  return parts.join('\n');
}

function pageSpec(pg: Page, o: PromptOptions): string {
  const visible = pg.sections.filter((s) => !s.hidden);
  return [
    `### ${L(o, 'Página', 'Page')}: ${pg.name} (\`${pg.slug}\`)`,
    `- **SEO title:** ${pg.seoTitle || pg.name}`,
    pg.seoDescription ? `- **Meta description:** ${pg.seoDescription}` : '',
    `- **${L(o, 'Ordem das seções', 'Section order')}:** ${visible.map((s) => s.name || SECTION_MAP[s.type].label).join(' → ')}`,
    '',
    visible.map((s, i) => sectionSpec(s, i, o)).join('\n\n'),
  ].filter((x) => x !== '').join('\n');
}

export function tokensBlock(p: Project): string {
  const t = p.theme;
  const pal = t.palette;
  const scale = tonalScale(pal.primary);
  return [
    '```css',
    ':root {',
    `  /* ${t.mode === 'dark' ? 'Dark' : 'Light'} theme */`,
    ...Object.entries(pal).map(([k, v]) => `  --color-${k}: ${v};`),
    ...Object.entries(scale).map(([k, v]) => `  --color-primary-${k}: ${v};`),
    `  --font-heading: "${t.fontHeading}", serif;`,
    `  --font-body: "${t.fontBody}", sans-serif;`,
    `  --text-base: ${t.baseSize}px;   /* modular scale ratio ${t.scale} */`,
    ...[['sm', -1], ['lg', 1], ['xl', 2], ['2xl', 3], ['3xl', 4], ['4xl', 5]].map(([k, e]) => `  --text-${k}: ${(t.baseSize * t.scale ** (e as number)).toFixed(1)}px;`),
    `  --radius: ${t.radius}px;`,
    `  --radius-sm: ${Math.round(t.radius * 0.6)}px;`,
    `  --radius-lg: ${Math.round(t.radius * 1.5)}px;`,
    `  --shadow-style: ${t.shadow};`,
    '}',
    '```',
  ].join('\n');
}

function contrastReport(p: Project, o: PromptOptions): string {
  const pal = p.theme.palette;
  const pairs: [string, string, string][] = [
    ['text / background', pal.text, pal.background],
    ['muted / background', pal.muted, pal.background],
    ['text / surface', pal.text, pal.surface],
    ['primary / background', pal.primary, pal.background],
  ];
  const rows = pairs.map(([n, a, b]) => {
    const r = contrastRatio(a, b);
    return `| ${n} | ${r.toFixed(2)}:1 | ${wcagLevel(r)} |`;
  });
  const fails = pairs.filter(([, a, b]) => contrastRatio(a, b) < 4.5).map(([n]) => n);
  return [
    `| ${L(o, 'Par', 'Pair')} | ${L(o, 'Contraste', 'Contrast')} | WCAG |`, '|---|---|---|', ...rows,
    fails.length ? `\n> ⚠️ ${L(o, 'Ajuste levemente a luminosidade para atingir AA (4.5:1) em texto corrido nos pares', 'Adjust lightness to reach AA (4.5:1) for body text in')}: ${fails.join(', ')}.` : '',
  ].join('\n');
}

export function generatePrompt(p: Project, o: PromptOptions = DEFAULT_PROMPT_OPTIONS): string {
  const b = p.brief;
  const t = p.theme;
  const stack = STACKS[b.stack];
  const exhaustive = o.detail === 'exhaustive';
  const concise = o.detail === 'concise';
  const out: string[] = [];

  out.push(`# ${L(o, 'Projeto', 'Project')}: ${b.projectName}${b.tagline ? ` — ${b.tagline}` : ''}`);
  out.push(L(o,
    `Você é um engenheiro front-end sênior e designer de produto de nível mundial. Construa o site descrito abaixo com qualidade de produção, visual premium e código limpo. Siga a especificação com fidelidade — ela foi desenhada visualmente no Frameworks Studio. Quando algo não estiver especificado, tome decisões coerentes com o design system e o tom da marca.`,
    `You are a world-class senior front-end engineer and product designer. Build the website described below with production quality, a premium look and clean code. Follow this spec faithfully — it was visually designed in Frameworks Studio. When something is unspecified, make decisions consistent with the design system and brand tone.`));

  out.push(`## 1. ${L(o, 'Contexto do produto', 'Product context')}`);
  out.push([
    `- **${L(o, 'Objetivo principal', 'Primary goal')}:** ${b.goal}`,
    `- **${L(o, 'Público-alvo', 'Target audience')}:** ${b.audience}`,
    `- **${L(o, 'Segmento', 'Industry')}:** ${b.industry}`,
    `- **${L(o, 'Tom de voz', 'Tone of voice')}:** ${b.tone.join(', ')}`,
    `- **${L(o, 'Idioma do site', 'Site language')}:** ${b.language}`,
    b.references ? `- **${L(o, 'Referências', 'References')}:** ${b.references}` : '',
  ].filter(Boolean).join('\n'));

  out.push(`## 2. ${L(o, 'Stack técnica', 'Tech stack')}`);
  out.push(`**${stack.label}** — ${stack.summary}`);
  if (!concise) out.push(`${L(o, 'Estrutura de pastas sugerida', 'Suggested structure')}:\n\`\`\`\n${stack.structure}\n\`\`\`\n${stack.styling}`);

  out.push(`## 3. Design system`);
  out.push([
    `- **${L(o, 'Modo', 'Mode')}:** ${t.mode === 'dark' ? L(o, 'escuro', 'dark') : L(o, 'claro', 'light')}`,
    `- **${L(o, 'Tipografia', 'Typography')}:** ${L(o, 'títulos em', 'headings in')} **${t.fontHeading}**, ${L(o, 'corpo em', 'body in')} **${t.fontBody}** (Google Fonts). ${L(o, 'Escala modular', 'Modular scale')} ${t.scale}, base ${t.baseSize}px. ${L(o, 'Títulos com tracking negativo e line-height 1.05–1.1; tamanhos fluidos com clamp().', 'Headings with negative tracking and 1.05–1.1 line-height; fluid sizes with clamp().')}`,
    `- **${L(o, 'Destaque em títulos', 'Heading emphasis')}:** ${L(o, 'trechos marcados com *asteriscos* no conteúdo devem ser renderizados como <em> com gradiente de texto primary → accent', 'text wrapped in *asterisks* must render as <em> with a primary → accent text gradient')}.`,
    `- **${L(o, 'Cantos', 'Corners')}:** radius ${t.radius}px · **${L(o, 'Sombras', 'Shadows')}:** ${t.shadow} · **${L(o, 'Botões', 'Buttons')}:** ${t.buttonStyle} · **${L(o, 'Densidade', 'Density')}:** ${t.density}`,
  ].join('\n'));
  if (o.includeTokens) {
    out.push(`### ${L(o, 'Tokens', 'Tokens')}\n${tokensBlock(p)}`);
    if (!concise) out.push(`### ${L(o, 'Acessibilidade de cor', 'Color accessibility')}\n${contrastReport(p, o)}`);
  }

  out.push(`## 4. ${L(o, 'Arquitetura de páginas e seções', 'Pages & sections')}`);
  if (p.pages.length > 1) out.push(`${L(o, 'O site possui', 'The site has')} ${p.pages.length} ${L(o, 'páginas', 'pages')}: ${p.pages.map((pg) => `${pg.name} (\`${pg.slug}\`)`).join(', ')}. ${L(o, 'Navbar e rodapé devem ser componentes compartilhados no layout.', 'Navbar and footer must be shared layout components.')}`);
  out.push(p.pages.map((pg) => pageSpec(pg, o)).join('\n\n'));

  out.push(`## 5. ${L(o, 'Requisitos funcionais', 'Functional requirements')}`);
  const req = [
    ...b.features.map((f) => `- ${f}`),
    `- ${L(o, 'Menu mobile acessível (hamburger) com foco preso e fechamento por Esc', 'Accessible mobile menu (hamburger) with focus trap and Esc to close')}`,
    `- ${L(o, 'Links da navbar com scroll suave para as âncoras das seções', 'Navbar links smooth-scroll to section anchors')}`,
  ];
  out.push(req.join('\n'));

  out.push(`## 6. ${L(o, 'Qualidade e padrões', 'Quality standards')}`);
  const q = [
    `- **${L(o, 'Responsivo', 'Responsive')}:** mobile-first; breakpoints 480 / 768 / 1024 / 1280px. ${L(o, 'Grids colapsam para 1 coluna abaixo de 768px.', 'Grids collapse to 1 column below 768px.')}`,
    `- **${L(o, 'Acessibilidade', 'Accessibility')}:** WCAG 2.2 AA, HTML semântico (header/nav/main/section/footer), ${L(o, 'foco visível, alt em imagens, labels em inputs, navegação por teclado', 'visible focus, image alt, input labels, keyboard navigation')}.`,
    `- **Performance:** Lighthouse ≥ 95 ${L(o, 'em todas as categorias', 'in all categories')}; LCP < 2.5s, CLS < 0.1; ${L(o, 'imagens otimizadas (AVIF/WebP, lazy), fontes com display=swap e preload das críticas', 'optimized images (AVIF/WebP, lazy), font-display swap and preload critical fonts')}.`,
    `- **SEO:** metadata por página, Open Graph/Twitter cards, sitemap.xml, robots.txt, JSON-LD (Organization${p.pages.some((pg) => pg.sections.some((s) => s.type === 'faq')) ? ' + FAQPage' : ''}).`,
    `- **${L(o, 'Animações', 'Motion')}:** ${L(o, 'sutis e elegantes (200–800ms, ease-out), disparadas on-scroll uma única vez; respeite prefers-reduced-motion', 'subtle and elegant (200–800ms, ease-out), triggered once on scroll; respect prefers-reduced-motion')}.`,
    `- **${L(o, 'Código', 'Code')}:** TypeScript strict, ${L(o, 'componentes pequenos e reutilizáveis, conteúdo separado da apresentação, sem cores/medidas mágicas fora dos tokens, ESLint + Prettier', 'small reusable components, content separated from presentation, no magic colors/sizes outside tokens, ESLint + Prettier')}.`,
  ];
  if (exhaustive) q.push(
    `- **${L(o, 'Estados', 'States')}:** hover, focus-visible, active, disabled ${L(o, 'e loading em todos os elementos interativos; estados de sucesso/erro em formulários', 'and loading on every interactive element; success/error states for forms')}.`,
    `- **${L(o, 'Microinterações', 'Micro-interactions')}:** ${L(o, 'botões com leve elevação no hover, cards com translateY(-3px), contadores animados nas métricas', 'buttons lift on hover, cards translateY(-3px), animated counters for stats')}.`,
    `- **${L(o, 'Dark mode', 'Dark mode')}:** ${L(o, 'se aplicável, derive a paleta alternativa a partir dos mesmos tokens e persista a escolha', 'if applicable, derive the alternate palette from the same tokens and persist the choice')}.`,
  );
  out.push(q.join('\n'));

  if (b.extraInstructions.trim()) out.push(`## 7. ${L(o, 'Instruções adicionais', 'Additional instructions')}\n${b.extraInstructions.trim()}`);

  if (o.includePlan) {
    out.push(`## ${L(o, 'Plano de execução', 'Execution plan')}`);
    out.push([
      `1. ${L(o, 'Inicialize o projeto com a stack definida e configure TypeScript, lint e formatação.', 'Scaffold the project with the defined stack and configure TypeScript, lint and formatting.')}`,
      `2. ${L(o, 'Implemente os tokens do design system e os primitives de UI (Button, Container, Card, Badge, Input).', 'Implement the design tokens and UI primitives (Button, Container, Card, Badge, Input).')}`,
      `3. ${L(o, 'Centralize todo o conteúdo em um arquivo tipado.', 'Centralize all content in a typed file.')}`,
      `4. ${L(o, 'Construa cada seção na ordem especificada, fiel ao layout e ao conteúdo.', 'Build each section in the specified order, faithful to layout and content.')}`,
      `5. ${L(o, 'Adicione responsividade, animações, acessibilidade e SEO.', 'Add responsiveness, motion, accessibility and SEO.')}`,
      `6. ${L(o, 'Rode build, lint e typecheck sem erros; revise visualmente em 375px, 768px e 1440px.', 'Run build, lint and typecheck with zero errors; review visually at 375px, 768px and 1440px.')}`,
    ].join('\n'));
  }

  if (o.includeAcceptance) {
    out.push(`## ${L(o, 'Critérios de aceite', 'Acceptance criteria')}`);
    out.push([
      `- [ ] ${L(o, 'Todas as seções presentes, na ordem e com o conteúdo especificado', 'All sections present, in order, with specified content')}`,
      `- [ ] ${L(o, 'Tokens aplicados de forma consistente (nenhuma cor fora da paleta)', 'Tokens applied consistently (no off-palette colors)')}`,
      `- [ ] ${L(o, 'Layout perfeito em mobile, tablet e desktop sem scroll horizontal', 'Pixel-perfect on mobile, tablet and desktop with no horizontal scroll')}`,
      `- [ ] ${L(o, 'Navegação por teclado completa e contraste AA', 'Full keyboard navigation and AA contrast')}`,
      `- [ ] Lighthouse ≥ 95 (Performance, Accessibility, Best Practices, SEO)`,
      `- [ ] \`build\`, \`lint\` ${L(o, 'e', 'and')} \`typecheck\` ${L(o, 'passam sem erros nem warnings', 'pass with no errors or warnings')}`,
    ].join('\n'));
  }

  if (o.includeJsonSpec) {
    out.push(`## ${L(o, 'Especificação JSON (fonte de verdade)', 'JSON spec (source of truth)')}`);
    const spec = { brief: p.brief, theme: p.theme, pages: p.pages.map((pg) => ({ ...pg, sections: pg.sections.filter((s) => !s.hidden).map(({ id: _id, locked: _l, hidden: _h, ...rest }) => rest) })) };
    out.push('```json\n' + JSON.stringify(spec, null, 2) + '\n```');
  }

  out.push(L(o,
    `---\nComece agora. Ao final, apresente um resumo do que foi construído, como rodar localmente e possíveis próximos passos.`,
    `---\nStart now. When done, summarize what was built, how to run it locally and suggested next steps.`));

  return out.join('\n\n') + '\n';
}

/** Rough token estimate (~4 chars/token for mixed PT/EN markdown). */
export const estimateTokens = (s: string) => Math.ceil(s.length / 3.8);
