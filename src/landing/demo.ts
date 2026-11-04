// Loaded lazily by the landing page: builds the live product-shot markup and
// the sample prompt from the real engine (templates, renderer, prompt generator).
import { createDefaultProject } from '../core/templates';
import { generatePrompt } from '../core/prompt';
import { renderPageMarkup } from '../core/exporters';
import { generateSiteCSS } from '../core/siteCss';

export interface Demo { prompt: string; html: string; css: string }

export function buildDemo(): Demo {
  const p = createDefaultProject();
  return {
    prompt: generatePrompt(p, { detail: 'concise', includeContent: false, includeTokens: true, includeAcceptance: false, includeJsonSpec: false, includePlan: false, promptLanguage: 'pt-BR' }).slice(0, 1900),
    html: renderPageMarkup({ ...p.pages[0], sections: p.pages[0].sections.slice(0, 4) }),
    css: generateSiteCSS(p.theme, '.lp-demo .fw-site'),
  };
}
