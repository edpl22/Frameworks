import type { ReactNode } from 'react';
import {
  PanelTop, Sparkles, Building2, LayoutGrid, BarChart3, Columns2, Images, Quote, CreditCard, Users,
  HelpCircle, Megaphone, Mail, Send, PanelBottom, Check, Menu, Puzzle, type LucideIcon,
} from 'lucide-react';
import type { Field, Props, PropValue, Section, SectionStyle, SectionType } from './types';
import { Editable, Img, Media, useRender } from './render/editable';
import { SiteIcon } from './icons';

// ─── helpers ────────────────────────────────────────────────────
export const str = (v: PropValue | undefined): string => (v === undefined || v === null ? '' : String(v));
export const list = (v: PropValue | undefined): Props[] => (Array.isArray(v) ? (v as Props[]) : []);
export const bool = (v: PropValue | undefined): boolean => v === true || v === 'true';

export interface RenderArgs {
  s: Section;
  p: Props;
}

export type Category = 'Navegação' | 'Topo' | 'Conteúdo' | 'Prova social' | 'Conversão' | 'Rodapé';

export interface SectionDef {
  type: SectionType;
  label: string;
  description: string;
  category: Category;
  icon: LucideIcon;
  variants: { id: string; label: string }[];
  fields: Field[];
  defaults: () => Props;
  defaultStyle?: Partial<SectionStyle>;
  /** Navbar & footer render their own wrapper. */
  bare?: boolean;
  /** Semantic description consumed by the prompt generator. */
  intent: string;
  render: (a: RenderArgs) => ReactNode;
}

const E = Editable;

const btnFields: Field[] = [
  { key: 'primaryLabel', label: 'Botão principal', kind: 'text' },
  { key: 'primaryHref', label: 'Link principal', kind: 'url' },
  { key: 'secondaryLabel', label: 'Botão secundário', kind: 'text' },
  { key: 'secondaryHref', label: 'Link secundário', kind: 'url' },
];

function Actions({ p }: { p: Props }) {
  if (!str(p.primaryLabel) && !str(p.secondaryLabel)) return null;
  return (
    <div className="fw-actions">
      {str(p.primaryLabel) && (
        <a className="fw-btn fw-btn-primary" href={str(p.primaryHref) || '#'}>
          <E path="primaryLabel" value={str(p.primaryLabel)} />
        </a>
      )}
      {str(p.secondaryLabel) && (
        <a className="fw-btn fw-btn-secondary" href={str(p.secondaryHref) || '#'}>
          <E path="secondaryLabel" value={str(p.secondaryLabel)} />
        </a>
      )}
    </div>
  );
}

function Head({ p, h1 }: { p: Props; h1?: boolean }) {
  return (
    <div className="fw-head">
      {str(p.eyebrow) && <E as="div" className="fw-eyebrow" path="eyebrow" value={str(p.eyebrow)} />}
      <E as={h1 ? 'h1' : 'h2'} className={h1 ? 'fw-h1' : 'fw-h2'} path="title" value={str(p.title)} multiline />
      {str(p.subtitle) && <E as="p" className="fw-lead" path="subtitle" value={str(p.subtitle)} multiline />}
    </div>
  );
}

const headFields: Field[] = [
  { key: 'eyebrow', label: 'Sobretítulo', kind: 'text' },
  { key: 'title', label: 'Título', kind: 'textarea', placeholder: 'Use *palavra* para destacar' },
  { key: 'subtitle', label: 'Subtítulo', kind: 'textarea' },
];

