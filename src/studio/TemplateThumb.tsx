import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Section } from '../core/types';
import { projectFromTemplate, TEMPLATES, type Template } from '../core/templates';
import { generateSiteCSS } from '../core/siteCss';
import { StaticPage } from '../core/render/StaticPage';
import { ensureFonts } from '../core/fonts';

// ════════════════════════════════════════════════════════════════
//  Template thumbnails. Each one is a real (scaled-down) page, which is
//  expensive, so a thumbnail renders only once it scrolls near the viewport,
//  shows just the top of the page, and is cached for the session.
// ════════════════════════════════════════════════════════════════

export interface TemplateMeta { t: Template; swatches: string[]; font: string; pages: number; sections: number }

let metaCache: TemplateMeta[] | null = null;
/** Cheap per-template info for cards and filters (no rendering). */
export function templateMeta(): TemplateMeta[] {
  if (!metaCache) {
    metaCache = TEMPLATES.map((t) => {
      const p = projectFromTemplate(t);
      const pal = p.theme.palette;
      return {
        t,
        swatches: [pal.background, pal.primary, pal.secondary, pal.accent, pal.text],
        font: `${p.theme.fontHeading} / ${p.theme.fontBody}`,
        pages: p.pages.length,
        sections: p.pages.reduce((n, x) => n + x.sections.length, 0),
      };
    });
  }
  return metaCache;
}

interface ThumbData { sections: Section[]; css: string; fonts: string[] }
const thumbCache = new Map<string, ThumbData>();
function thumbData(t: Template): ThumbData {
  let d = thumbCache.get(t.id);
  if (!d) {
    const p = projectFromTemplate(t);
    // The card only shows the top of the page: nav + hero (+ the next section peeking in).
    d = { sections: p.pages[0].sections.slice(0, 3), css: generateSiteCSS(p.theme, `.tpl-${t.id} .fw-site`), fonts: [p.theme.fontHeading, p.theme.fontBody] };
    thumbCache.set(t.id, d);
  }
  return d;
}

export const TemplateThumb = memo(function TemplateThumb({ t, className, innerClassName, bg, children }: { t: Template; className: string; innerClassName: string; bg?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => thumbCache.has(t.id));
  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); } }, { rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  const data = visible ? thumbData(t) : null;
  useEffect(() => { if (data) ensureFonts(data.fonts); }, [data]);
  return (
    <div ref={ref} className={`${className} tpl-${t.id}`} style={bg ? { background: bg } : undefined}>
      {data && (
        <>
          <style>{data.css}</style>
          <div className={innerClassName}><StaticPage sections={data.sections} /></div>
        </>
      )}
      {children}
    </div>
  );
});
