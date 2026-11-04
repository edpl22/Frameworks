import { lazy, Suspense, useEffect, useState } from 'react';
import { Landing } from './landing/Landing';
import { isDesktop } from './core/platform';

// The studio is code-split so the marketing page loads instantly.
const Studio = lazy(() => import('./studio/Studio').then((m) => ({ default: m.Studio })));

function useHashRoute() {
  // Plain `#studio` works everywhere (Claude Artifacts only pass simple hash
  // names); the older `#/studio` form is still accepted.
  const get = () => window.location.hash.replace(/^#\/?/, '');
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => { setRoute(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function App() {
  const route = useHashRoute();
  const showStudio = route.startsWith('studio') || isDesktop();

  useEffect(() => {
    document.body.style.overflow = showStudio ? 'hidden' : '';
  }, [showStudio]);

  if (showStudio) {
    return (
      <Suspense fallback={<div className="boot"><div className="boot-orb" /></div>}>
        <Studio />
      </Suspense>
    );
  }
  return <Landing />;
}
