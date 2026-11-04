import type { Page, Project } from './types';
import { cssVariables } from './siteCss';
import { tonalScale } from './color';
import { assetIdOf, assetPath, blobToDataUrl } from './assets';

// ════════════════════════════════════════════════════════════════
//  Export helpers that do not render React to a string. Kept apart from
//  exporters.tsx so the Studio can use them without loading react-dom/server.
// ════════════════════════════════════════════════════════════════

export type AssetResolver = (src: string) => string | undefined;

/** Default for exports: uploaded images point to `./assets/img/<id>.<ext>` next to the HTML. */
export function relativeAssetResolver(project: Project): AssetResolver {
  return (src) => {
    const m = project.assets?.[assetIdOf(src)];
    return m ? './' + assetPath(m) : undefined;
  };
}

/** Inlines uploaded images as data URLs (single-file HTML export). */
export async function dataUrlAssetResolver(blobs: Map<string, Blob>): Promise<AssetResolver> {
  const urls = new Map<string, string>();
  for (const [id, b] of blobs) urls.set(id, await blobToDataUrl(b));
  return (src) => urls.get(assetIdOf(src));
}

export function pageFileName(page: Page): string {
  return page.slug === '/' ? 'index.html' : `${page.slug.replace(/^\//, '').replace(/\//g, '-') || 'page'}.html`;
}

export function cssVarsFile(project: Project): string {
  const vars = cssVariables(project.theme);
  return `:root {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}\n`;
}

/** W3C Design Tokens Community Group format. */
export function designTokens(project: Project) {
  const t = project.theme;
  const color = (v: string) => ({ $type: 'color', $value: v });
  const dim = (v: number) => ({ $type: 'dimension', $value: `${v}px` });
  return {
    color: {
      ...Object.fromEntries(Object.entries(t.palette).map(([k, v]) => [k, color(v)])),
      'primary-scale': Object.fromEntries(Object.entries(tonalScale(t.palette.primary)).map(([k, v]) => [k, color(v)])),
    },
    font: {
      heading: { $type: 'fontFamily', $value: [t.fontHeading, 'serif'] },
      body: { $type: 'fontFamily', $value: [t.fontBody, 'sans-serif'] },
    },
    size: {
      base: dim(t.baseSize),
      ...Object.fromEntries([['sm', -1], ['lg', 1], ['xl', 2], ['2xl', 3], ['3xl', 4], ['4xl', 5]].map(([k, e]) => [k, dim(+(t.baseSize * t.scale ** (e as number)).toFixed(1))])),
    },
    radius: { sm: dim(Math.round(t.radius * 0.6)), md: dim(t.radius), lg: dim(Math.round(t.radius * 1.5)) },
    meta: { mode: t.mode, shadow: t.shadow, buttonStyle: t.buttonStyle, density: t.density, scaleRatio: t.scale },
  };
}

export function tailwindConfig(project: Project): string {
  const t = project.theme;
  const scale = tonalScale(t.palette.primary);
  return `/* Tailwind CSS v4 — cole em seu CSS global */
@import "tailwindcss";

@theme {
${Object.entries(t.palette).map(([k, v]) => `  --color-${k}: ${v};`).join('\n')}
${Object.entries(scale).map(([k, v]) => `  --color-primary-${k}: ${v};`).join('\n')}
  --font-heading: "${t.fontHeading}", ui-serif, serif;
  --font-body: "${t.fontBody}", ui-sans-serif, system-ui, sans-serif;
  --radius-sm: ${Math.round(t.radius * 0.6)}px;
  --radius-md: ${t.radius}px;
  --radius-lg: ${Math.round(t.radius * 1.5)}px;
}

/* Tailwind v3 (tailwind.config.js)
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify({ ...t.palette, primary: { DEFAULT: t.palette.primary, ...scale } }, null, 2).replace(/\n/g, '\n      ')},
      fontFamily: { heading: ['${t.fontHeading}', 'serif'], body: ['${t.fontBody}', 'sans-serif'] },
      borderRadius: { DEFAULT: '${t.radius}px' },
    },
  },
};
*/
`;
}

export function projectJSON(project: Project): string {
  return JSON.stringify({ $schema: 'frameworks-studio/project@1', ...project }, null, 2);
}

/** Project file with the used images embedded, so it opens on any machine. */
export async function portableProjectJSON(project: Project, blobs: Map<string, Blob>): Promise<string> {
  const assetData: Record<string, string> = {};
  for (const [id, b] of blobs) assetData[id] = await blobToDataUrl(b);
  return JSON.stringify({ $schema: 'frameworks-studio/project@1', ...project, $assetData: assetData }, null, 2);
}

export function parseProject(text: string): Project {
  return parseProjectFile(text).project;
}

export function parseProjectFile(text: string): { project: Project; assetData: Record<string, string> } {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Arquivo de projeto inválido'); }
  if (!data || !Array.isArray(data.pages) || !data.theme || !data.brief) throw new Error('Arquivo de projeto inválido');
  const assetData = (data.$assetData ?? {}) as Record<string, string>;
  delete data.$schema;
  delete data.$assetData;
  return { project: data as Project, assetData };
}

