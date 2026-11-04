import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.resetModules(); delete (window as unknown as { claude?: unknown }).claude; });

describe('saveAs inside a Claude Artifact', () => {
  it('maps names onto the downloads allowlist', async () => {
    const { artifactFileName } = await import('./platform');
    expect(artifactFileName('aurora.zip')).toBe('aurora.zip');
    expect(artifactFileName('CLAUDE_PROMPT.md')).toBe('CLAUDE_PROMPT.md');
    expect(artifactFileName('aurora.fwstudio')).toBe('aurora.json');
    expect(artifactFileName('tokens.css')).toBe('tokens.css.txt');
  });

  it('routes saves through the downloads capability', async () => {
    const save = vi.fn().mockResolvedValue({ status: 'saved' });
    (window as unknown as { claude: unknown }).claude = { use: vi.fn().mockResolvedValue({ save }) };
    const { saveAs } = await import('./platform');
    await expect(saveAs('aurora.fwstudio', '{}')).resolves.toBe('aurora.json');
    expect(save).toHaveBeenCalledWith({ filename: 'aurora.json', data: '{}' });
  });

  it('treats a declined prompt as a cancel and other refusals as errors', async () => {
    const save = vi.fn().mockRejectedValueOnce({ code: 'declined' }).mockRejectedValueOnce({ code: 'unavailable' });
    (window as unknown as { claude: unknown }).claude = { use: vi.fn().mockResolvedValue({ save }) };
    const { saveAs } = await import('./platform');
    await expect(saveAs('a.zip', 'x')).resolves.toBeNull();
    await expect(saveAs('a.zip', 'x')).rejects.toThrow('Copiar');
  });
});
