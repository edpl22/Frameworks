import type { Theme } from './types';
import { alpha, contrastRatio, readableOn, shift, tonalScale } from './color';

/**
 * Generates the stylesheet for a rendered site from the theme tokens.
 * The exact same CSS powers the live canvas and the exported HTML.
 * Responsiveness uses container queries (`@container`) so the canvas
 * device preview behaves exactly like a real viewport.
 */
export function cssVariables(t: Theme): Record<string, string> {
  const p = t.palette;
  const shadows: Record<Theme['shadow'], [string, string]> = {
    none: ['none', 'none'],
    soft: [`0 1px 2px ${alpha('#000', 0.04)}, 0 4px 16px ${alpha('#000', 0.06)}`, `0 12px 40px ${alpha('#000', 0.1)}`],
    medium: [`0 2px 6px ${alpha('#000', 0.08)}, 0 10px 30px ${alpha('#000', 0.12)}`, `0 24px 60px ${alpha('#000', 0.18)}`],
    dramatic: [`0 4px 14px ${alpha('#000', 0.18)}, 0 20px 50px ${alpha(p.primary, 0.18)}`, `0 40px 100px ${alpha(p.primary, 0.3)}`],
    hard: [`4px 4px 0 ${p.text}`, `8px 8px 0 ${p.text}`],
  };
  const density = { compact: 0.75, comfortable: 1, spacious: 1.3 }[t.density];
  const scale = tonalScale(p.primary);
  return {
    '--fw-primary': p.primary,
    '--fw-primary-hover': shift(p.primary, t.mode === 'dark' ? 6 : -6),
    '--fw-primary-fg': readableOn(p.primary),
    // Primary used as text: falls back to the text color when contrast is too low (e.g. yellow on cream).
    '--fw-primary-ink': contrastRatio(p.primary, p.background) >= 3 ? p.primary : p.text,
    '--fw-primary-soft': alpha(p.primary, t.mode === 'dark' ? 0.16 : 0.1),
    '--fw-secondary': p.secondary,
    '--fw-secondary-fg': readableOn(p.secondary),
    '--fw-accent': p.accent,
    '--fw-bg': p.background,
    '--fw-surface': p.surface,
    '--fw-text': p.text,
    '--fw-muted': p.muted,
    '--fw-border': p.border,
    '--fw-dark': t.mode === 'dark' ? shift(p.background, -2) : scale['950'],
    '--fw-dark-fg': '#ffffff',
    '--fw-font-heading': `'${t.fontHeading}', ui-serif, Georgia, system-ui, sans-serif`,
    '--fw-font-body': `'${t.fontBody}', ui-sans-serif, system-ui, -apple-system, sans-serif`,
    '--fw-font-mono': `'JetBrains Mono', 'Share Tech Mono', ui-monospace, SFMono-Regular, Menlo, monospace`,
    '--fw-base': `${t.baseSize}px`,
    '--fw-scale': String(t.scale),
    '--fw-radius': `${t.radius}px`,
    '--fw-radius-sm': `${Math.round(t.radius * 0.6)}px`,
    '--fw-radius-lg': `${Math.round(t.radius * 1.5)}px`,
    '--fw-shadow': shadows[t.shadow][0],
    '--fw-shadow-lg': shadows[t.shadow][1],
    '--fw-density': String(density),
  };
}

/** Splits a selector list on top-level commas (ignores commas inside :where(…)). */
function splitSelectors(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

/**
 * Scopes every rule under `root` so several themes can coexist on one page
 * (template gallery thumbnails, landing demo) without leaking into each other.
 * Selectors that mention `.fw-site` get it replaced by `root`; all others are
 * prefixed with it. @media/@container/@supports are recursed, @keyframes kept.
 */
export function scopeCss(css: string, root: string): string {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const walk = (str: string): string => {
    let out = '';
    let i = 0;
    while (i < str.length) {
      const open = str.indexOf('{', i);
      if (open < 0) break;
      const prelude = str.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < str.length && depth > 0) {
        if (str[j] === '{') depth++;
        else if (str[j] === '}') depth--;
        j++;
      }
      const body = str.slice(open + 1, j - 1);
      if (/^@keyframes/.test(prelude)) out += `${prelude}{${body}}\n`;
      else if (/^@(media|container|supports)/.test(prelude)) out += `${prelude}{\n${walk(body)}}\n`;
      else if (prelude) {
        const sel = splitSelectors(prelude).map((x) => (x.includes('.fw-site') ? x.split('.fw-site').join(root) : `${root} ${x}`)).join(',');
        out += `${sel}{${body.trim()}}\n`;
      }
      i = j;
    }
    return out;
  };
  return walk(src);
}

