import { describe, expect, it } from 'vitest';
import { score } from './CommandPalette';

describe('command palette search', () => {
  it('ranks exact phrase > all words > subsequence', () => {
    expect(score('gerar', 'Gerar prompt')).toBeGreaterThan(score('prompt gerar', 'Gerar prompt'));
    expect(score('preset neo', 'Aplicar preset: Neo-brutal')).toBeGreaterThan(score('preset neo', 'Aplicar preset: Neon Tech'));
    expect(score('gprm', 'Gerar prompt')).toBe(1);
    expect(score('xyz', 'Gerar prompt')).toBe(0);
  });
  it('ignores accents and case', () => {
    expect(score('pagina', 'Nova Página')).toBeGreaterThan(0);
    expect(score('SEÇÃO', 'Ir para seção')).toBeGreaterThan(0);
  });
});