function AppWindow() {
  return (
    <div className="fw-window" aria-hidden="true">
      <div className="fw-window-bar"><i /><i /><i /></div>
      <div className="fw-window-body">
        <div className="fw-window-side"><span /><span /><span style={{ width: '80%' }} /><span style={{ width: '60%' }} /><span /></div>
        <div className="fw-window-main">
          <div className="fw-kpi"><small /><strong>$84.2k</strong></div>
          <div className="fw-kpi"><small /><strong>+38%</strong></div>
          <div className="fw-kpi"><small /><strong>12,480</strong></div>
          <div className="fw-chart">
            <svg viewBox="0 0 400 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fwchart" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--fw-primary)" stopOpacity=".35" />
                  <stop offset="1" stopColor="var(--fw-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 120 C40 110 60 80 100 86 S160 60 200 64 S260 30 300 38 S360 14 400 18 V150 H0Z" fill="url(#fwchart)" />
              <path d="M0 120 C40 110 60 80 100 86 S160 60 200 64 S260 30 300 38 S360 14 400 18" fill="none" stroke="var(--fw-primary)" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

const item = (o: Props) => () => ({ ...o });

/** Editor-only note showing the custom block's spec (never exported). */
function CustomSpecNote({ spec }: { spec: string }) {
  const { editable } = useRender();
  if (!editable) return null;
  return (
    <div className="fw-spec-note">
      <b>Bloco personalizado</b>
      <span>{spec || 'Descreva no inspetor o que este bloco deve fazer — essa descrição vai para o prompt.'}</span>
    </div>
  );
}

// ─── registry ───────────────────────────────────────────────────
export const SECTIONS: SectionDef[] = [
  {
    type: 'navbar',
    label: 'Navbar',
    description: 'Barra de navegação fixa com logo, links e CTA',
    category: 'Navegação',
    icon: PanelTop,
    bare: true,
    intent: 'Sticky top navigation with brand logo, primary links and a call-to-action. Collapses into a hamburger menu on mobile.',
    variants: [{ id: 'default', label: 'Padrão' }, { id: 'centered', label: 'Links centralizados' }],
    defaultStyle: { paddingY: 'none', background: 'default', animation: 'none' },
    fields: [
      { key: 'brand', label: 'Marca', kind: 'text' },
      { key: 'logoUrl', label: 'Logo (URL)', kind: 'image' },
      { key: 'links', label: 'Links', kind: 'list', itemLabel: 'Link', fields: [{ key: 'label', label: 'Texto', kind: 'text' }, { key: 'href', label: 'URL', kind: 'url' }], newItem: item({ label: 'Link', href: '#' }) },
      { key: 'ctaLabel', label: 'CTA', kind: 'text' },
      { key: 'ctaHref', label: 'CTA link', kind: 'url' },
    ],
    defaults: () => ({
      brand: 'Aurora',
      logoUrl: '',
      links: [{ label: 'Produto', href: '#features' }, { label: 'Clientes', href: '#testimonials' }, { label: 'Preços', href: '#pricing' }, { label: 'FAQ', href: '#faq' }],
      ctaLabel: 'Começar grátis',
      ctaHref: '#',
    }),
    render: ({ s, p }) => (
      <div className={`fw-container fw-w-${s.style.maxWidth} fw-nav-inner`}>
        <a className="fw-logo" href="#">
          {str(p.logoUrl) ? <Img src={str(p.logoUrl)} style={{ height: 28 }} /> : <span className="fw-logo-mark">{str(p.brand).slice(0, 1)}</span>}
          <E path="brand" value={str(p.brand)} />
        </a>
        <nav className="fw-nav-links">
          {list(p.links).map((l, i) => (
            <a key={i} href={str(l.href)}><E path={`links.${i}.label`} value={str(l.label)} /></a>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {str(p.ctaLabel) && <a className="fw-btn fw-btn-primary fw-nav-cta" href={str(p.ctaHref) || '#'}><E path="ctaLabel" value={str(p.ctaLabel)} /></a>}
          <button className="fw-burger" aria-label="Menu" type="button"><Menu size={18} /></button>
        </div>
      </div>
    ),
  },
  {
    type: 'hero',
    label: 'Hero',
    description: 'Seção de abertura com título impactante e CTAs',
    category: 'Topo',
    icon: Sparkles,
    intent: 'Above-the-fold hero. Must communicate the value proposition in under 5 seconds, with a strong headline, supporting copy, primary/secondary CTAs and a visual.',
    variants: [
      { id: 'centered', label: 'Centralizado + mockup' },
      { id: 'split', label: 'Dividido (texto + visual)' },
      { id: 'minimal', label: 'Minimalista' },
    ],
    defaultStyle: { background: 'mesh', paddingY: 'xl', align: 'center', animation: 'slide-up' },
    fields: [
      { key: 'badgeTag', label: 'Selo (tag)', kind: 'text' },
      { key: 'badge', label: 'Selo (texto)', kind: 'text' },
      ...headFields,
      ...btnFields,
      { key: 'proof', label: 'Prova social', kind: 'text' },
      { key: 'image', label: 'Imagem', kind: 'image' },
      { key: 'imageAlt', label: 'Texto alternativo da imagem', kind: 'text', placeholder: 'Descreva a imagem para leitores de tela' },
      { key: 'showMockup', label: 'Mostrar mockup de app', kind: 'toggle' },
    ],
    defaults: () => ({
      badgeTag: 'Novo',
      badge: 'Lançamos a versão 3.0 com IA nativa',
      eyebrow: '',
      title: 'Construa o futuro do seu *negócio digital*',
      subtitle: 'A plataforma all-in-one que une design, dados e automação para escalar sua empresa com a elegância de uma marca premium.',
      primaryLabel: 'Começar agora',
      primaryHref: '#',
      secondaryLabel: 'Ver demonstração',
      secondaryHref: '#',
      proof: '+12.000 empresas confiam em nós',
      image: '',
      imageAlt: '',
      showMockup: true,
    }),
    render: ({ s, p }) => {
      const badge = str(p.badge) && (
        <div className="fw-badge">{str(p.badgeTag) && <b><E path="badgeTag" value={str(p.badgeTag)} /></b>}<E path="badge" value={str(p.badge)} /></div>
      );
      const proof = str(p.proof) && (
        <div className="fw-hero-proof"><div className="fw-avatars"><span /><span /><span /></div><E className="fw-muted" path="proof" value={str(p.proof)} /></div>
      );
      const visual = str(p.image) ? <Media src={str(p.image)} alt={str(p.imageAlt)} path="image" /> : bool(p.showMockup) ? <AppWindow /> : null;
      if (s.variant === 'split') {
        return (
          <div className="fw-split fw-hero-split" style={{ textAlign: 'left' }}>
            <div>{badge}<Head p={p} h1 /><Actions p={p} />{proof}</div>
            <div>{visual ?? <Media path="image" />}</div>
          </div>
        );
      }
      return (
        <>
          <div className="fw-hero-glow" />
          <div style={{ position: 'relative' }}>
            {badge}
            <Head p={p} h1 />
            <Actions p={p} />
            {proof}
            {s.variant !== 'minimal' && visual && <div className="fw-hero-visual">{visual}</div>}
          </div>
        </>
      );
    },
  },
  {
    type: 'logos',
    label: 'Logos de clientes',
    description: 'Faixa de marcas que confiam em você',
    category: 'Prova social',
    icon: Building2,
    intent: 'Trust bar showing customer/partner logos. Use real SVG logos when available, grayscale with hover color.',
    variants: [{ id: 'default', label: 'Faixa' }],
    defaultStyle: { paddingY: 'sm', animation: 'fade' },
    fields: [
      { key: 'label', label: 'Legenda', kind: 'text' },
      { key: 'logos', label: 'Marcas', kind: 'list', itemLabel: 'Marca', fields: [{ key: 'name', label: 'Nome', kind: 'text' }, { key: 'icon', label: 'Ícone', kind: 'icon' }], newItem: item({ name: 'Marca', icon: 'gem' }) },
    ],
    defaults: () => ({
      label: 'EMPRESAS QUE ESCALAM COM A GENTE',
      logos: [
        { name: 'Northwind', icon: 'globe' }, { name: 'Vertex', icon: 'layers' }, { name: 'Lumen', icon: 'sparkles' },
        { name: 'Quantum', icon: 'cpu' }, { name: 'Helios', icon: 'zap' }, { name: 'Oasis', icon: 'leaf' },
      ],
    }),
    render: ({ p }) => (
      <>
        {str(p.label) && <E as="p" className="fw-logos-label" path="label" value={str(p.label)} />}
        <div className="fw-logos">
          {list(p.logos).map((l, i) => (
            <span key={i}><SiteIcon name={str(l.icon)} size={22} /><E path={`logos.${i}.name`} value={str(l.name)} /></span>
          ))}
        </div>
      </>
    ),
  },
  {
    type: 'features',
    label: 'Recursos',
    description: 'Grid, lista ou bento de benefícios',
    category: 'Conteúdo',
    icon: LayoutGrid,
    intent: 'Feature/benefit showcase. Each item has an icon, a short title and a one-to-two sentence benefit-oriented description.',
    variants: [{ id: 'grid', label: 'Grid de cards' }, { id: 'bento', label: 'Bento grid' }, { id: 'list', label: 'Lista com ícones' }],
    defaultStyle: { paddingY: 'lg', align: 'center', animation: 'slide-up' },
    fields: [
      ...headFields,
      { key: 'columns', label: 'Colunas', kind: 'select', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] },
      { key: 'items', label: 'Itens', kind: 'list', itemLabel: 'Recurso', fields: [{ key: 'icon', label: 'Ícone', kind: 'icon' }, { key: 'title', label: 'Título', kind: 'text' }, { key: 'text', label: 'Descrição', kind: 'textarea' }], newItem: item({ icon: 'sparkles', title: 'Novo recurso', text: 'Descreva o benefício em uma frase.' }) },
    ],
    defaults: () => ({
      eyebrow: 'Recursos',
      title: 'Tudo que você precisa, *nada que você não precisa*',
      subtitle: 'Ferramentas poderosas desenhadas para equipes que exigem performance, segurança e beleza.',
      columns: '3',
      items: [
        { icon: 'zap', title: 'Velocidade extrema', text: 'Infraestrutura edge global com tempo de resposta abaixo de 50ms em qualquer lugar.' },
        { icon: 'shield', title: 'Segurança enterprise', text: 'Criptografia ponta a ponta, SOC 2 Type II e conformidade com LGPD.' },
        { icon: 'chart', title: 'Analytics em tempo real', text: 'Dashboards inteligentes que transformam dados em decisões.' },
        { icon: 'workflow', title: 'Automação sem código', text: 'Crie fluxos complexos arrastando blocos, sem depender de devs.' },
        { icon: 'users', title: 'Colaboração nativa', text: 'Times inteiros editando juntos, com comentários e histórico.' },
        { icon: 'wand', title: 'IA integrada', text: 'Sugestões inteligentes que aceleram cada etapa do seu trabalho.' },
      ],
    }),
    render: ({ s, p }) => {
      const items = list(p.items);
      if (s.variant === 'list') {
        return (
          <>
            <Head p={p} />
            <div className="fw-feature-list" style={{ textAlign: 'left' }}>
              {items.map((it, i) => (
                <div className="fw-feature-row" key={i}>
                  <div className="fw-icon"><SiteIcon name={str(it.icon)} /></div>
                  <div><E as="h3" className="fw-h3" path={`items.${i}.title`} value={str(it.title)} /><E as="p" className="fw-muted" path={`items.${i}.text`} value={str(it.text)} multiline /></div>
                </div>
              ))}
            </div>
          </>
        );
      }
      return (
        <>
          <Head p={p} />
          <div className={s.variant === 'bento' ? 'fw-bento' : `fw-grid fw-cols-${str(p.columns) || '3'}`} style={{ textAlign: 'left' }}>
            {items.map((it, i) => (
              <div className="fw-card" key={i}>
                <div className="fw-icon"><SiteIcon name={str(it.icon)} /></div>
                <E as="h3" className="fw-h3" path={`items.${i}.title`} value={str(it.title)} />
                <E as="p" className="fw-muted" path={`items.${i}.text`} value={str(it.text)} multiline />
              </div>
            ))}
          </div>
        </>
      );
    },
  },
  {
    type: 'stats',
    label: 'Números',
    description: 'Métricas de impacto em destaque',
    category: 'Prova social',
    icon: BarChart3,
    intent: 'Key metrics/KPIs section. Numbers should animate (count-up) when entering the viewport.',
    variants: [{ id: 'cards', label: 'Cards' }, { id: 'bar', label: 'Faixa divisória' }],
    defaultStyle: { paddingY: 'md', align: 'center', animation: 'fade' },
    fields: [
      ...headFields,
      { key: 'items', label: 'Métricas', kind: 'list', itemLabel: 'Métrica', fields: [{ key: 'value', label: 'Valor', kind: 'text' }, { key: 'label', label: 'Legenda', kind: 'text' }], newItem: item({ value: '99%', label: 'Métrica' }) },
    ],
    defaults: () => ({
      eyebrow: '', title: '', subtitle: '',
      items: [{ value: '12k+', label: 'Empresas ativas' }, { value: '99.99%', label: 'Uptime garantido' }, { value: '4.9/5', label: 'Avaliação média' }, { value: '3x', label: 'Mais conversão' }],
    }),
    render: ({ s, p }) => (
      <>
        {str(p.title) && <Head p={p} />}
        <div className={`fw-grid fw-cols-4 ${s.variant === 'bar' ? 'fw-stats-bar' : ''}`} style={s.variant === 'bar' ? { gap: 0 } : undefined}>
          {list(p.items).map((it, i) => (
            <div key={i} className={s.variant === 'bar' ? '' : 'fw-card'}>
              <E as="div" className="fw-stat-value" path={`items.${i}.value`} value={str(it.value)} />
              <E as="div" className="fw-stat-label fw-muted" path={`items.${i}.label`} value={str(it.label)} />
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    type: 'content',
    label: 'Texto + mídia',
    description: 'Bloco dividido com imagem e checklist',
    category: 'Conteúdo',
    icon: Columns2,
    intent: 'Two-column storytelling block: media on one side, headline + copy + checklist + CTA on the other.',
    variants: [{ id: 'image-right', label: 'Imagem à direita' }, { id: 'image-left', label: 'Imagem à esquerda' }],
    defaultStyle: { paddingY: 'lg', align: 'left', animation: 'slide-up' },
    fields: [
      ...headFields,
      { key: 'bullets', label: 'Checklist', kind: 'list', itemLabel: 'Item', fields: [{ key: 'text', label: 'Texto', kind: 'text' }], newItem: item({ text: 'Novo benefício' }) },
      ...btnFields,
      { key: 'image', label: 'Imagem', kind: 'image' },
      { key: 'imageAlt', label: 'Texto alternativo da imagem', kind: 'text', placeholder: 'Descreva a imagem para leitores de tela' },
      { key: 'showMockup', label: 'Usar mockup de app', kind: 'toggle' },
    ],
    defaults: () => ({
      eyebrow: 'Por que nós',
      title: 'Projetado para equipes que *pensam grande*',
      subtitle: 'Centralize operações, elimine retrabalho e entregue experiências que encantam seus clientes desde o primeiro clique.',
      bullets: [{ text: 'Onboarding guiado em menos de 5 minutos' }, { text: 'Integrações com +200 ferramentas' }, { text: 'Suporte humano 24/7 em português' }],
      primaryLabel: 'Saiba mais', primaryHref: '#', secondaryLabel: '', secondaryHref: '',
      image: '', imageAlt: '', showMockup: false,
    }),
    render: ({ s, p }) => (
      <div className={`fw-split ${s.variant === 'image-left' ? 'fw-reverse' : ''}`}>
        <div>
          <Head p={p} />
          <ul className="fw-checks" style={{ marginTop: -24 }}>
            {list(p.bullets).map((b, i) => (<li key={i}><Check /><E path={`bullets.${i}.text`} value={str(b.text)} /></li>))}
          </ul>
          <Actions p={p} />
        </div>
        <div>{bool(p.showMockup) && !str(p.image) ? <AppWindow /> : <Media src={str(p.image)} alt={str(p.imageAlt)} path="image" />}</div>
      </div>
    ),
  },
  {
    type: 'gallery',
    label: 'Galeria',
    description: 'Portfólio ou galeria de imagens',
    category: 'Conteúdo',
    icon: Images,
    intent: 'Image gallery / portfolio grid with lightbox on click and lazy loading.',
    variants: [{ id: 'grid', label: 'Grid' }, { id: 'masonry', label: 'Masonry' }],
    defaultStyle: { paddingY: 'lg', align: 'center', animation: 'zoom' },
    fields: [
      ...headFields,
      { key: 'images', label: 'Imagens', kind: 'list', itemLabel: 'Imagem', fields: [{ key: 'src', label: 'URL', kind: 'image' }, { key: 'caption', label: 'Legenda', kind: 'text' }], newItem: item({ src: '', caption: 'Projeto' }) },
    ],
    defaults: () => ({
      eyebrow: 'Portfólio', title: 'Trabalhos que *falam por si*', subtitle: '',
      images: ['Branding', 'Web App', 'E-commerce', 'Mobile', 'Campanha', 'Produto'].map((c) => ({ src: '', caption: c })),
    }),
    render: ({ s, p }) => (
      <>
        <Head p={p} />
        <div className={`fw-gallery ${s.variant === 'masonry' ? 'fw-gallery-masonry' : ''}`}>
          {list(p.images).map((im, i) => (<Media key={i} src={str(im.src)} alt={str(im.caption)} caption={str(im.caption) || undefined} path={`images.${i}.src`} />))}
        </div>
      </>
    ),
  },
  {
    type: 'testimonials',
    label: 'Depoimentos',
    description: 'Avaliações de clientes',
    category: 'Prova social',
    icon: Quote,
    intent: 'Customer testimonials with quote, name, role/company and avatar. Builds credibility.',
    variants: [{ id: 'grid', label: 'Grid de cards' }, { id: 'highlight', label: 'Destaque único' }],
    defaultStyle: { paddingY: 'lg', align: 'center', background: 'surface', animation: 'slide-up' },
    fields: [
      ...headFields,
      { key: 'items', label: 'Depoimentos', kind: 'list', itemLabel: 'Depoimento', fields: [{ key: 'quote', label: 'Texto', kind: 'textarea' }, { key: 'name', label: 'Nome', kind: 'text' }, { key: 'role', label: 'Cargo', kind: 'text' }, { key: 'avatar', label: 'Foto (URL)', kind: 'image' }], newItem: item({ quote: 'Experiência incrível.', name: 'Nome', role: 'Cargo, Empresa', avatar: '' }) },
    ],
    defaults: () => ({
      eyebrow: 'Depoimentos', title: 'Amado por quem *constrói o amanhã*', subtitle: '',
      items: [
        { quote: 'Reduzimos nosso tempo de lançamento em 70%. É a ferramenta mais elegante que já usamos.', name: 'Marina Costa', role: 'CPO, Vertex', avatar: '' },
        { quote: 'O suporte é impecável e o produto evolui toda semana. Virou parte do nosso DNA.', name: 'Rafael Lima', role: 'CTO, Lumen', avatar: '' },
        { quote: 'Nossa conversão triplicou depois da migração. Simplesmente indispensável.', name: 'Ana Souza', role: 'Head de Growth, Helios', avatar: '' },
      ],
    }),
    render: ({ s, p }) => {
      const items = list(p.items);
      const Person = ({ it, i }: { it: Props; i: number }) => (
        <div className="fw-person">
          <div className="fw-person-avatar">{str(it.avatar) ? <Img src={str(it.avatar)} /> : str(it.name).slice(0, 1)}</div>
          <div style={{ textAlign: 'left' }}><E as="strong" path={`items.${i}.name`} value={str(it.name)} /><E as="span" className="fw-muted fw-small" path={`items.${i}.role`} value={str(it.role)} /></div>
        </div>
      );
      if (s.variant === 'highlight' && items[0]) {
        return (
          <>
            {str(p.eyebrow) && <E as="div" className="fw-eyebrow" path="eyebrow" value={str(p.eyebrow)} />}
            <div className="fw-stars">★★★★★</div>
            <E as="blockquote" className="fw-quote-xl" path="items.0.quote" value={`“${str(items[0].quote).replace(/^“|”$/g, '')}”`} multiline />
            <Person it={items[0]} i={0} />
          </>
        );
      }
      return (
        <>
          <Head p={p} />
          <div className="fw-grid fw-cols-3" style={{ textAlign: 'left' }}>
            {items.map((it, i) => (
              <figure className="fw-card" key={i} style={{ margin: 0 }}>
                <div className="fw-stars">★★★★★</div>
                <E as="blockquote" className="fw-quote" path={`items.${i}.quote`} value={str(it.quote)} multiline />
                <Person it={it} i={i} />
              </figure>
            ))}
          </div>
        </>
      );
    },
  },
  {
    type: 'pricing',
    label: 'Preços',
    description: 'Planos e tabela de preços',
    category: 'Conversão',
    icon: CreditCard,
    intent: 'Pricing tiers with features list and CTA. Highlight the recommended plan. Consider a monthly/yearly toggle.',
    variants: [{ id: 'cards', label: 'Cards' }],
    defaultStyle: { paddingY: 'lg', align: 'center', animation: 'slide-up' },
    fields: [
      ...headFields,
      { key: 'plans', label: 'Planos', kind: 'list', itemLabel: 'Plano', fields: [
        { key: 'name', label: 'Nome', kind: 'text' }, { key: 'price', label: 'Preço', kind: 'text' }, { key: 'period', label: 'Período', kind: 'text' },
        { key: 'description', label: 'Descrição', kind: 'text' }, { key: 'features', label: 'Recursos (1 por linha)', kind: 'textarea' },
        { key: 'cta', label: 'Botão', kind: 'text' }, { key: 'featured', label: 'Destacado', kind: 'toggle' },
      ], newItem: item({ name: 'Plano', price: 'R$ 99', period: '/mês', description: '', features: 'Recurso 1\nRecurso 2', cta: 'Assinar', featured: false }) },
    ],
    defaults: () => ({
      eyebrow: 'Preços', title: 'Planos que *crescem com você*', subtitle: 'Comece grátis. Faça upgrade quando quiser. Cancele a qualquer momento.',
      plans: [
        { name: 'Starter', price: 'R$ 0', period: '/mês', description: 'Para quem está começando.', features: 'Até 3 projetos\nAnalytics básico\nSuporte por e-mail', cta: 'Começar grátis', featured: false },
        { name: 'Pro', price: 'R$ 149', period: '/mês', description: 'Para times em crescimento.', features: 'Projetos ilimitados\nAutomação avançada\nIA integrada\nSuporte prioritário', cta: 'Assinar Pro', featured: true },
        { name: 'Enterprise', price: 'Sob consulta', period: '', description: 'Para operações em escala.', features: 'SSO & SAML\nSLA 99.99%\nGerente dedicado\nOn-premise opcional', cta: 'Falar com vendas', featured: false },
      ],
    }),
    render: ({ p }) => (
      <>
        <Head p={p} />
        <div className={`fw-grid fw-cols-${Math.min(4, Math.max(1, list(p.plans).length))}`} style={{ alignItems: 'stretch' }}>
          {list(p.plans).map((pl, i) => (
            <div key={i} className={`fw-card fw-price-card ${bool(pl.featured) ? 'fw-featured' : ''}`}>
              {bool(pl.featured) && <span className="fw-price-tag">Mais popular</span>}
              <E as="h3" className="fw-h3" path={`plans.${i}.name`} value={str(pl.name)} />
              <E as="p" className="fw-muted fw-small" path={`plans.${i}.description`} value={str(pl.description)} />
              <div className="fw-price"><E path={`plans.${i}.price`} value={str(pl.price)} /> <small>{str(pl.period)}</small></div>
              <ul className="fw-checks">
                {str(pl.features).split('\n').filter(Boolean).map((f, j) => (<li key={j}><Check /><span>{f}</span></li>))}
              </ul>
              <a className={`fw-btn ${bool(pl.featured) ? 'fw-btn-primary' : 'fw-btn-secondary'}`} href="#"><E path={`plans.${i}.cta`} value={str(pl.cta)} /></a>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    type: 'team',
    label: 'Equipe',
    description: 'Pessoas por trás da marca',
    category: 'Conteúdo',
    icon: Users,
    intent: 'Team members grid with photo, name and role. Optional social links.',
    variants: [{ id: 'grid', label: 'Grid' }],
    defaultStyle: { paddingY: 'lg', align: 'center', animation: 'slide-up' },
    fields: [
      ...headFields,
      { key: 'members', label: 'Membros', kind: 'list', itemLabel: 'Pessoa', fields: [{ key: 'name', label: 'Nome', kind: 'text' }, { key: 'role', label: 'Cargo', kind: 'text' }, { key: 'photo', label: 'Foto (URL)', kind: 'image' }], newItem: item({ name: 'Nome', role: 'Cargo', photo: '' }) },
    ],
    defaults: () => ({
      eyebrow: 'Equipe', title: 'Mentes por trás da *magia*', subtitle: '',
      members: [{ name: 'Helena Martins', role: 'CEO & Fundadora', photo: '' }, { name: 'Bruno Alves', role: 'Head de Design', photo: '' }, { name: 'Carla Nunes', role: 'Engenharia', photo: '' }, { name: 'Diego Rocha', role: 'Produto', photo: '' }],
    }),
    render: ({ p }) => (
      <>
        <Head p={p} />
        <div className="fw-grid fw-cols-4">
          {list(p.members).map((m, i) => (
            <div className="fw-member" key={i}>
              <Media src={str(m.photo)} alt={str(m.name)} path={`members.${i}.photo`} />
              <E as="h3" className="fw-h3" path={`members.${i}.name`} value={str(m.name)} />
              <E as="p" className="fw-muted fw-small" path={`members.${i}.role`} value={str(m.role)} />
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Perguntas frequentes em acordeão',
    category: 'Conversão',
    icon: HelpCircle,
    intent: 'Accessible FAQ accordion (details/summary or ARIA). Also emit FAQPage JSON-LD for SEO.',
    variants: [{ id: 'accordion', label: 'Acordeão' }],
    defaultStyle: { paddingY: 'lg', align: 'center', animation: 'fade' },
    fields: [
      ...headFields,
      { key: 'items', label: 'Perguntas', kind: 'list', itemLabel: 'Pergunta', fields: [{ key: 'q', label: 'Pergunta', kind: 'text' }, { key: 'a', label: 'Resposta', kind: 'textarea' }], newItem: item({ q: 'Nova pergunta?', a: 'Resposta.' }) },
    ],
    defaults: () => ({
      eyebrow: 'FAQ', title: 'Perguntas *frequentes*', subtitle: '',
      items: [
        { q: 'Posso testar antes de assinar?', a: 'Sim! Oferecemos 14 dias grátis em qualquer plano, sem cartão de crédito.' },
        { q: 'Meus dados estão seguros?', a: 'Utilizamos criptografia AES-256, backups diários e estamos em conformidade com a LGPD.' },
        { q: 'Posso cancelar a qualquer momento?', a: 'Claro. Sem multas, sem burocracia — cancele com um clique.' },
        { q: 'Vocês oferecem suporte em português?', a: 'Sim, nosso time de suporte atende 24/7 em português, inglês e espanhol.' },
      ],
    }),
    render: ({ p }) => (
      <>
        <Head p={p} />
        <div className="fw-faq">
          {list(p.items).map((it, i) => (
            <details key={i} open={i === 0}>
              <summary><E path={`items.${i}.q`} value={str(it.q)} /></summary>
              <E as="p" path={`items.${i}.a`} value={str(it.a)} multiline />
            </details>
          ))}
        </div>
      </>
    ),
  },
  {
    type: 'cta',
    label: 'Chamada final',
    description: 'Bloco de conversão de alto impacto',
    category: 'Conversão',
    icon: Megaphone,
    intent: 'High-contrast final call-to-action to convert visitors. One clear primary action.',
    variants: [{ id: 'card', label: 'Card em gradiente' }, { id: 'banner', label: 'Banner largo' }],
    defaultStyle: { paddingY: 'lg', align: 'center', animation: 'zoom' },
    fields: [...headFields, ...btnFields],
    defaults: () => ({
      eyebrow: '', title: 'Pronto para elevar o seu nível?', subtitle: 'Junte-se a milhares de empresas que já transformaram seus resultados.',
      primaryLabel: 'Começar gratuitamente', primaryHref: '#', secondaryLabel: 'Falar com especialista', secondaryHref: '#',
    }),
    render: ({ s, p }) => s.variant === 'banner'
      ? (<><Head p={p} /><Actions p={p} /></>)
      : (
        <div className="fw-cta-card">
          <div style={{ position: 'relative', zIndex: 1 }}><Head p={p} /><div style={{ marginTop: -30 }}><Actions p={p} /></div></div>
        </div>
      ),
  },
  {
    type: 'contact',
    label: 'Contato',
    description: 'Formulário e informações de contato',
    category: 'Conversão',
    icon: Mail,
    intent: 'Contact section with validated form (name, email, message), success/error states and contact details.',
    variants: [{ id: 'split', label: 'Dividido' }],
    defaultStyle: { paddingY: 'lg', align: 'left', animation: 'slide-up' },
    fields: [
      ...headFields,
      { key: 'email', label: 'E-mail', kind: 'text' },
      { key: 'phone', label: 'Telefone', kind: 'text' },
      { key: 'address', label: 'Endereço', kind: 'text' },
      { key: 'button', label: 'Botão do formulário', kind: 'text' },
    ],
    defaults: () => ({
      eyebrow: 'Contato', title: 'Vamos construir algo *extraordinário*', subtitle: 'Conte sobre o seu projeto. Respondemos em até 24 horas úteis.',
      email: 'contato@aurora.com', phone: '+55 11 4000-0000', address: 'Av. Paulista, 1000 — São Paulo', button: 'Enviar mensagem',
    }),
    render: ({ p }) => (
      <div className="fw-split">
        <div>
          <Head p={p} />
          {(['email', 'phone', 'address'] as const).map((k) => str(p[k]) && (
            <div className="fw-contact-item" key={k}>
              <div className="fw-icon"><SiteIcon name={k === 'email' ? 'mail' : k === 'phone' ? 'phone' : 'pin'} /></div>
              <E path={k} value={str(p[k])} />
            </div>
          ))}
        </div>
        <form className="fw-card fw-form" onSubmit={(e) => e.preventDefault()}>
          <input className="fw-input" placeholder="Seu nome" aria-label="Nome" />
          <input className="fw-input" placeholder="Seu e-mail" type="email" aria-label="E-mail" />
          <textarea className="fw-input" placeholder="Como podemos ajudar?" aria-label="Mensagem" />
          <button className="fw-btn fw-btn-primary" type="submit"><E path="button" value={str(p.button)} /></button>
        </form>
      </div>
    ),
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    description: 'Captura de e-mails',
    category: 'Conversão',
    icon: Send,
    intent: 'Email capture form with inline validation, privacy note and success state. Integrate with the chosen email provider.',
    variants: [{ id: 'inline', label: 'Inline' }],
    defaultStyle: { paddingY: 'lg', align: 'center', background: 'surface', animation: 'fade' },
    fields: [...headFields, { key: 'button', label: 'Botão', kind: 'text' }, { key: 'note', label: 'Nota', kind: 'text' }],
    defaults: () => ({
      eyebrow: 'Newsletter', title: 'Insights que valem *ouro*', subtitle: 'Receba toda semana as melhores estratégias de crescimento. Sem spam.',
      button: 'Inscrever-se', note: 'Respeitamos sua privacidade. Cancele quando quiser.',
    }),
    render: ({ p }) => (
      <>
        <Head p={p} />
        <form className="fw-inline-form" onSubmit={(e) => e.preventDefault()} style={{ marginTop: -24 }}>
          <input className="fw-input" type="email" placeholder="seu@email.com" aria-label="E-mail" />
          <button className="fw-btn fw-btn-primary" type="submit"><E path="button" value={str(p.button)} /></button>
        </form>
        {str(p.note) && <E as="p" className="fw-muted fw-small" path="note" value={str(p.note)} />}
      </>
    ),
  },
  {
    type: 'custom',
    label: 'Bloco personalizado',
    description: 'Descreva qualquer seção — o Claude Code constrói',
    category: 'Conteúdo',
    icon: Puzzle,
    intent: 'Custom block described by the author (see the "spec" field). Build exactly what it describes, consistent with the design system; the static layout here is only a placeholder.',
    variants: [{ id: 'text', label: 'Texto livre' }, { id: 'split', label: 'Com mídia' }, { id: 'cards', label: 'Cards' }],
    defaultStyle: { paddingY: 'lg', align: 'center', animation: 'fade' },
    fields: [
      { key: 'spec', label: 'O que este bloco deve ser?', kind: 'textarea', placeholder: 'Ex.: calculadora de economia com slider de funcionários e resultado em reais; mapa interativo das lojas; linha do tempo da empresa…' },
      ...headFields,
      { key: 'image', label: 'Imagem', kind: 'image' },
      { key: 'imageAlt', label: 'Texto alternativo da imagem', kind: 'text' },
      { key: 'items', label: 'Cards', kind: 'list', itemLabel: 'Card', fields: [{ key: 'icon', label: 'Ícone', kind: 'icon' }, { key: 'title', label: 'Título', kind: 'text' }, { key: 'text', label: 'Texto', kind: 'textarea' }], newItem: item({ icon: 'sparkles', title: 'Item', text: 'Descrição curta.' }) },
      ...btnFields,
    ],
    defaults: () => ({
      spec: '',
      eyebrow: 'Sob medida',
      title: 'Um bloco *do seu jeito*',
      subtitle: 'Descreva no inspetor o que este bloco deve fazer — interações, dados, integrações. O Claude Code constrói a partir da sua descrição.',
      image: '', imageAlt: '',
      items: [
        { icon: 'sparkles', title: 'Primeiro item', text: 'Descrição curta.' },
        { icon: 'zap', title: 'Segundo item', text: 'Descrição curta.' },
        { icon: 'target', title: 'Terceiro item', text: 'Descrição curta.' },
      ],
      primaryLabel: '', primaryHref: '', secondaryLabel: '', secondaryHref: '',
    }),
    render: ({ s, p }) => {
      const spec = str(p.spec).trim();
      const body = s.variant === 'split' ? (
        <div className="fw-split" style={{ textAlign: 'left' }}>
          <div><Head p={p} /><Actions p={p} /></div>
          <Media src={str(p.image)} alt={str(p.imageAlt)} path="image" />
        </div>
      ) : s.variant === 'cards' ? (
        <>
          <Head p={p} />
          <div className="fw-grid fw-cols-3" style={{ textAlign: 'left' }}>
            {list(p.items).map((it, i) => (
              <div className="fw-card" key={i}>
                <div className="fw-icon"><SiteIcon name={str(it.icon)} /></div>
                <E as="h3" className="fw-h3" path={`items.${i}.title`} value={str(it.title)} />
                <E as="p" className="fw-muted" path={`items.${i}.text`} value={str(it.text)} multiline />
              </div>
            ))}
          </div>
          <Actions p={p} />
        </>
      ) : (<><Head p={p} /><Actions p={p} /></>);
      return (
        <>
          {body}
          <CustomSpecNote spec={spec} />
        </>
      );
    },
  },
  {
    type: 'footer',
    label: 'Rodapé',
    description: 'Rodapé com colunas de links e redes',
    category: 'Rodapé',
    icon: PanelBottom,
    intent: 'Site footer with brand blurb, link columns, social links, legal links and copyright.',
    variants: [{ id: 'columns', label: 'Colunas' }, { id: 'simple', label: 'Simples' }],
    defaultStyle: { paddingY: 'md', background: 'dark', animation: 'none' },
    fields: [
      { key: 'brand', label: 'Marca', kind: 'text' },
      { key: 'blurb', label: 'Descrição', kind: 'textarea' },
      { key: 'columns', label: 'Colunas', kind: 'list', itemLabel: 'Coluna', fields: [{ key: 'title', label: 'Título', kind: 'text' }, { key: 'links', label: 'Links (1 por linha)', kind: 'textarea' }], newItem: item({ title: 'Coluna', links: 'Link 1\nLink 2' }) },
      { key: 'socials', label: 'Redes sociais', kind: 'list', itemLabel: 'Rede', fields: [{ key: 'icon', label: 'Ícone', kind: 'icon' }, { key: 'href', label: 'URL', kind: 'url' }], newItem: item({ icon: 'instagram', href: '#' }) },
      { key: 'copyright', label: 'Copyright', kind: 'text' },
    ],
    defaults: () => ({
      brand: 'Aurora',
      blurb: 'A plataforma que transforma ambição em resultados extraordinários.',
      columns: [
        { title: 'Produto', links: 'Recursos\nPreços\nIntegrações\nNovidades' },
        { title: 'Empresa', links: 'Sobre\nCarreiras\nBlog\nImprensa' },
        { title: 'Legal', links: 'Privacidade\nTermos\nLGPD\nCookies' },
      ],
      socials: [{ icon: 'twitter', href: '#' }, { icon: 'linkedin', href: '#' }, { icon: 'instagram', href: '#' }, { icon: 'github', href: '#' }],
      copyright: `© ${new Date().getFullYear()} Aurora Inc. Todos os direitos reservados.`,
    }),
    render: ({ s, p }) => {
      const socials = (
        <div className="fw-socials">
          {list(p.socials).map((so, i) => (<a key={i} href={str(so.href)} aria-label={str(so.icon)}><SiteIcon name={str(so.icon)} /></a>))}
        </div>
      );
      return (
        <div className={`fw-container fw-w-${s.style.maxWidth}`}>
          {s.variant !== 'simple' && (
            <div className="fw-footer-grid">
              <div>
                <div className="fw-logo" style={{ marginBottom: 14 }}><span className="fw-logo-mark">{str(p.brand).slice(0, 1)}</span><E path="brand" value={str(p.brand)} /></div>
                <E as="p" className="fw-muted fw-small" path="blurb" value={str(p.blurb)} multiline />
              </div>
              {list(p.columns).map((c, i) => (
                <div key={i}>
                  <E as="h4" path={`columns.${i}.title`} value={str(c.title)} />
                  <ul>{str(c.links).split('\n').filter(Boolean).map((l, j) => (<li key={j}><a href="#">{l}</a></li>))}</ul>
                </div>
              ))}
            </div>
          )}
          <div className="fw-footer-bottom" style={s.variant === 'simple' ? { marginTop: 0, borderTop: 0, paddingTop: 0, alignItems: 'center' } : undefined}>
            <E className="fw-muted" path="copyright" value={str(p.copyright)} />
            {socials}
          </div>
        </div>
      );
    },
  },
];

export const SECTION_MAP: Record<SectionType, SectionDef> = Object.fromEntries(SECTIONS.map((d) => [d.type, d])) as Record<SectionType, SectionDef>;
export const CATEGORIES: Category[] = ['Navegação', 'Topo', 'Conteúdo', 'Prova social', 'Conversão', 'Rodapé'];
