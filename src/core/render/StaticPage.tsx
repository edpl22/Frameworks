import { memo } from 'react';
import type { Section } from '../types';
import { RenderContext, type RenderCtx } from './editable';
import { SiteSection } from './SiteSection';

const STATIC: RenderCtx = { editable: false };

/**
 * A read-only page rendered as live React (thumbnails, previews, the landing demo).
 * Unlike the exporters it does not need react-dom/server, which stays out of the
 * bundle until the user actually exports something.
 */
export const StaticPage = memo(function StaticPage({ sections, ctx = STATIC }: { sections: Section[]; ctx?: RenderCtx }) {
  return (
    <RenderContext.Provider value={ctx}>
      <div className="fw-site">
        {sections.filter((s) => !s.hidden).map((s) => <SiteSection key={s.id} s={s} revealed={false} />)}
      </div>
    </RenderContext.Provider>
  );
});
