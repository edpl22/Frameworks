import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { assetPath, assetRef, collectAssetIds, extFor, formatBytes, isAssetRef, blobToDataUrl, dataUrlToBlob, type AssetMeta } from './assets';
import { createDefaultProject } from './templates';
import { exportPageHTML, exportZip, parseProjectFile, portableProjectJSON, dataUrlAssetResolver, renderPageMarkup } from './exporters';
import { generatePrompt } from './prompt';
import type { Project } from './types';

const meta: AssetMeta = { id: 'img_abc', name: 'equipe.jpg', type: 'image/webp', width: 1200, height: 800, size: 54321, createdAt: 0 };
const png = new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], { type: 'image/webp' });

function projectWithImage(): Project {
  const p = createDefaultProject();
  const content = p.pages[0].sections.find((s) => s.type === 'content')!;
  content.props.image = assetRef(meta.id);
  content.props.showMockup = false;
  const hero = p.pages[0].sections.find((s) => s.type === 'hero')!;
  hero.style = { ...hero.style, background: 'image', backgroundImage: assetRef(meta.id) };
  p.assets = { [meta.id]: meta };
  return p;
}

describe('asset helpers', () => {
  it('builds refs, paths and extensions', () => {
    expect(isAssetRef(assetRef('x'))).toBe(true);
    expect(isAssetRef('https://x')).toBe(false);
    expect(extFor('image/jpeg')).toBe('jpg');
    expect(assetPath(meta)).toBe('assets/img/img_abc.webp');
    expect(formatBytes(2048)).toBe('2 KB');
  });
  it('collects refs from props, nested lists and styles', () => {
    const p = projectWithImage();
    const gallery = p.pages[0].sections.find((s) => s.type === 'testimonials')!;
    (gallery.props.items as { avatar: string }[])[0].avatar = assetRef('img_two');
    expect(collectAssetIds(p).sort()).toEqual(['img_abc', 'img_two']);
  });
  it('round-trips blobs through data URLs', async () => {
    const back = await dataUrlToBlob(await blobToDataUrl(png));
    expect(back.type).toBe('image/webp');
    expect(new Uint8Array(await back.arrayBuffer())).toEqual(new Uint8Array(await png.arrayBuffer()));
  });
});

describe('exports with uploaded images', () => {
  it('points HTML at relative files by default and never leaks asset: refs', () => {
    const p = projectWithImage();
    const html = exportPageHTML(p, p.pages[0]);
    expect(html).toContain('./assets/img/img_abc.webp');
    expect(html).not.toContain('asset:');
  });
  it('inlines data URLs for single-file HTML', async () => {
    const p = projectWithImage();
    const resolve = await dataUrlAssetResolver(new Map([[meta.id, png]]));
    expect(renderPageMarkup(p.pages[0], resolve)).toContain('data:image/webp;base64,');
  });
  it('ships image files and a portable project inside the ZIP', async () => {
    const p = projectWithImage();
    const zip = await JSZip.loadAsync(await (await exportZip(p, undefined, new Map([[meta.id, png]]))).arrayBuffer());
    expect(zip.file('assets/img/img_abc.webp')).not.toBeNull();
    const { project, assetData } = parseProjectFile(await zip.file('project.fwstudio')!.async('string'));
    expect(project.assets?.[meta.id]?.name).toBe('equipe.jpg');
    expect(assetData[meta.id]).toMatch(/^data:image\/webp;base64,/);
  });
  it('round-trips a portable project file', async () => {
    const p = projectWithImage();
    const { project, assetData } = parseProjectFile(await portableProjectJSON(p, new Map([[meta.id, png]])));
    expect(Object.keys(assetData)).toEqual([meta.id]);
    expect(project.pages.length).toBe(p.pages.length);
    expect(JSON.stringify(project)).not.toContain('$assetData');
  });
  it('describes images with their bundle path in the prompt', () => {
    const prompt = generatePrompt(projectWithImage());
    expect(prompt).toContain('Imagens fornecidas');
    expect(prompt).toContain('assets/img/img_abc.webp (equipe.jpg, 1200×800)');
    expect(prompt).not.toContain('asset:img_abc');
  });
});
