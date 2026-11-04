// Abstraction over the runtime: Electron desktop (via preload bridge) or the browser.

export interface DesktopBridge {
  isDesktop: true;
  platform: string;
  saveFile: (opts: { defaultPath: string; content: string | ArrayBuffer; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
  writeFile: (path: string, content: string) => Promise<boolean>;
  openProject: () => Promise<{ path: string; content: string } | null>;
  setTitle: (title: string) => void;
  onMenu: (cb: (action: string) => void) => () => void;
  openExternal: (url: string) => void;
}

declare global {
  interface Window { fwDesktop?: DesktopBridge }
}

export const desktop = (): DesktopBridge | undefined => (typeof window !== 'undefined' ? window.fwDesktop : undefined);
export const isDesktop = () => !!desktop();

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const extOf = (name: string) => name.split('.').pop() ?? '';

/** Saves a file using the native dialog on desktop or a download in the browser. Returns the saved path/name or null. */
export async function saveAs(name: string, content: string | Blob, mime = 'text/plain'): Promise<string | null> {
  const d = desktop();
  if (d) {
    const data = content instanceof Blob ? await content.arrayBuffer() : content;
    return d.saveFile({ defaultPath: name, content: data, filters: [{ name: extOf(name).toUpperCase(), extensions: [extOf(name)] }] });
  }
  download(name, content instanceof Blob ? content : new Blob([content], { type: mime + ';charset=utf-8' }));
  return name;
}

export function pickTextFile(accept = '.fwstudio,.json'): Promise<{ name: string; content: string } | null> {
  const d = desktop();
  if (d) return d.openProject().then((r) => (r ? { name: r.path, content: r.content } : null));
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async () => {
      const f = input.files?.[0];
      resolve(f ? { name: f.name, content: await f.text() } : null);
    };
    input.click();
  });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