export function generateSiteCSS(t: Theme, scope = '.fw-site'): string {
  return scopeCss(rawSiteCSS(t), scope);
}

function rawSiteCSS(t: Theme): string {
  const vars = Object.entries(cssVariables(t)).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  const s = t.scale;
  const b = t.baseSize;
  // Display sizes are clamped so every type scale still yields a confident hero.
  const h1 = +Math.min(104, Math.max(64, b * s ** 6.5)).toFixed(1);
  const h2 = +Math.min(64, Math.max(40, b * s ** 4.5)).toFixed(1);
  const h3 = +(b * s ** 1.5).toFixed(1);
  const serifHeading = /Serif|Playfair|Fraunces|Cormorant|Lora|Gloock|Cinzel/.test(t.fontHeading);
  // Display faces that ship one weight must not be faux-bolded.
  const singleWeight = /Archivo Black|Bebas Neue|Gloock|Young Serif|Instrument Serif|DM Serif Display|Press Start 2P|Share Tech Mono|Righteous|Marcellus/.test(t.fontHeading);
  const condensed = /Bebas Neue|Oswald/.test(t.fontHeading);
  const hWeight = singleWeight ? 400 : serifHeading ? 500 : 700;
  const h1Track = condensed ? '0.005em' : serifHeading ? '-0.01em' : '-0.035em';
  const h2Track = condensed ? '0.01em' : serifHeading ? '-0.005em' : '-0.025em';
  const hLine = condensed ? 0.92 : 1.04;

  const btn: Record<Theme['buttonStyle'], string> = {
    solid: `.fw-btn{border-radius:var(--fw-radius-sm)}`,
    pill: `.fw-btn{border-radius:999px}`,
    outline: `.fw-btn{border-radius:var(--fw-radius-sm)}.fw-btn-primary{background:transparent;color:var(--fw-text);border-color:var(--fw-text)}.fw-btn-primary:hover{background:var(--fw-text);color:var(--fw-bg)}`,
    glass: `.fw-btn{border-radius:999px;backdrop-filter:blur(12px)}.fw-btn-primary{background:linear-gradient(135deg,var(--fw-primary),var(--fw-secondary));box-shadow:0 8px 30px -8px var(--fw-primary)}.fw-btn-secondary{background:${alpha('#ffffff', t.mode === 'dark' ? 0.06 : 0.5)}}`,
  };

  return `
.fw-site{
${vars}
  container-type:inline-size;container-name:site;
  background:var(--fw-bg);color:var(--fw-text);font-family:var(--fw-font-body);
  font-size:var(--fw-base);line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
/* Resets use :where() (zero specificity) so component classes always win. */
:where(.fw-site) *,:where(.fw-site) *::before,:where(.fw-site) *::after{box-sizing:border-box}
:where(.fw-site) :where(img){max-width:100%;display:block}
:where(.fw-site) :where(a){color:inherit;text-decoration:none}
:where(.fw-site) :where(h1,h2,h3,h4,p,blockquote,figure){margin:0}
:where(.fw-site) :where(ul){margin:0;padding:0;list-style:none}

/* ── Layout ───────────────────────────── */
.fw-section{position:relative;overflow:hidden}
.fw-container{width:100%;margin:0 auto;padding:0 clamp(20px,5cqi,48px);position:relative;z-index:1}
.fw-w-narrow{max-width:820px}.fw-w-default{max-width:1200px}.fw-w-wide{max-width:1440px}.fw-w-full{max-width:none}
.fw-py-none{padding:0}
.fw-py-sm{padding:calc(40px*var(--fw-density)) 0}
.fw-py-md{padding:calc(72px*var(--fw-density)) 0}
.fw-py-lg{padding:calc(112px*var(--fw-density)) 0}
.fw-py-xl{padding:calc(160px*var(--fw-density)) 0}
.fw-divider{border-top:1px solid var(--fw-border)}
.fw-align-center{text-align:center}.fw-align-center .fw-head{margin-inline:auto}.fw-align-center .fw-actions{justify-content:center}
.fw-align-right{text-align:right}.fw-align-right .fw-head{margin-left:auto}.fw-align-right .fw-actions{justify-content:flex-end}
.fw-head{max-width:720px;margin-bottom:clamp(36px,5cqi,64px)}
.fw-grid{display:grid;gap:clamp(16px,2.4cqi,28px)}
.fw-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.fw-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.fw-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.fw-split{display:grid;grid-template-columns:1.05fr 1fr;gap:clamp(32px,6cqi,88px);align-items:center}
.fw-split.fw-reverse>:first-child{order:2}

/* ── Backgrounds ──────────────────────── */
.fw-bg-default{background:var(--fw-bg)}
.fw-bg-surface{background:var(--fw-surface)}
.fw-bg-primary{background:var(--fw-primary);color:var(--fw-primary-fg)}
.fw-bg-primary .fw-muted,.fw-bg-primary .fw-lead{color:inherit;opacity:.85}
.fw-bg-dark{background:var(--fw-dark);color:var(--fw-dark-fg)}
.fw-bg-dark .fw-muted,.fw-bg-dark .fw-lead{color:rgba(255,255,255,.7)}
.fw-bg-dark .fw-card{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1)}
.fw-bg-gradient{background:linear-gradient(135deg,var(--fw-primary) 0%,var(--fw-secondary) 100%);color:var(--fw-primary-fg)}
.fw-bg-gradient .fw-muted,.fw-bg-gradient .fw-lead{color:inherit;opacity:.88}
.fw-bg-gradient .fw-card,.fw-bg-primary .fw-card{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2);color:inherit}
.fw-bg-mesh{background:
  radial-gradient(60% 50% at 15% 10%,${alpha(t.palette.primary, 0.35)} 0%,transparent 60%),
  radial-gradient(50% 50% at 85% 20%,${alpha(t.palette.secondary, 0.28)} 0%,transparent 60%),
  radial-gradient(60% 60% at 50% 100%,${alpha(t.palette.accent, 0.2)} 0%,transparent 60%),var(--fw-bg)}
.fw-bg-image{background-size:cover;background-position:center;color:#fff}
.fw-bg-image .fw-muted,.fw-bg-image .fw-lead{color:rgba(255,255,255,.82)}
.fw-overlay{position:absolute;inset:0;background:#000;z-index:0}

/* ── Typography ───────────────────────── */
.fw-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.78em;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--fw-primary-ink);margin-bottom:18px}
.fw-bg-primary .fw-eyebrow,.fw-bg-gradient .fw-eyebrow,.fw-bg-dark .fw-eyebrow,.fw-bg-image .fw-eyebrow{color:inherit;opacity:.85}
.fw-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border:1px solid var(--fw-border);border-radius:999px;font-size:.82em;font-weight:500;background:${alpha(t.palette.surface, 0.6)};backdrop-filter:blur(8px);margin-bottom:26px}
.fw-badge b{background:var(--fw-primary);color:var(--fw-primary-fg);border-radius:999px;padding:2px 10px;font-size:.9em;font-weight:600}
.fw-h1{font-family:var(--fw-font-heading);font-size:clamp(${(h1 * 0.5).toFixed(0)}px,${(h1 / 12).toFixed(2)}cqi,${h1}px);line-height:${hLine};letter-spacing:${h1Track};font-weight:${hWeight}}
.fw-h2{font-family:var(--fw-font-heading);font-size:clamp(${(h2 * 0.6).toFixed(0)}px,${(h2 / 15).toFixed(2)}cqi,${h2}px);line-height:${condensed ? 0.95 : 1.1};letter-spacing:${h2Track};font-weight:${hWeight}}
.fw-h3{font-family:var(--fw-font-heading);font-size:${h3}px;line-height:1.25;font-weight:600;letter-spacing:-0.01em}
.fw-h1 em,.fw-h2 em{font-style:${serifHeading ? 'italic' : 'normal'};background:linear-gradient(120deg,var(--fw-primary),var(--fw-accent));-webkit-background-clip:text;background-clip:text;color:transparent}
.fw-lead{font-size:1.18em;color:var(--fw-muted);margin-top:20px;line-height:1.6;max-width:640px}
.fw-align-center .fw-lead{margin-inline:auto}
.fw-muted{color:var(--fw-muted)}
.fw-small{font-size:.88em}

/* ── Buttons ──────────────────────────── */
.fw-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.fw-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:.85em 1.45em;font-weight:600;font-size:.95em;border:1px solid transparent;cursor:pointer;transition:all .2s ease;font-family:inherit;line-height:1.2;white-space:nowrap}
.fw-btn-primary{background:var(--fw-primary);color:var(--fw-primary-fg);box-shadow:var(--fw-shadow)}
.fw-btn-primary:hover{background:var(--fw-primary-hover);transform:translateY(-1px)}
.fw-btn-secondary{background:transparent;color:inherit;border-color:var(--fw-border)}
.fw-btn-secondary:hover{background:var(--fw-primary-soft)}
.fw-bg-primary .fw-btn-primary,.fw-bg-gradient .fw-btn-primary{background:#fff;color:#0b0b12}
.fw-bg-primary .fw-btn-secondary,.fw-bg-gradient .fw-btn-secondary,.fw-bg-dark .fw-btn-secondary,.fw-bg-image .fw-btn-secondary{border-color:rgba(255,255,255,.35)}
${btn[t.buttonStyle]}
${t.buttonStyle === 'glass' && t.mode === 'dark' ? `.fw-card{background:${alpha('#ffffff', 0.035)}!important;backdrop-filter:blur(18px);border-color:${alpha('#ffffff', 0.09)}}` : ''}
${t.shadow === 'hard' ? `/* Neo-brutalism: thick outlines + hard offset shadows */
.fw-card,.fw-media,.fw-window,.fw-btn,.fw-input,.fw-badge,.fw-cta-card,.fw-icon,.fw-kpi,.fw-chart,.fw-socials a,.fw-burger{border:2px solid var(--fw-text)!important}
.fw-btn{box-shadow:var(--fw-shadow)}
.fw-btn:hover,.fw-card:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--fw-text)}
.fw-btn:active{transform:translate(2px,2px);box-shadow:0 0 0 var(--fw-text)}
.fw-icon{background:var(--fw-primary);color:var(--fw-primary-fg)}
.fw-nav{border-bottom:2px solid var(--fw-text)}
.fw-h1 em,.fw-h2 em{background:var(--fw-primary);color:var(--fw-text);-webkit-background-clip:border-box;background-clip:border-box;padding:0 .12em;font-style:normal;box-shadow:4px 4px 0 var(--fw-text);border:2px solid var(--fw-text)}` : ''}

/* ── Cards & icons ────────────────────── */
.fw-card{background:var(--fw-bg);border:1px solid var(--fw-border);border-radius:var(--fw-radius);padding:clamp(22px,2.6cqi,32px);box-shadow:var(--fw-shadow);transition:transform .25s ease,box-shadow .25s ease}
.fw-bg-surface .fw-card{background:var(--fw-bg)}
.fw-bg-default .fw-card{background:var(--fw-surface)}
.fw-card:hover{transform:translateY(-3px);box-shadow:var(--fw-shadow-lg)}
.fw-icon{width:46px;height:46px;border-radius:var(--fw-radius-sm);display:grid;place-items:center;background:var(--fw-primary-soft);color:var(--fw-primary-ink);margin-bottom:20px}
.fw-icon svg{width:22px;height:22px}
.fw-card .fw-h3{margin-bottom:8px}

/* ── Media placeholders ───────────────── */
.fw-media{position:relative;border-radius:var(--fw-radius-lg);overflow:hidden;aspect-ratio:4/3;background:
  radial-gradient(80% 60% at 20% 20%,${alpha(t.palette.primary, 0.55)},transparent 60%),
  radial-gradient(70% 60% at 80% 80%,${alpha(t.palette.secondary, 0.5)},transparent 60%),
  linear-gradient(135deg,var(--fw-surface),${alpha(t.palette.accent, 0.25)}),var(--fw-surface);
  box-shadow:var(--fw-shadow-lg);border:1px solid var(--fw-border)}
.fw-media img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
.fw-media-grid{position:absolute;inset:0;background-image:linear-gradient(${alpha(t.palette.text, 0.06)} 1px,transparent 1px),linear-gradient(90deg,${alpha(t.palette.text, 0.06)} 1px,transparent 1px);background-size:28px 28px;mask-image:radial-gradient(circle at center,#000 30%,transparent 80%)}

/* App window mockup used by hero/content */
.fw-window{border-radius:var(--fw-radius-lg);border:1px solid var(--fw-border);background:var(--fw-surface);box-shadow:var(--fw-shadow-lg);overflow:hidden;text-align:left}
.fw-window-bar{display:flex;gap:6px;padding:12px 14px;border-bottom:1px solid var(--fw-border)}
.fw-window-bar i{width:10px;height:10px;border-radius:50%;background:var(--fw-border)}
.fw-window-bar i:nth-child(1){background:#ff5f57}.fw-window-bar i:nth-child(2){background:#febc2e}.fw-window-bar i:nth-child(3){background:#28c840}
.fw-window-body{display:grid;grid-template-columns:150px 1fr;min-height:300px}
.fw-window-side{border-right:1px solid var(--fw-border);padding:16px;display:flex;flex-direction:column;gap:10px}
.fw-window-side span{height:9px;border-radius:5px;background:var(--fw-border)}
.fw-window-side span:first-child{background:var(--fw-primary);width:70%}
.fw-window-main{padding:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-content:start}
.fw-kpi{border:1px solid var(--fw-border);border-radius:var(--fw-radius-sm);padding:14px;background:var(--fw-bg)}
.fw-kpi small{display:block;height:7px;width:50%;border-radius:4px;background:var(--fw-border);margin-bottom:10px}
.fw-kpi strong{display:block;font-size:1.25em;font-weight:700;color:var(--fw-text)}
.fw-chart{grid-column:1/-1;height:150px;border:1px solid var(--fw-border);border-radius:var(--fw-radius-sm);background:var(--fw-bg);position:relative;overflow:hidden}
.fw-chart svg{position:absolute;inset:0;width:100%;height:100%}

/* ── Navbar ───────────────────────────── */
.fw-nav{position:sticky;top:0;z-index:20;backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid var(--fw-border);background:${alpha(t.palette.background, 0.78)}}
.fw-nav.fw-bg-dark,.fw-nav.fw-bg-primary,.fw-nav.fw-bg-gradient{border-color:transparent}
.fw-nav-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;height:68px}
.fw-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.08em;letter-spacing:-.02em;font-family:var(--fw-font-heading)}
.fw-logo-mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--fw-primary),var(--fw-secondary));display:grid;place-items:center;color:var(--fw-primary-fg);font-size:.8em}
.fw-nav-links{display:flex;gap:30px;font-size:.92em;font-weight:500}
.fw-nav-links a{opacity:.75;transition:opacity .2s}.fw-nav-links a:hover{opacity:1}
.fw-nav-centered .fw-nav-links{position:absolute;left:50%;transform:translateX(-50%)}
.fw-nav .fw-btn{padding:.6em 1.1em;font-size:.88em}
.fw-burger{display:none;width:38px;height:38px;border:1px solid var(--fw-border);border-radius:10px;place-items:center;background:transparent;color:inherit}

/* ── Hero ─────────────────────────────── */
.fw-hero-visual{margin-top:clamp(48px,7cqi,88px)}
.fw-hero-split .fw-lead{margin-left:0}
.fw-hero-proof{display:flex;align-items:center;gap:14px;margin-top:34px;font-size:.88em}
.fw-align-center .fw-hero-proof{justify-content:center}
.fw-avatars{display:flex}
.fw-avatars span{width:34px;height:34px;border-radius:50%;border:2px solid var(--fw-bg);margin-left:-10px;background:linear-gradient(135deg,var(--fw-primary),var(--fw-accent))}
.fw-avatars span:nth-child(2){background:linear-gradient(135deg,var(--fw-secondary),var(--fw-primary))}
.fw-avatars span:nth-child(3){background:linear-gradient(135deg,var(--fw-accent),var(--fw-secondary))}
.fw-avatars span:first-child{margin-left:0}
.fw-hero-glow{position:absolute;inset:-20% -10% auto;height:120%;background:radial-gradient(50% 50% at 50% 0%,${alpha(t.palette.primary, 0.28)},transparent 70%);pointer-events:none;z-index:0}

/* ── Logos ────────────────────────────── */
.fw-logos{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:clamp(28px,6cqi,72px);opacity:.62}
.fw-logos span{font-family:var(--fw-font-heading);font-weight:700;font-size:1.3em;letter-spacing:-.02em;display:flex;align-items:center;gap:8px}
.fw-logos-label{text-align:center;font-size:.82em;color:var(--fw-muted);margin-bottom:28px;letter-spacing:.04em}

/* ── Features bento ───────────────────── */
.fw-bento{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:minmax(220px,auto);gap:clamp(14px,2cqi,22px)}
.fw-bento .fw-card:nth-child(1){grid-column:span 2;grid-row:span 2;background:linear-gradient(160deg,var(--fw-primary-soft),transparent 60%),var(--fw-surface)}
.fw-bento .fw-card:nth-child(4){grid-column:span 2}
.fw-feature-list{display:grid;grid-template-columns:repeat(2,1fr);gap:28px 48px}
.fw-feature-row{display:flex;gap:18px;align-items:flex-start}
.fw-feature-row .fw-icon{flex:none;margin:0}

/* ── Stats ────────────────────────────── */
.fw-stat-value{font-family:var(--fw-font-heading);font-size:clamp(36px,5cqi,58px);font-weight:700;letter-spacing:-.03em;line-height:1}
.fw-stat-label{margin-top:10px;font-size:.92em}
.fw-stats-bar{border-block:1px solid var(--fw-border)}
.fw-stats-bar>div{padding:28px 8px}
.fw-stats-bar>div+div{border-left:1px solid var(--fw-border)}

/* ── Content ──────────────────────────── */
.fw-checks{display:grid;gap:14px;margin-top:28px}
.fw-checks li{display:flex;gap:12px;align-items:flex-start}
.fw-checks svg{flex:none;width:20px;height:20px;color:var(--fw-primary-ink);margin-top:3px}

/* ── Gallery ──────────────────────────── */
.fw-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.fw-gallery .fw-media{aspect-ratio:1}
.fw-gallery-masonry .fw-media:nth-child(3n+1){aspect-ratio:3/4}
.fw-gallery-masonry{align-items:start}
.fw-caption{position:absolute;left:14px;bottom:14px;z-index:2;background:rgba(0,0,0,.5);color:#fff;padding:6px 12px;border-radius:999px;font-size:.8em;backdrop-filter:blur(8px)}

/* ── Testimonials ─────────────────────── */
.fw-quote{font-size:1.04em;line-height:1.65}
.fw-quote-xl{font-family:var(--fw-font-heading);font-size:clamp(24px,3.4cqi,40px);line-height:1.3;letter-spacing:-.01em;max-width:960px;margin:0 auto}
.fw-person{display:flex;align-items:center;gap:12px;margin-top:22px}
.fw-align-center .fw-person{justify-content:center}
.fw-person-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--fw-primary),var(--fw-accent));flex:none;overflow:hidden;display:grid;place-items:center;color:#fff;font-weight:700}
.fw-person-avatar img{width:100%;height:100%;object-fit:cover}
.fw-person strong{display:block;font-size:.95em}
.fw-stars{color:#f5b301;letter-spacing:2px;margin-bottom:14px}

/* ── Pricing ──────────────────────────── */
.fw-price-card{display:flex;flex-direction:column;text-align:left}
.fw-price-card.fw-featured{border:2px solid var(--fw-primary);box-shadow:var(--fw-shadow-lg);position:relative;transform:scale(1.02)}
.fw-price-tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--fw-primary);color:var(--fw-primary-fg);font-size:.74em;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.fw-price{font-family:var(--fw-font-heading);font-size:2.8em;font-weight:700;letter-spacing:-.03em;margin:18px 0 4px}
.fw-price small{font-size:.36em;font-weight:500;color:var(--fw-muted);letter-spacing:0}
.fw-price-card .fw-checks{margin:24px 0 30px;flex:1}
.fw-price-card .fw-btn{width:100%}

/* ── Team ─────────────────────────────── */
.fw-member .fw-media{aspect-ratio:1;margin-bottom:16px;border-radius:var(--fw-radius)}

/* ── FAQ ──────────────────────────────── */
.fw-faq{max-width:820px;margin:0 auto;text-align:left}
.fw-faq details{border-bottom:1px solid var(--fw-border);padding:22px 0}
.fw-faq summary{cursor:pointer;font-weight:600;font-size:1.08em;list-style:none;display:flex;justify-content:space-between;gap:16px}
.fw-faq summary::-webkit-details-marker{display:none}
.fw-faq summary::after{content:'+';font-size:1.4em;line-height:1;color:var(--fw-primary-ink);transition:transform .2s}
.fw-faq details[open] summary::after{transform:rotate(45deg)}
.fw-faq details p{margin-top:14px;color:var(--fw-muted)}

/* ── CTA ──────────────────────────────── */
.fw-cta-card{border-radius:var(--fw-radius-lg);padding:clamp(40px,7cqi,88px);background:linear-gradient(135deg,var(--fw-primary),var(--fw-secondary));color:var(--fw-primary-fg);position:relative;overflow:hidden;box-shadow:var(--fw-shadow-lg)}
.fw-cta-card .fw-lead{color:inherit;opacity:.88}
.fw-cta-card .fw-btn-primary{background:#fff;color:#0b0b12}
.fw-cta-card .fw-btn-secondary{border-color:rgba(255,255,255,.4)}
.fw-cta-card::after{content:'';position:absolute;width:420px;height:420px;border-radius:50%;right:-120px;top:-160px;background:rgba(255,255,255,.12)}

/* ── Forms ────────────────────────────── */
.fw-form{display:grid;gap:14px}
.fw-input{width:100%;padding:.9em 1em;border:1px solid var(--fw-border);border-radius:var(--fw-radius-sm);background:var(--fw-bg);color:var(--fw-text);font:inherit;font-size:.95em}
.fw-input:focus{outline:2px solid var(--fw-primary);outline-offset:1px}
textarea.fw-input{min-height:130px;resize:vertical}
.fw-inline-form{display:flex;gap:10px;max-width:480px;margin-top:28px}
.fw-align-center .fw-inline-form{margin-inline:auto}
.fw-contact-item{display:flex;gap:14px;align-items:center;margin-top:18px}
.fw-contact-item .fw-icon{margin:0}

/* ── Footer ───────────────────────────── */
.fw-footer-grid{display:grid;grid-template-columns:1.6fr repeat(3,1fr);gap:40px}
.fw-footer-grid h4{font-size:.85em;font-weight:600;margin-bottom:16px;letter-spacing:.02em}
.fw-footer-grid li{margin-bottom:10px;font-size:.92em}
.fw-footer-grid li a{color:var(--fw-muted)}.fw-footer-grid li a:hover{color:var(--fw-text)}
.fw-bg-dark .fw-footer-grid li a{color:rgba(255,255,255,.6)}.fw-bg-dark .fw-footer-grid li a:hover{color:#fff}
.fw-footer-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:56px;padding-top:24px;border-top:1px solid var(--fw-border);font-size:.85em}
.fw-bg-dark .fw-footer-bottom{border-color:rgba(255,255,255,.1)}
.fw-socials{display:flex;gap:10px}
.fw-socials a{width:36px;height:36px;border-radius:50%;border:1px solid var(--fw-border);display:grid;place-items:center}
.fw-socials svg{width:16px;height:16px}

/* ── Free-form section (12-column grid) ── */
.fw-canvas{position:relative;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:clamp(12px,2cqi,24px);text-align:left}
.fw-el{position:relative;min-width:0;min-height:0}
.fw-el-h,.fw-el-p{margin:0}
.fw-el-h{font-family:var(--fw-font-heading);line-height:1.05;letter-spacing:${serifHeading ? '-0.01em' : '-0.03em'};font-weight:${hWeight};text-wrap:balance}
.fw-el-p{line-height:1.6}
.fw-t-display{font-size:clamp(40px,7.2cqi,112px);line-height:.98}
.fw-t-xl{font-size:clamp(32px,4.6cqi,68px)}
.fw-t-lg{font-size:clamp(24px,2.8cqi,40px);line-height:1.15}
.fw-t-md{font-size:1.12em}
.fw-t-sm{font-size:.95em}
.fw-t-xs{font-size:.78em;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
.fw-el-h em{font-style:${serifHeading ? 'italic' : 'normal'};background:linear-gradient(120deg,var(--fw-primary),var(--fw-accent));-webkit-background-clip:text;background-clip:text;color:transparent}
.fw-el-button{align-self:start}
.fw-el-button .fw-btn{width:100%}
.fw-el-badge{align-self:start;display:inline-flex;align-items:center;justify-content:center;padding:.45em 1em;border-radius:999px;font-size:.8em;font-weight:600;letter-spacing:.04em;width:max-content;max-width:100%}
.fw-el-image .fw-media{aspect-ratio:auto;height:100%;border-radius:var(--fw-el-radius,16px)}
.fw-el-icon{display:grid;place-items:center}
.fw-el-icon-glyph{display:grid;place-items:center;width:100%;height:100%}
.fw-el-icon-glyph svg{width:min(100%,calc(var(--fw-rs,1) * var(--fw-rh,40px)));height:auto;aspect-ratio:1}
.fw-el-divider{height:1px;align-self:center}
.fw-shape-line{height:2px}
.fw-shape-circle,.fw-shape-ring{width:min(100%,calc(var(--fw-rs,1) * var(--fw-rh,40px)));aspect-ratio:1;place-self:center}
.fw-shape-dot{width:6px;height:6px;place-self:center}

/* ── Animations ───────────────────────── */
@keyframes fw-fade{from{opacity:0}to{opacity:1}}
@keyframes fw-slide-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes fw-zoom{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
@keyframes fw-blur{from{opacity:0;filter:blur(12px)}to{opacity:1;filter:none}}
.fw-site.fw-js [data-anim]:not(.fw-in){opacity:0}
.fw-in[data-anim="fade"]{animation:fw-fade .9s ease both}
.fw-in[data-anim="slide-up"]{animation:fw-slide-up .8s cubic-bezier(.2,.7,.2,1) both}
.fw-in[data-anim="zoom"]{animation:fw-zoom .8s cubic-bezier(.2,.7,.2,1) both}
.fw-in[data-anim="blur"]{animation:fw-blur .9s ease both}
@media (prefers-reduced-motion:reduce){.fw-site [data-anim]{animation:none!important;opacity:1!important}}

/* ── Responsive (container queries) ───── */
@container site (max-width: 1024px){
  .fw-cols-4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .fw-footer-grid{grid-template-columns:1fr 1fr 1fr}
  .fw-footer-grid>:first-child{grid-column:1/-1}
  .fw-bento{grid-template-columns:repeat(2,1fr)}
  .fw-bento .fw-card:nth-child(1){grid-row:span 1}
}
@container site (max-width: 768px){
  .fw-canvas{grid-template-columns:1fr;grid-template-rows:none!important;row-gap:16px}
  .fw-el{grid-column:1!important;grid-row:var(--fw-mr,auto)!important;margin:var(--fw-mt,0) var(--fw-mx,0) var(--fw-mb,0)}
  .fw-el-mhide{display:none}
  .fw-el-image,.fw-el-shape{min-height:var(--fw-mmin,calc(var(--fw-rs,4) * var(--fw-rh,40px) * .7))}
  .fw-el-button,.fw-el-badge{justify-self:start}
  .fw-el-icon{place-items:center start}
  .fw-cols-2,.fw-cols-3,.fw-split,.fw-feature-list,.fw-bento{grid-template-columns:1fr}
  .fw-bento .fw-card{grid-column:auto!important}
  .fw-split.fw-reverse>:first-child{order:0}
  .fw-nav-links,.fw-nav-cta{display:none}
  .fw-burger{display:grid}
  .fw-gallery{grid-template-columns:repeat(2,1fr)}
  .fw-window-body{grid-template-columns:1fr}.fw-window-side{display:none}
  .fw-stats-bar>div+div{border-left:0;border-top:1px solid var(--fw-border)}
  .fw-price-card.fw-featured{transform:none}
  .fw-inline-form{flex-direction:column}
}
@container site (max-width: 480px){
  .fw-cols-4{grid-template-columns:1fr}
  .fw-footer-grid{grid-template-columns:1fr 1fr}
  .fw-actions .fw-btn{width:100%}
  .fw-window-main{grid-template-columns:1fr 1fr}
}
`;
}
