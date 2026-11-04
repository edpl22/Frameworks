// Loaded lazily by the landing page: builds the live product-shot markup and
// the sample prompt from the real engine (templates, renderer, prompt generator).
import { createDefaultProject } from '../core/templates';
import { generatePrompt } from '../core/prompt';
import type { Section } from '../core/types';
import { generateSiteCSS } from '../core/siteCss';

export interface Demo { prompt: string; sections: Section[]; css: string }
export { StaticPage } from '../core/render/StaticPage';

export function buildDemo(): Demo {
  const p = createDefaultProject();
  return {
    prompt: generatePrompt(p, { detail: 'concise', includeContent: false, includeTokens: true, includeAcceptance: false, includeJsonSpec: false, includePlan: false, promptLanguage: 'pt-BR' }).slice(0, 1900),
    sections: p.pages[0].sections.slice(0, 4),
    css: generateSiteCSS(p.theme, '.lp-demo .fw-site'),
  };
}
