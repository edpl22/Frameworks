<div align="center">

[![CI](https://github.com/edpl22/Frameworks/actions/workflows/ci.yml/badge.svg)](https://github.com/edpl22/Frameworks/actions/workflows/ci.yml)

# Frameworks Studio

**Desenhe sites visualmente. Gere um prompt de engenharia pronto para o Claude Code. Exporte tudo.**

Web · Desktop (macOS / Windows / Linux) · Docker

</div>

---

Frameworks Studio é um editor visual de sites. Você monta páginas a partir de uma biblioteca de seções, ajusta o design system e o conteúdo, e o app transforma esse design em uma **especificação estruturada para o Claude Code**. O prompt traz stack, design tokens, arquitetura, o conteúdo de cada seção, requisitos de qualidade, plano de execução e critérios de aceite.

## Recursos

| Área | O que tem |
|---|---|
| **Canvas** | Arrastar e soltar a partir da biblioteca, reordenar seções, edição de texto inline (`*destaque*` vira gradiente), preview desktop/tablet/mobile com container queries, zoom, grade de 12 colunas e modo preview |
| **Biblioteca** | 15 tipos de seção com mais de 30 variações: Navbar, Hero, Logos, Recursos (grid/bento/lista), Números, Texto + mídia, Galeria, Depoimentos, Preços, Equipe, FAQ, CTA, Contato, Newsletter e Rodapé |
| **Inspetor** | Painel gerado a partir do schema de cada seção (textos, listas, ícones, imagens, toggles) e controles de estilo: fundo (mesh, gradiente, imagem com overlay), espaçamento, alinhamento, largura, animação, bloqueio e instruções por seção para o Claude |
| **Design system** | 19 presets (incl. glassmorphism, neo-brutalismo, Swiss minimal), sombra brutal, gerador de paleta por harmonia (análoga, complementar, triádica, split, monocromática), contraste WCAG ao vivo, 22 pares tipográficos, escala modular, raio, sombras, estilo de botão e densidade |
| **Mídia** | Biblioteca de imagens local (IndexedDB, funciona offline e no desktop). Envie clicando ou soltando um arquivo direto na foto do canvas, arraste da biblioteca para qualquer seção ou escolha no inspetor. Imagens grandes são reduzidas para 2400px e convertidas para WebP. Vão para o ZIP (`assets/img/`), embutidas no HTML de arquivo único e no `.fwstudio`, e aparecem no prompt com o caminho no pacote |
| **Figma** | Importa tokens de **Figma Variables** (JSON da REST API, com modos e aliases), **Tokens Studio** (multi-set), **W3C DTCG** e **CSS variables**. Mapeamento automático para os papéis do tema (editável, com contraste WCAG e pré-visualização ao vivo), fontes, raio e tamanho base. Os nomes originais seguem para o prompt e para `design/figma-tokens.css` no ZIP |
| **Briefing** | Objetivo, público, tom de voz, segmento, idioma, stack de destino (Next.js, React+Vite, Astro, Nuxt, SvelteKit, HTML), funcionalidades e referências |
| **Prompt Builder** | Preview Markdown ao vivo, estimativa de tokens, nível de detalhe, PT/EN, toggles de seções, cópia, download `.md` e comando CLI pronto |
| **Exportação** | ZIP completo, HTML por página, `.fwstudio` (projeto), design tokens W3C, tema Tailwind v4/v3, CSS variables, cópia do HTML e importação |
| **Produtividade** | Paleta de comandos `⌘K`, atalhos de teclado, 150 passos de undo/redo com agrupamento de edições, autosave local, páginas múltiplas com SEO, copiar/colar seções |
| **Templates** | 20 templates originais com conteúdo próprio em 8 categorias (SaaS & Tech, Portfólio & Agência, E-commerce & Marca, Negócios locais, Eventos & Educação, Institucional, Mobile, Básico), filtros por estilo visual, busca e versões multi-página |

## Começando

```bash
npm install
npm run dev            # http://localhost:5173  (landing → "Abrir Studio")
```

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Typecheck + build de produção em `dist/` |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes end-to-end no navegador (Playwright, contra o build de produção) |
| `npm run desktop:dev` | App desktop com hot reload |
| `npm run desktop:build` | Gera instaladores em `release/` (dmg/zip, nsis/portable, AppImage/deb) |
| `npm run desktop:dir` | Build desktop descompactado (rápido, para testes) |

### Docker

```bash
docker compose up -d --build            # produção: http://localhost:8080
docker compose --profile dev up dev     # desenvolvimento com hot reload: http://localhost:5173
```

A imagem é multi-stage: Node 22 roda os testes e o build, e o nginx 1.27 serve os arquivos estáticos. O container roda com filesystem read-only, `no-new-privileges`, CSP e headers de segurança, gzip, cache imutável para assets e healthcheck em `/healthz`.

### Desktop

Electron com `contextIsolation`, `sandbox` e sem `nodeIntegration`. O renderer só tem acesso a uma bridge mínima e tipada (`window.fwDesktop`), que oferece:

- menus nativos
- diálogos nativos para salvar e abrir arquivos
- associação da extensão `.fwstudio`
- título da janela com indicador de alterações não salvas

> Em ambientes de CI sem acesso ao download do binário do Electron, use `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install`.

Smoke test do app empacotado (Linux): `FW_SMOKE_TEST=1 xvfb-run -a release/linux-unpacked/frameworks-studio --no-sandbox`. O app abre, confere se o Studio renderizou, se a bridge desktop existe e se nenhuma API do Node vazou para o renderer, e sai com código 0 ou 1.

### CI

O GitHub Actions roda quatro jobs:

- **Testes & build:** Vitest, typecheck e build
- **E2E:** Playwright cobrindo edição inline, drag-and-drop, templates, prompt, importação do Figma, upload de imagens e exportação ZIP
- **Docker:** build da imagem e smoke test do container
- **Desktop:** empacotamento com electron-builder e smoke test do app sob Xvfb

## Do design ao código

1. Abra o Studio e escolha um template (ou comece do zero).
2. Monte e edite as seções, ajuste o design system e preencha o briefing.
3. Clique em **Gerar prompt**, escolha a stack e o nível de detalhe e copie ou baixe `CLAUDE_PROMPT.md`.
4. Em uma pasta vazia, rode:

```bash
claude "$(cat CLAUDE_PROMPT.md)"
```

## Atalhos

| Ação | Atalho |
|---|---|
| Paleta de comandos | `⌘/Ctrl K` |
| Gerar prompt | `⌘/Ctrl Enter` |
| Exportar / Salvar / Abrir | `⌘/Ctrl E` / `S` / `O` |
| Desfazer / Refazer | `⌘/Ctrl Z` / `⌘/Ctrl Shift Z` |
| Duplicar / Copiar / Colar seção | `⌘/Ctrl D` / `C` / `V` |
| Mover seção | `Alt ↑/↓` |
| Navegar entre seções | `↑/↓` |
| Excluir seção | `Delete` |
| Preview | `⌘/Ctrl P` |
| Desktop / Tablet / Mobile | `1` / `2` / `3` |
| Grade | `G` |

A arquitetura está documentada em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Licença

MIT
