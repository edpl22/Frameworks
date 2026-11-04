import { renderToStaticMarkup } from 'react-dom/server';
import { relativeAssetResolver, pageFileName, cssVarsFile, designTokens, tailwindConfig, projectJSON, portableProjectJSON, type AssetResolver } from './exportData';

export * from './exportData';
import type { Page, Project } from './types';
import { RenderContext } from './render/editable';
import { SiteSection } from './render/SiteSection';
import { generateSiteCSS } from './siteCss';
import { googleFontsHref } from './theme';
import { figmaTokensCss } from './tokensImport';
import { assetPath } from './assets';
import { generatePrompt, DEFAULT_PROMPT_OPTIONS, type PromptOptions } from './prompt';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const REVEAL_SCRIPT = `(function(){var r=document.querySelector('.fw-site');if(!r)return;r.classList.add('fw-js');
var els=r.querySelectorAll('[data-anim]');if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('fw-in')});return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('fw-in');io.unobserve(e.target)}})},{threshold:.12});
els.forEach(function(e){io.observe(e)});
var b=r.querySelector('.fw-burger'),n=r.querySelector('.fw-nav-links');if(b&&n){b.addEventListener('click',function(){var o=n.style.display==='flex';n.style.cssText=o?'':'display:flex;flex-direction:column;position:absolute;top:68px;left:0;right:0;padding:20px;background:var(--fw-bg);border-bottom:1px solid var(--fw-border);gap:16px'})}})();`;

export function renderPageMarkup(page: Page, resolveAsset?: AssetResolver): string {
  return renderToStaticMarkup(
    <RenderContext.Provider value={{ editable: false, resolveAsset }}>
      <div className="fw-site">
        {page.sections.filter((s) => !s.hidden).map((s) => <SiteSection key={s.id} s={s} revealed={false} />)}
      </div>
    </RenderContext.Provider>,
  );
}

export function exportPageHTML(project: Project, page: Page, opts: { inlineCss?: boolean; resolveAsset?: AssetResolver } = { inlineCss: true }): string {
  const t = project.theme;
  const body = renderPageMarkup(page, opts.resolveAsset ?? relativeAssetResolver(project))
    // Rewrite internal page links to file names in the static export.
    .replace(/href="(\/[a-z0-9-/]*)"/g, (m, slug) => {
      const target = project.pages.find((p) => p.slug === slug);
      return target ? `href="./${pageFileName(target)}"` : m;
    });
  const css = generateSiteCSS(t);
  return `<!doctype html>
<html lang="${esc(project.brief.language || 'pt-BR')}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(page.seoTitle || page.name)}</title>
<meta name="description" content="${esc(page.seoDescription || project.brief.tagline)}" />
<meta property="og:title" content="${esc(page.seoTitle || page.name)}" />
<meta property="og:description" content="${esc(page.seoDescription || project.brief.tagline)}" />
<meta name="theme-color" content="${t.palette.primary}" />
<meta name="generator" content="Frameworks Studio" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${Array.from(new Set([t.fontHeading, t.fontBody])).map((f) => `<link rel="stylesheet" href="${googleFontsHref([f])}" />`).join('\n')}
${opts.inlineCss ? `<style>\nhtml,body{margin:0;scroll-behavior:smooth}\n${css}</style>` : '<link rel="stylesheet" href="./assets/site.css" />'}
</head>
<body>
${body}
<script>${REVEAL_SCRIPT}</script>
</body>
</html>
`;
}

export async function exportZip(project: Project, promptOptions: PromptOptions = DEFAULT_PROMPT_OPTIONS, blobs: Map<string, Blob> = new Map()): Promise<Blob> {
  const { default: JSZip } = await import('jszip'); // only needed when exporting
  const zip = new JSZip();
  for (const [id, blob] of blobs) {
    const m = project.assets?.[id];
    if (m) zip.file(assetPath(m), blob);
  }
  for (const page of project.pages) zip.file(pageFileName(page), exportPageHTML(project, page, { inlineCss: false }));
  zip.file('assets/site.css', `html,body{margin:0;scroll-behavior:smooth}\n${generateSiteCSS(project.theme)}`);
  zip.file('design/tokens.json', JSON.stringify(designTokens(project), null, 2));
  zip.file('design/tokens.css', cssVarsFile(project));
  zip.file('design/tailwind-theme.css', tailwindConfig(project));
  zip.file('CLAUDE_PROMPT.md', generatePrompt(project, promptOptions));
  if (project.figma) {
    zip.file('design/figma-tokens.css', figmaTokensCss(project.figma));
    zip.file('design/figma-tokens.json', JSON.stringify(project.figma, null, 2));
  }
  zip.file('project.fwstudio', blobs.size ? await portableProjectJSON(project, blobs) : projectJSON(project));
  zip.file('README.md', `# ${project.brief.projectName}

Exportado com **Frameworks Studio**.

| Arquivo | Uso |
|---|---|
| \`index.html\` (+ páginas) | Site estático pronto — abra no navegador ou publique em qualquer host |
| \`assets/site.css\` | Estilos gerados a partir do design system |
| \`assets/img/\` | Imagens enviadas no Studio (otimizadas) |
| \`CLAUDE_PROMPT.md\` | Prompt estruturado — cole no Claude Code para gerar o projeto em ${project.brief.stack} |
| \`design/tokens.json\` | Design tokens (formato W3C DTCG) |
| \`design/tailwind-theme.css\` | Tema pronto para Tailwind v4 / v3 |
| \`project.fwstudio\` | Arquivo do projeto — reabra no Frameworks Studio |

## Usando com Claude Code

\`\`\`bash
mkdir ${project.brief.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')} && cd $_
claude "$(cat CLAUDE_PROMPT.md)"
\`\`\`
`);
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
