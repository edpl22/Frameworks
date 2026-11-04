import type { Section } from '../types';
import { SECTION_MAP } from '../sections';

/** Stable anchor id for a section (used by nav links and exports). */
export const anchorId = (s: Section) => s.type === 'navbar' || s.type === 'footer' ? s.type : `${s.type}-${s.id.slice(-4)}`;

export function sectionClass(s: Section): string {
  const st = s.style;
  return [
    'fw-section',
    `fw-bg-${st.background}`,
    `fw-py-${st.paddingY}`,
    `fw-align-${st.align}`,
    st.divider ? 'fw-divider' : '',
    st.customClass ?? '',
  ].filter(Boolean).join(' ');
}

/** Renders one section exactly as it will appear in the exported site. */
export function SiteSection({ s, revealed = true }: { s: Section; revealed?: boolean }) {
  const def = SECTION_MAP[s.type];
  if (!def) return null;
  const st = s.style;
  const bgStyle = st.background === 'image' && st.backgroundImage ? { backgroundImage: `url("${st.backgroundImage}")` } : undefined;
  const anim = st.animation !== 'none' ? st.animation : undefined;
  const inner = def.render({ s, p: s.props });

  if (s.type === 'navbar') {
    return (
      <header className={`fw-nav ${s.variant === 'centered' ? 'fw-nav-centered' : ''} fw-bg-${st.background}`} id={anchorId(s)} style={bgStyle}>
        {inner}
      </header>
    );
  }
  if (s.type === 'footer') {
    return <footer className={sectionClass(s)} id={anchorId(s)} style={bgStyle}>{inner}</footer>;
  }
  // Hero gets a meaningful landmark; others are <section>.
  return (
    <section className={sectionClass(s)} id={anchorId(s)} style={bgStyle} aria-label={s.name || def.label}>
      {st.background === 'image' && st.backgroundImage && <div className="fw-overlay" style={{ opacity: st.overlay ?? 0.5 }} />}
      <div className={`fw-container fw-w-${st.maxWidth}${anim && revealed ? ' fw-in' : ''}`} data-anim={anim}>
        {inner}
      </div>
    </section>
  );
}
