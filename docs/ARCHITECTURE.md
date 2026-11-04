# Arquitetura

## Princípios

1. **Uma fonte de verdade.** Todo o projeto é um documento JSON (`Project → Page[] → Section[]`). O canvas, o inspetor, o prompt e os exportadores leem esse mesmo documento.
2. **Um único renderizador.** Os componentes React em `core/sections.tsx` renderizam tanto o canvas editável quanto o HTML exportado (via `renderToStaticMarkup`). Um `RenderContext` decide se o texto é `contentEditable` ou estático, então o que se vê no editor é o que vai para o export.
3. **Schema primeiro.** Cada seção declara `fields` (texto, lista, ícone, imagem, toggle…), `variants`, `defaults` e `intent`. O inspetor é gerado a partir desse schema, e o `intent` é a descrição semântica usada no prompt. Uma seção nova é uma entrada no registro.
4. **Tokens como CSS.** `siteCss.ts` gera o stylesheet a partir dos tokens do tema. A responsividade usa **container queries**, e por isso o preview mobile/tablet no canvas reproduz o comportamento real sem iframe.
5. **Plataforma plugável.** `core/platform.ts` abstrai o runtime: no Electron usa a bridge do preload (diálogos nativos), no navegador usa download e `<input type=file>`.

## Estrutura

```
electron/            main.cts (janela, menus, IPC) · preload.cts (bridge segura)
docker/              nginx.conf · security-headers.conf
src/
  core/
    types.ts         modelo de documento + schema de campos
    color.ts         conversões, contraste WCAG, escalas tonais, harmonias
    theme.ts         presets, pares tipográficos, Google Fonts
    siteCss.ts       tokens → CSS do site (container queries, animações)
    sections.tsx     registro de seções (schema + render)
    render/          Editable/Media (contexto de edição) · SiteSection (shell)
    factory.ts       criação de seções/páginas/projetos, templates, setPath
    store.ts         Zustand: estado, histórico com coalescência, autosave
    prompt.ts        gerador do prompt para Claude Code (PT/EN, níveis)
    exporters.tsx    HTML, ZIP, tokens W3C, Tailwind, CSS vars, JSON
    platform.ts      bridge desktop/web
  studio/            TopBar, LeftPanel (biblioteca/camadas/páginas), Canvas,
                     Inspector, ThemePanel, BriefPanel, modals, CommandPalette
  landing/           página de marketing
```

## Histórico (undo/redo)

Toda mutação passa por `commit(fn, key)`. Commits com a mesma `key` em menos de 700 ms são agrupados, então digitar em um campo vira um único passo de undo. O histórico guarda até 150 snapshots imutáveis; como o compartilhamento estrutural é preservado, o custo de memória é baixo.

## Prompt

O gerador monta, nesta ordem:

1. Persona e regras
2. Contexto do produto
3. Stack e estrutura de pastas
4. Design system: tokens CSS e relatório de contraste
5. Páginas e seções na ordem visual: objetivo, layout, fundo, espaçamento, animação, conteúdo literal e notas do usuário
6. Requisitos funcionais
7. Padrões de qualidade: responsividade, a11y, performance, SEO, motion e código
8. Plano de execução e critérios de aceite
9. Spec JSON (opcional)

Seções ocultas são omitidas.

## Próximos passos sugeridos

- Upload de imagens e assets locais (IndexedDB / sistema de arquivos no desktop)
- Seções customizadas pelo usuário (blocos HTML livres)
- Colaboração em tempo real (CRDT / Yjs)
- Envio direto para o Claude Code via CLI a partir do app desktop
- Testes E2E com Playwright no CI
