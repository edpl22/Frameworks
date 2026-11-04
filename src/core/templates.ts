import type { Brief, Page, Project, Props, PropValue, SectionStyle, SectionType, Theme } from './types';
import { createPage, createSection, DEFAULT_BRIEF, uid } from './factory';
import { DEFAULT_THEME, THEME_PRESETS } from './theme';
import { elId, type CanvasEl } from './canvas';
import { THEMED_TEMPLATES } from './templatesThemed';

// ─── Template catalog ───────────────────────────────────────────
// Original layouts that follow the most popular website-kit categories and
// visual trends from design communities (bento grids, glassmorphism,
// neo-brutalism, Swiss minimalism, editorial…). Each template ships its own
// copy, theme preset, brief and — when useful — multiple pages.

export type TemplateCategory =
  | 'Temáticos'
  | 'SaaS & Tech'
  | 'Portfólio & Agência'
  | 'Negócios locais'
  | 'E-commerce & Marca'
  | 'Eventos & Educação'
  | 'Institucional'
  | 'Mobile'
  | 'Básico';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Temáticos', 'SaaS & Tech', 'Portfólio & Agência', 'E-commerce & Marca', 'Negócios locais', 'Eventos & Educação', 'Institucional', 'Mobile', 'Básico',
];

type Entry = SectionType | { t: SectionType; v?: string; style?: Partial<SectionStyle>; props?: Props; name?: string; notes?: string };

export interface TemplatePage {
  name: string;
  slug: string;
  seoDescription?: string;
  sections: Entry[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Visual style tags (design trends) shown in the gallery. */
  tags: string[];
  preset: string;
  brief: Partial<Brief>;
  pages: TemplatePage[];
  /** Built from free-form sections: opens straight into the Canvas editor. */
  mode?: 'canvas';
}

// ─── content helpers ────────────────────────────────────────────
const f = (icon: string, title: string, text: string) => ({ icon, title, text });
const qa = (q: string, a: string) => ({ q, a });
const tm = (quote: string, name: string, role: string) => ({ quote, name, role, avatar: '' });
const plan = (name: string, price: string, period: string, description: string, features: string[], cta: string, featured = false) =>
  ({ name, price, period, description, features: features.join('\n'), cta, featured });
const imgs = (...captions: string[]) => captions.map((caption) => ({ src: '', caption }));
const people = (...list: [string, string][]) => list.map(([name, role]) => ({ name, role, photo: '' }));
const stats = (...list: [string, string][]) => list.map(([value, label]) => ({ value, label }));
const bullets = (...list: string[]) => list.map((text) => ({ text }));
const logos = (...list: [string, string][]) => list.map(([name, icon]) => ({ name, icon }));
const links = (...list: [string, string][]) => list.map(([label, href]) => ({ label, href }));
const cols = (...list: [string, string[]][]) => list.map(([title, l]) => ({ title, links: l.join('\n') }));
const nav = (l: [string, string][], ctaLabel: string, ctaHref = '#'): Entry => ({ t: 'navbar', props: { links: links(...l), ctaLabel, ctaHref } });
const footer = (blurb: string, c: [string, string[]][], v = 'columns', style?: Partial<SectionStyle>): Entry => ({ t: 'footer', v, style, props: { blurb, columns: cols(...c) } });

// ─── catalog ────────────────────────────────────────────────────
const BASE_TEMPLATES: Template[] = [
  // ══ SaaS & Tech ═══════════════════════════════════════════════
  {
    id: 'saas',
    name: 'SaaS Premium',
    description: 'Landing de produto com mockup, bento, preços e FAQ',
    category: 'SaaS & Tech',
    tags: ['Dark mode', 'Bento grid', 'Gradiente mesh'],
    preset: 'midnight',
    brief: { industry: 'SaaS / Tecnologia' },
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', 'hero', 'logos', { t: 'features', v: 'bento' }, 'stats', 'content', 'testimonials', 'pricing', 'faq', 'cta', 'footer'] }],
  },
  {
    id: 'ai',
    name: 'IA Copilot',
    description: 'Startup de IA com glassmorphism, bento e prova social',
    category: 'SaaS & Tech',
    tags: ['Glassmorphism', 'Dark mode', 'Bento grid'],
    preset: 'glass',
    brief: { projectName: 'Nexa AI', tagline: 'O copiloto de IA para operações', industry: 'Inteligência Artificial', tone: ['Inovador', 'Confiante', 'Técnico'], audience: 'Times de operações, suporte e vendas de empresas médias e grandes.', goal: 'Gerar demos agendadas e cadastros no trial.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Produto', '#'], ['Casos de uso', '#'], ['Segurança', '#'], ['Preços', '#']], 'Agendar demo'),
        { t: 'hero', props: { badgeTag: 'Beta', badge: 'Agentes autônomos agora em todos os planos', title: 'Sua operação no *piloto automático*', subtitle: 'Nexa conecta seus sistemas, entende contexto e executa tarefas de ponta a ponta — com supervisão humana quando importa.', primaryLabel: 'Testar grátis por 14 dias', secondaryLabel: 'Ver o agente em ação', proof: 'Usado por +3.000 equipes em 40 países' } },
        { t: 'logos', props: { label: 'INTEGRA NATIVAMENTE COM', logos: logos(['Slack', 'message'], ['Notion', 'layers'], ['HubSpot', 'target'], ['Zendesk', 'heart'], ['Postgres', 'database'], ['Stripe', 'gem']) } },
        { t: 'features', v: 'bento', props: { eyebrow: 'Plataforma', title: 'Inteligência que *entende o seu negócio*', subtitle: 'Modelos de linguagem orquestrados com seus dados, suas regras e seu tom de voz.', items: [f('wand', 'Agentes que executam', 'Crie agentes que leem tickets, consultam o CRM e respondem clientes sem intervenção.'), f('database', 'RAG sobre seus dados', 'Indexação contínua de documentos, wikis e bancos com permissões herdadas.'), f('shield', 'Guardrails enterprise', 'PII mascarada, auditoria completa e políticas por equipe.'), f('workflow', 'Fluxos visuais', 'Combine IA, aprovações humanas e automações em um canvas no-code.'), f('chart', 'Observabilidade', 'Custos, latência e qualidade de cada resposta em tempo real.'), f('globe', '30+ idiomas', 'Atendimento global com tradução e adaptação cultural automáticas.')] } },
        { t: 'stats', v: 'bar', props: { items: stats(['72%', 'tickets resolvidos sem humanos'], ['4,1s', 'tempo médio de resposta'], ['-38%', 'custo operacional'], ['99,95%', 'disponibilidade']) } },
        { t: 'content', props: { eyebrow: 'Como funciona', title: 'Do prompt à *produção* em uma tarde', subtitle: 'Conecte suas fontes, descreva a tarefa em linguagem natural e publique com testes automáticos.', bullets: bullets('Conectores para 120+ ferramentas', 'Avaliações automáticas antes de cada deploy', 'Rollback em um clique'), primaryLabel: 'Ver documentação', showMockup: true } },
        { t: 'testimonials', props: { eyebrow: 'Clientes', title: 'Resultados que *aparecem no P&L*', items: [tm('Em 60 dias o Nexa assumiu 70% do nosso suporte nível 1. O time agora cuida só do que é estratégico.', 'Juliana Prado', 'VP de CX, Orbis'), tm('A camada de governança foi o que convenceu nosso jurídico. Implantação impecável.', 'Thiago Mendes', 'CIO, Lumina Saúde'), tm('Ferramenta mais rápida de colocar em produção que já testamos — e a mais bonita.', 'Ana Ribeiro', 'Head de Ops, Kora')] } },
        { t: 'pricing', props: { eyebrow: 'Preços', title: 'Pague pelo *valor entregue*', subtitle: 'Sem taxa de implantação. Cancele quando quiser.', plans: [plan('Starter', 'R$ 0', '/mês', 'Para experimentar.', ['1 agente', '500 execuções/mês', 'Conectores essenciais'], 'Começar grátis'), plan('Growth', 'R$ 890', '/mês', 'Para equipes em escala.', ['10 agentes', '25 mil execuções/mês', 'RAG ilimitado', 'Avaliações automáticas'], 'Assinar Growth', true), plan('Enterprise', 'Sob consulta', '', 'Para operações críticas.', ['SSO, SCIM e auditoria', 'Deploy em VPC', 'SLA 99,95%', 'Engenheiro dedicado'], 'Falar com vendas')] } },
        { t: 'faq', props: { items: [qa('Meus dados são usados para treinar modelos?', 'Nunca. Seus dados ficam isolados no seu workspace e podem ser hospedados na sua própria nuvem.'), qa('Quanto tempo leva a implantação?', 'A maioria dos clientes publica o primeiro agente em menos de uma semana.'), qa('Funciona com nossos sistemas legados?', 'Sim — via API, banco de dados ou automação de navegador com aprovação humana.')] } },
        { t: 'cta', props: { title: 'Coloque seu primeiro agente no ar *hoje*', subtitle: '14 dias grátis, sem cartão de crédito.', primaryLabel: 'Começar agora', secondaryLabel: 'Agendar demo' } },
        footer('Agentes de IA seguros para operações que não podem parar.', [['Produto', ['Agentes', 'RAG', 'Fluxos', 'Preços']], ['Recursos', ['Docs', 'API', 'Status', 'Changelog']], ['Empresa', ['Sobre', 'Segurança', 'Carreiras', 'Contato']]]),
      ],
    }],
  },
  {
    id: 'fintech',
    name: 'Banco Digital',
    description: 'Fintech com hero dividido, métricas e depoimento em destaque',
    category: 'SaaS & Tech',
    tags: ['Dark mode', 'Corporativo', 'Gradiente mesh'],
    preset: 'emerald',
    brief: { projectName: 'Verde Bank', tagline: 'A conta PJ que trabalha por você', industry: 'Fintech / Serviços financeiros', tone: ['Confiante', 'Direto', 'Moderno'], audience: 'Pequenas e médias empresas e profissionais autônomos.', goal: 'Aumentar aberturas de conta PJ.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Conta PJ', '#'], ['Cartões', '#'], ['Investimentos', '#'], ['Ajuda', '#']], 'Abrir conta'),
        { t: 'hero', v: 'split', style: { align: 'left' }, props: { badgeTag: '0%', badge: 'Zero tarifa de manutenção, para sempre', title: 'Seu dinheiro *rende mais* enquanto você empreende', subtitle: 'Conta PJ digital com rendimento automático de 102% do CDI, cartão com cashback e Pix ilimitado.', primaryLabel: 'Abrir conta em 5 minutos', secondaryLabel: 'Conhecer tarifas', proof: '+850 mil empresas já abriram conta', showMockup: true } },
        { t: 'logos', props: { label: 'DESTAQUE EM', logos: logos(['Valor', 'trending'], ['Exame', 'chart'], ['InfoMoney', 'gauge'], ['Forbes', 'award'], ['Estadão', 'globe']) } },
        { t: 'features', props: { eyebrow: 'Tudo em um app', title: 'Finanças da empresa, *sem fricção*', columns: '3', items: [f('trending', 'Rendimento automático', 'Saldo parado rende 102% do CDI todo dia útil, sem aplicar nada.'), f('zap', 'Pix e boletos ilimitados', 'Emita cobranças, agende pagamentos e concilie tudo automaticamente.'), f('gem', 'Cartão com cashback', 'Até 1,5% de volta em todas as compras corporativas.'), f('users', 'Multiusuário', 'Permissões por colaborador, aprovações e limites por cartão.'), f('chart', 'Gestão de caixa', 'Fluxo de caixa projetado e categorização com IA.'), f('lock', 'Segurança bancária', 'Regulado pelo Banco Central e protegido pelo FGC.')] } },
        { t: 'stats', props: { items: stats(['R$ 12 bi', 'transacionados por mês'], ['4,8★', 'na App Store'], ['850 mil', 'empresas clientes'], ['24/7', 'suporte humano']) } },
        { t: 'content', v: 'image-left', props: { eyebrow: 'Crédito inteligente', title: 'Capital de giro *aprovado em minutos*', subtitle: 'Análise baseada no seu faturamento real, sem papelada e com taxas a partir de 1,2% a.m.', bullets: bullets('Limite pré-aprovado no app', 'Parcelamento em até 24x', 'Antecipação de recebíveis'), primaryLabel: 'Simular crédito', showMockup: true } },
        { t: 'testimonials', v: 'highlight', props: { eyebrow: 'Quem usa recomenda', items: [tm('Troquei três bancos pelo Verde. Economizo R$ 1.400 por mês em tarifas e o rendimento paga a folha de um estagiário.', 'Carolina Duarte', 'Fundadora, Estúdio Duarte')] } },
        { t: 'faq', props: { items: [qa('Quem pode abrir conta?', 'MEI, ME, EPP e LTDA com CNPJ ativo. A abertura é 100% digital.'), qa('Existe alguma tarifa?', 'Não há mensalidade. Apenas saques em espécie acima de 4 por mês são cobrados.'), qa('Meu dinheiro está protegido?', 'Sim. Somos uma instituição autorizada pelo Banco Central e os depósitos são cobertos pelo FGC.')] } },
        { t: 'cta', props: { title: 'Abra sua conta PJ *agora*', subtitle: 'Leva menos de 5 minutos. Sem burocracia.', primaryLabel: 'Abrir conta grátis', secondaryLabel: 'Falar com especialista' } },
        footer('Conta digital para empresas que crescem.', [['Produtos', ['Conta PJ', 'Cartões', 'Crédito', 'Investimentos']], ['Ajuda', ['Central de ajuda', 'Tarifas', 'Ouvidoria', 'Segurança']], ['Legal', ['Privacidade', 'Termos', 'LGPD', 'Relação com investidores']]]),
      ],
    }],
  },
  {
    id: 'startup',
    name: 'Startup Tech',
    description: 'Hero dividido, recursos em grid e newsletter',
    category: 'SaaS & Tech',
    tags: ['Dark mode', 'Neon'],
    preset: 'neon',
    brief: { industry: 'Tecnologia / IA', tone: ['Inovador', 'Técnico', 'Direto'] },
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', { t: 'hero', v: 'split' }, 'logos', 'features', { t: 'stats', v: 'bar' }, 'content', 'pricing', 'newsletter', 'footer'] }],
  },
  {
    id: 'web3',
    name: 'Web3 Protocol',
    description: 'Protocolo cripto com tipografia display, métricas on-chain e time',
    category: 'SaaS & Tech',
    tags: ['Dark mode', 'Glassmorphism', 'Neon'],
    preset: 'cyber',
    brief: { projectName: 'Nebula Protocol', tagline: 'Liquidez descentralizada entre redes', industry: 'Web3 / DeFi', tone: ['Inovador', 'Técnico', 'Ousado'], audience: 'Traders, desenvolvedores e DAOs.', goal: 'Atrair liquidez e desenvolvedores para o protocolo.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Protocolo', '#'], ['Ecossistema', '#'], ['Governança', '#'], ['Docs', '#']], 'Abrir app'),
        { t: 'hero', props: { badgeTag: 'v2', badge: 'Mainnet ao vivo em 6 redes', title: 'Liquidez *sem fronteiras*', subtitle: 'Troque, empreste e faça bridge de ativos entre redes com uma única assinatura e taxas próximas de zero.', primaryLabel: 'Abrir app', secondaryLabel: 'Ler whitepaper', proof: 'Auditado por 3 empresas independentes', showMockup: false } },
        { t: 'stats', v: 'bar', props: { items: stats(['$1,8 bi', 'TVL'], ['$42 bi', 'volume acumulado'], ['310 mil', 'carteiras ativas'], ['6', 'redes suportadas']) } },
        { t: 'features', v: 'bento', props: { eyebrow: 'Protocolo', title: 'Construído para a *próxima geração*', items: [f('infinity', 'Swaps cross-chain', 'Roteamento inteligente encontra o melhor preço em todas as redes em uma transação.'), f('lock', 'Segurança verificável', 'Contratos imutáveis, verificação formal e bug bounty de $2M.'), f('zap', 'Gas abstraído', 'Pague taxas em qualquer token — ou deixe o relayer pagar por você.'), f('users', 'Governança on-chain', 'Holders do token decidem parâmetros e tesouraria.'), f('code', 'SDK aberto', 'Integre liquidez no seu dApp com 10 linhas de código.')] } },
        { t: 'content', props: { eyebrow: 'Para desenvolvedores', title: 'Componha sobre *liquidez profunda*', subtitle: 'SDKs em TypeScript e Rust, subgraphs públicos e ambiente de testes com fork da mainnet.', bullets: bullets('Licença MIT', 'Grants de até $100k', 'Hackathons trimestrais'), primaryLabel: 'Ler a documentação', showMockup: true } },
        { t: 'team', props: { eyebrow: 'Core contributors', title: 'Mantido por *builders*', members: people(['Rin Takahashi', 'Protocol Lead'], ['Marco Vieira', 'Smart Contracts'], ['Ada Okafor', 'Research'], ['Leo Haas', 'DevRel']) } },
        { t: 'faq', props: { items: [qa('O protocolo é custodial?', 'Não. Você mantém a custódia dos seus ativos o tempo todo.'), qa('Quais carteiras são suportadas?', 'Qualquer carteira compatível com WalletConnect, além de carteiras de contrato inteligente.'), qa('Onde estão as auditorias?', 'Todos os relatórios estão publicados na documentação e no GitHub.')] } },
        { t: 'newsletter', props: { eyebrow: 'Comunidade', title: 'Fique *on-chain* com a gente', subtitle: 'Atualizações de governança, novas redes e oportunidades de grants.', button: 'Assinar' } },
        footer('Infraestrutura de liquidez aberta e descentralizada.', [['Protocolo', ['App', 'Docs', 'Auditorias', 'Bug bounty']], ['Comunidade', ['Discord', 'Fórum', 'Governança', 'Blog']], ['Recursos', ['Brand kit', 'Whitepaper', 'Status', 'Contato']]]),
      ],
    }],
  },
  {
    id: 'waitlist',
    name: 'Lançamento / Waitlist',
    description: 'Página única minimalista para capturar a lista de espera',
    category: 'SaaS & Tech',
    tags: ['Minimal', 'Dark mode', 'Gradiente mesh'],
    preset: 'midnight',
    brief: { projectName: 'Lumen', tagline: 'Em breve: o editor de notas que pensa com você', industry: 'Produtividade', tone: ['Minimalista', 'Elegante', 'Inovador'], goal: 'Capturar e-mails para a lista de espera antes do lançamento.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        { t: 'navbar', props: { links: [], ctaLabel: 'Entrar na lista' } },
        { t: 'hero', v: 'minimal', style: { paddingY: 'xl' }, props: { badgeTag: 'Em breve', badge: 'Acesso antecipado abre em março', title: 'Pense melhor. *Escreva menos.*', subtitle: 'Lumen conecta suas notas, sugere ideias e transforma rascunhos em documentos prontos — offline e privado.', primaryLabel: 'Garantir meu acesso', secondaryLabel: '', proof: '12.430 pessoas na lista' } },
        { t: 'features', props: { eyebrow: '', title: '', subtitle: '', columns: '3', items: [f('sparkles', 'Escrita assistida', 'Sugestões contextuais que respeitam sua voz.'), f('layers', 'Notas conectadas', 'Grafo automático entre ideias, pessoas e projetos.'), f('lock', 'Privado por padrão', 'Criptografia local e sincronização ponta a ponta.')] } },
        { t: 'newsletter', style: { background: 'default' }, props: { eyebrow: 'Lista de espera', title: 'Seja um dos *primeiros*', subtitle: 'Os 1.000 primeiros ganham 1 ano do plano Pro.', button: 'Entrar na lista', note: 'Só enviaremos o convite. Nada de spam.' } },
        footer('', [], 'simple', { background: 'default', divider: true }),
      ],
    }],
  },

  // ══ Portfólio & Agência ═══════════════════════════════════════
  {
    id: 'agency',
    name: 'Agência Criativa',
    description: 'Agência multi-página: portfólio masonry, equipe e contato',
    category: 'Portfólio & Agência',
    tags: ['Minimal', 'Monocromático', 'Multi-página'],
    preset: 'mono',
    brief: { projectName: 'Studio Norte', tagline: 'Marcas e produtos digitais que marcam época', industry: 'Agência / Design', tone: ['Ousado', 'Criativo', 'Minimalista'], goal: 'Atrair clientes de alto valor para projetos de branding e produto.' },
    pages: [
      {
        name: 'Início', slug: '/', sections: [
          nav([['Início', '/'], ['Projetos', '/projetos'], ['Contato', '/contato']], 'Iniciar projeto', '/contato'),
          { t: 'hero', v: 'minimal', style: { background: 'default', align: 'left', paddingY: 'xl' }, props: { badgeTag: '', badge: '', eyebrow: 'Estúdio independente · São Paulo', title: 'Criamos marcas que *as pessoas lembram*', subtitle: 'Branding, design de produto e sites para empresas que querem liderar a categoria.', primaryLabel: 'Ver projetos', primaryHref: '/projetos', secondaryLabel: 'Fale conosco', secondaryHref: '/contato', proof: '' } },
          { t: 'gallery', v: 'masonry', props: { eyebrow: 'Selecionados', title: 'Trabalhos *recentes*', images: imgs('Kora — Rebrand', 'Orbis — App', 'Mare — E-commerce', 'Helio — Identidade', 'Atlas — Site', 'Fable — Campanha') } },
          { t: 'features', v: 'list', props: { eyebrow: 'Serviços', title: 'Do conceito ao *lançamento*', subtitle: '', items: [f('palette', 'Branding', 'Estratégia, naming, identidade visual e sistemas de marca.'), f('smartphone', 'Design de produto', 'Pesquisa, UX, UI e design systems para apps e plataformas.'), f('code', 'Sites & e-commerce', 'Sites performáticos e lojas que convertem.'), f('camera', 'Conteúdo', 'Direção de arte, fotografia e motion para campanhas.')] } },
          { t: 'testimonials', v: 'highlight', props: { eyebrow: 'Clientes', items: [tm('O Studio Norte entendeu nossa essência melhor do que nós mesmos. O rebrand dobrou nossa base de leads em seis meses.', 'Fernanda Luz', 'CMO, Kora')] } },
          { t: 'cta', v: 'banner', style: { background: 'dark' }, props: { title: 'Tem um projeto em mente?', subtitle: 'Respondemos em até 48 horas.', primaryLabel: 'Vamos conversar', primaryHref: '/contato', secondaryLabel: '' } },
          footer('', [], 'simple'),
        ],
      },
      {
        name: 'Projetos', slug: '/projetos', seoDescription: 'Portfólio de branding, produto e sites do Studio Norte.', sections: [
          nav([['Início', '/'], ['Projetos', '/projetos'], ['Contato', '/contato']], 'Iniciar projeto', '/contato'),
          { t: 'hero', v: 'minimal', style: { background: 'default', align: 'left', paddingY: 'lg' }, props: { badgeTag: '', badge: '', eyebrow: 'Portfólio', title: 'Projetos', subtitle: 'Uma seleção de trabalhos de branding, produto e digital dos últimos anos.', primaryLabel: '', secondaryLabel: '', proof: '' } },
          { t: 'gallery', v: 'grid', props: { eyebrow: '', title: '', subtitle: '', images: imgs('Kora', 'Orbis', 'Mare', 'Helio', 'Atlas', 'Fable', 'Nimbus', 'Pulse', 'Verso') } },
          { t: 'stats', v: 'bar', props: { items: stats(['12', 'anos de estúdio'], ['180+', 'marcas lançadas'], ['34', 'prêmios'], ['9', 'países']) } },
          footer('', [], 'simple'),
        ],
      },
      {
        name: 'Contato', slug: '/contato', seoDescription: 'Fale com o Studio Norte sobre o seu projeto.', sections: [
          nav([['Início', '/'], ['Projetos', '/projetos'], ['Contato', '/contato']], 'Iniciar projeto', '/contato'),
          { t: 'contact', style: { paddingY: 'xl' }, props: { eyebrow: 'Contato', title: 'Vamos criar algo *memorável*', subtitle: 'Conte sobre o seu desafio, prazo e orçamento estimado.', email: 'ola@studionorte.com', phone: '+55 11 3000-0000', address: 'Rua Augusta, 1500 — São Paulo', button: 'Enviar briefing' } },
          { t: 'team', props: { eyebrow: 'Estúdio', title: 'Quem vai *cuidar do seu projeto*', members: people(['Bia Torres', 'Direção criativa'], ['Caio Nunes', 'Design de produto'], ['Lara Kim', 'Estratégia'], ['Tomás Reis', 'Tecnologia']) } },
          footer('', [], 'simple'),
        ],
      },
    ],
  },
  {
    id: 'portfolio',
    name: 'Portfólio Designer',
    description: 'Portfólio pessoal estilo suíço com grid editorial',
    category: 'Portfólio & Agência',
    tags: ['Minimal suíço', 'Editorial'],
    preset: 'swiss',
    brief: { projectName: 'Lia Moreno', tagline: 'Product designer independente', industry: 'Portfólio pessoal', tone: ['Minimalista', 'Sofisticado', 'Direto'], audience: 'Startups e times de produto procurando designers sêniores.', goal: 'Conseguir novos projetos freelance e convites de trabalho.', features: ['SEO técnico completo', 'Animações on-scroll'] },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Trabalhos', '#'], ['Sobre', '#'], ['Contato', '#']], 'Baixar CV'),
        { t: 'hero', v: 'minimal', style: { background: 'default', align: 'left', paddingY: 'xl', maxWidth: 'wide' }, props: { badgeTag: '', badge: '', eyebrow: 'Product designer — Lisboa / Remoto', title: 'Desenho produtos *simples* para problemas complexos.', subtitle: 'Dez anos criando interfaces para fintechs, saúde e ferramentas B2B. Atualmente disponível para projetos a partir de abril.', primaryLabel: 'Ver trabalhos', secondaryLabel: 'lia@moreno.design', proof: '' } },
        { t: 'gallery', v: 'masonry', style: { maxWidth: 'wide', align: 'left' }, props: { eyebrow: '01 — Trabalhos', title: 'Selecionados', images: imgs('Banco Aurora · App', 'Medi · Plataforma clínica', 'Rota · Design system', 'Kite · Onboarding', 'Pulse · Dashboard', 'Tessera · Marca') } },
        { t: 'stats', v: 'bar', style: { maxWidth: 'wide' }, props: { items: stats(['10', 'anos de experiência'], ['60+', 'produtos lançados'], ['8', 'prêmios de design'], ['3', 'países']) } },
        { t: 'content', v: 'image-left', style: { maxWidth: 'wide' }, props: { eyebrow: '02 — Sobre', title: 'Design como *ferramenta de negócio*', subtitle: 'Acredito em pesquisa contínua, protótipos rápidos e sistemas que escalam. Trabalho lado a lado com engenharia do discovery ao lançamento.', bullets: bullets('Ex-lead de design na Rota e na Medi', 'Mentora na ADPList', 'Palestrante em Config e Interaction'), primaryLabel: '', secondaryLabel: '' } },
        { t: 'testimonials', v: 'highlight', style: { background: 'default', divider: true }, props: { eyebrow: '03 — Depoimentos', items: [tm('Lia redesenhou nosso onboarding em três semanas e a ativação subiu 41%. Raro ver tanto rigor com tanto gosto.', 'Pedro Alves', 'CPO, Kite')] } },
        { t: 'contact', style: { maxWidth: 'wide' }, props: { eyebrow: '04 — Contato', title: 'Vamos trabalhar *juntos*', subtitle: 'Conte sobre o produto, o time e o momento da empresa.', email: 'lia@moreno.design', phone: '', address: 'Lisboa, Portugal', button: 'Enviar mensagem' } },
        { t: 'footer', v: 'simple', style: { background: 'default', divider: true }, props: { copyright: `© ${new Date().getFullYear()} Lia Moreno` } },
      ],
    }],
  },
  {
    id: 'brutal',
    name: 'Creator Neo-brutal',
    description: 'Plataforma para criadores com bordas grossas e sombras duras',
    category: 'Portfólio & Agência',
    tags: ['Neo-brutalismo', 'Colorido'],
    preset: 'brutal',
    brief: { projectName: 'Pixel Club', tagline: 'Venda seus produtos digitais em minutos', industry: 'Creator economy', tone: ['Divertido', 'Ousado', 'Direto'], audience: 'Criadores de conteúdo, designers e educadores independentes.', goal: 'Converter visitantes em criadores cadastrados.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Recursos', '#'], ['Criadores', '#'], ['Preços', '#']], 'Criar minha loja'),
        { t: 'hero', style: { background: 'default' }, props: { badgeTag: 'Novo', badge: 'Assinaturas e comunidades chegaram', title: 'Transforme o que você sabe em *renda*', subtitle: 'Venda e-books, cursos, presets e assinaturas com checkout pronto, sem código e sem mensalidade.', primaryLabel: 'Começar grátis', secondaryLabel: 'Ver exemplos', proof: '+40 mil criadores já faturaram R$ 180 mi', showMockup: false } },
        { t: 'features', style: { background: 'surface' }, props: { eyebrow: 'Recursos', title: 'Tudo que um criador *precisa*', columns: '3', items: [f('box', 'Produtos digitais', 'Arquivos, cursos, links e licenças com entrega automática.'), f('heart', 'Assinaturas', 'Receita recorrente com conteúdo exclusivo para membros.'), f('zap', 'Checkout em 1 clique', 'Pix, cartão e boleto com conversão otimizada.'), f('users', 'Comunidade', 'Fóruns e chats privados para seus clientes.'), f('chart', 'Analytics', 'Saiba de onde vêm suas vendas e o que converte.'), f('wand', 'Página pronta', 'Uma vitrine linda gerada a partir do seu perfil.')] } },
        { t: 'stats', props: { items: stats(['R$ 180 mi', 'pagos a criadores'], ['40 mil', 'criadores ativos'], ['0', 'mensalidade'], ['5%', 'taxa por venda']) } },
        { t: 'testimonials', style: { background: 'primary' }, props: { eyebrow: 'Criadores', title: 'Quem usa *não volta*', items: [tm('Lancei meu pack de presets numa sexta e na segunda já tinha pago o aluguel.', 'Duda Rocha', 'Fotógrafa'), tm('A melhor coisa: meus alunos compram em segundos pelo Pix.', 'Marcos Lin', 'Professor de UX'), tm('Simples, bonito e as taxas são justas. Recomendo de olhos fechados.', 'Nina Sol', 'Ilustradora')] } },
        { t: 'pricing', props: { eyebrow: 'Preços', title: 'Simples *de verdade*', subtitle: 'Você só paga quando vende.', plans: [plan('Free', '5%', '/venda', 'Para começar hoje.', ['Produtos ilimitados', 'Checkout Pix e cartão', 'Página de criador'], 'Criar loja grátis'), plan('Pro', 'R$ 49', '/mês', 'Para quem já vende bem.', ['Taxa de 2%', 'Domínio próprio', 'Assinaturas e comunidade', 'Cupons e afiliados'], 'Assinar Pro', true)] } },
        { t: 'faq', props: { items: [qa('Quando recebo meu dinheiro?', 'Vendas por Pix caem em D+1. Cartão em D+14 ou antecipado.'), qa('Preciso de CNPJ?', 'Não. Você pode começar como pessoa física.'), qa('Posso usar meu domínio?', 'Sim, no plano Pro.')] } },
        { t: 'cta', props: { title: 'Sua primeira venda está a *um clique*', subtitle: 'Crie sua loja em 2 minutos.', primaryLabel: 'Começar grátis', secondaryLabel: '' } },
        footer('A loja dos criadores independentes.', [['Produto', ['Recursos', 'Preços', 'Exemplos']], ['Criadores', ['Blog', 'Guias', 'Comunidade']], ['Legal', ['Termos', 'Privacidade', 'Ajuda']]], 'columns', { background: 'default', divider: true }),
      ],
    }],
  },

  // ══ E-commerce & Marca ════════════════════════════════════════
  {
    id: 'ecommerce',
    name: 'Loja / E-commerce',
    description: 'Vitrine de produtos, benefícios, história da marca e newsletter',
    category: 'E-commerce & Marca',
    tags: ['Colorido', 'Moderno'],
    preset: 'sunset',
    brief: { projectName: 'Forma Store', tagline: 'Objetos de design para casas com personalidade', industry: 'E-commerce / Casa e decoração', tone: ['Moderno', 'Acolhedor', 'Criativo'], audience: 'Pessoas de 25 a 45 anos que valorizam design autoral.', goal: 'Aumentar vendas online e a base de e-mails.', features: ['Integração com Stripe', 'Catálogo de produtos com filtros', 'Carrinho e checkout', 'SEO técnico completo'] },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Novidades', '#'], ['Sala', '#'], ['Cozinha', '#'], ['Iluminação', '#']], 'Carrinho (0)'),
        { t: 'hero', v: 'split', style: { background: 'surface', align: 'left' }, props: { badgeTag: '-20%', badge: 'Coleção Verão com frete grátis', title: 'Design que *mora bem*', subtitle: 'Peças autorais feitas por estúdios brasileiros, em pequenas tiragens e com materiais sustentáveis.', primaryLabel: 'Comprar coleção', secondaryLabel: 'Ver lookbook', proof: '4,9★ em 12 mil avaliações', showMockup: false } },
        { t: 'logos', props: { label: 'VISTO EM', logos: logos(['Casa Vogue', 'gem'], ['Elle Deco', 'star'], ['Bamboo', 'leaf'], ['Arc Design', 'box']) } },
        { t: 'gallery', props: { eyebrow: 'Mais vendidos', title: 'Favoritos da *estação*', images: imgs('Luminária Orbe · R$ 489', 'Vaso Duna · R$ 229', 'Poltrona Ripa · R$ 2.890', 'Mesa Lápis · R$ 1.190', 'Manta Trama · R$ 349', 'Espelho Arco · R$ 690') } },
        { t: 'features', style: { background: 'surface' }, props: { eyebrow: '', title: 'Comprar aqui é *tranquilo*', subtitle: '', columns: '4', items: [f('box', 'Frete grátis', 'Acima de R$ 399 para todo o Brasil.'), f('clock', '30 dias para trocar', 'Devolução simples e sem custo.'), f('lock', 'Pagamento seguro', 'Pix com 5% off ou 10x sem juros.'), f('leaf', 'Feito com cuidado', 'Madeira certificada e embalagem compostável.')] } },
        { t: 'content', v: 'image-left', props: { eyebrow: 'Nossa história', title: 'Feito por *gente*, não por fábricas', subtitle: 'Trabalhamos com 40 estúdios e artesãos de 9 estados. Cada peça carrega o nome de quem fez.', bullets: bullets('Pagamento justo a cada produtor', 'Tiragens limitadas e numeradas', 'Garantia de 2 anos'), primaryLabel: 'Conhecer os estúdios' } },
        { t: 'testimonials', props: { eyebrow: 'Avaliações', title: '12 mil clientes *felizes*', items: [tm('A luminária chegou impecável e é ainda mais bonita pessoalmente.', 'Renata C.', 'São Paulo, SP'), tm('Atendimento atencioso e entrega antes do prazo. Já é minha loja favorita.', 'Gustavo M.', 'Curitiba, PR'), tm('Qualidade de peça de galeria com preço justo.', 'Helena B.', 'Recife, PE')] } },
        { t: 'newsletter', props: { eyebrow: 'Clube Forma', title: 'Ganhe *10% off* na primeira compra', subtitle: 'Lançamentos, bastidores e ofertas exclusivas para assinantes.', button: 'Quero meu cupom', note: 'Cancele quando quiser.' } },
        footer('Design autoral brasileiro, do estúdio para a sua casa.', [['Loja', ['Novidades', 'Mais vendidos', 'Presentes', 'Outlet']], ['Ajuda', ['Entregas', 'Trocas', 'Pagamentos', 'Contato']], ['Forma', ['Sobre', 'Estúdios', 'Sustentabilidade', 'Trabalhe conosco']]]),
      ],
    }],
  },
  {
    id: 'brand',
    name: 'Marca de Luxo',
    description: 'Editorial elegante, serifado e espaçoso',
    category: 'E-commerce & Marca',
    tags: ['Editorial', 'Serifado', 'Minimal'],
    preset: 'editorial',
    brief: { projectName: 'Maison Lumière', industry: 'Moda / Luxo', tone: ['Elegante', 'Sofisticado', 'Atemporal'] },
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', { t: 'hero', v: 'split', style: { background: 'surface' } }, { t: 'content', v: 'image-left' }, 'gallery', { t: 'testimonials', v: 'highlight', style: { background: 'default' } }, 'newsletter', 'footer'] }],
  },

  // ══ Negócios locais ═══════════════════════════════════════════
  {
    id: 'restaurant',
    name: 'Restaurante',
    description: 'Restaurante com cardápio em página própria e reservas',
    category: 'Negócios locais',
    tags: ['Serifado', 'Acolhedor', 'Multi-página'],
    preset: 'bistro',
    brief: { projectName: 'Casa Brasa', tagline: 'Cozinha de fogo e estação', industry: 'Gastronomia / Restaurante', tone: ['Acolhedor', 'Sofisticado', 'Atemporal'], audience: 'Moradores e turistas que buscam uma experiência gastronômica autoral.', goal: 'Aumentar reservas online.', features: ['Reservas online (OpenTable / Tagme)', 'Mapa com localização', 'SEO local (Google Business)', 'Formulário de contato funcional'] },
    pages: [
      {
        name: 'Início', slug: '/', sections: [
          nav([['Início', '/'], ['Cardápio', '/cardapio'], ['Reservas', '#']], 'Reservar mesa'),
          { t: 'hero', v: 'split', style: { background: 'surface', align: 'left' }, props: { badgeTag: '★', badge: 'Bib Gourmand 2025', title: 'Fogo, estação e *tempo*', subtitle: 'Cozinha brasileira contemporânea preparada na brasa, com ingredientes de pequenos produtores.', primaryLabel: 'Reservar mesa', secondaryLabel: 'Ver cardápio', secondaryHref: '/cardapio', proof: 'Ter a dom · 19h às 23h30', showMockup: false } },
          { t: 'content', v: 'image-left', props: { eyebrow: 'A casa', title: 'Uma cozinha *sem pressa*', subtitle: 'Nosso menu muda com as estações. Assamos pães todos os dias, defumamos na casa e servimos vinhos naturais de pequenos produtores.', bullets: bullets('Menu degustação em 7 tempos', 'Carta com 120 rótulos naturais', 'Salão para eventos privados'), primaryLabel: 'Conhecer a história' } },
          { t: 'features', v: 'list', style: { background: 'surface' }, props: { eyebrow: 'Da brasa', title: 'Pratos da *estação*', subtitle: '', items: [f('leaf', 'Abóbora assada na brasa — R$ 48', 'Coalhada defumada, castanha-do-pará e mel de cacau.'), f('heart', 'Arroz de pato — R$ 92', 'Pato confitado, tucupi preto e farofa de miúdos.'), f('star', 'Peixe do dia — R$ 118', 'Manteiga de garrafa, pirão e legumes da horta.'), f('coffee', 'Pudim de tapioca — R$ 36', 'Calda de rapadura e sorvete de queijo.')] } },
          { t: 'gallery', props: { eyebrow: 'Ambiente', title: 'Venha *viver* a casa', images: imgs('Salão', 'Cozinha aberta', 'Adega', 'Varanda', 'Chef à mesa', 'Sobremesas') } },
          { t: 'testimonials', v: 'highlight', style: { background: 'default' }, props: { eyebrow: 'Imprensa', items: [tm('Uma das experiências mais honestas e saborosas da cidade. O arroz de pato justifica a viagem.', 'Guia Paladar', 'Crítica gastronômica')] } },
          { t: 'contact', style: { background: 'surface' }, props: { eyebrow: 'Reservas', title: 'Reserve sua *mesa*', subtitle: 'Para grupos acima de 8 pessoas, fale com a gente pelo telefone.', email: 'reservas@casabrasa.com', phone: '+55 11 3333-4444', address: 'Rua dos Pinheiros, 800 — São Paulo', button: 'Solicitar reserva' } },
          footer('Cozinha de fogo e estação desde 2016.', [['Visite', ['Ter a sex · 19h–23h30', 'Sáb e dom · 12h–23h30', 'Rua dos Pinheiros, 800']], ['Casa', ['Cardápio', 'Vinhos', 'Eventos', 'Vale-presente']], ['Contato', ['reservas@casabrasa.com', '+55 11 3333-4444', 'Instagram']]]),
        ],
      },
      {
        name: 'Cardápio', slug: '/cardapio', seoDescription: 'Cardápio sazonal da Casa Brasa: entradas, pratos na brasa e sobremesas.', sections: [
          nav([['Início', '/'], ['Cardápio', '/cardapio'], ['Reservas', '/']], 'Reservar mesa'),
          { t: 'hero', v: 'minimal', style: { background: 'surface', paddingY: 'lg' }, props: { badgeTag: '', badge: '', eyebrow: 'Outono', title: 'Cardápio', subtitle: 'Menu sazonal. Pratos podem variar conforme a disponibilidade dos produtores.', primaryLabel: '', secondaryLabel: '', proof: '' } },
          { t: 'features', v: 'list', props: { eyebrow: 'Entradas', title: 'Para *começar*', subtitle: '', items: [f('leaf', 'Pão da casa — R$ 22', 'Fermentação natural, manteiga de garrafa e flor de sal.'), f('leaf', 'Abóbora na brasa — R$ 48', 'Coalhada defumada e castanha-do-pará.'), f('leaf', 'Tartar de mandioca — R$ 42', 'Gema curada e pimenta-de-cheiro.'), f('leaf', 'Pastel de queijo — R$ 34', 'Canastra e melado de cana.')] } },
          { t: 'features', v: 'list', style: { background: 'surface' }, props: { eyebrow: 'Da brasa', title: 'Principais', subtitle: '', items: [f('heart', 'Arroz de pato — R$ 92', 'Tucupi preto e farofa de miúdos.'), f('heart', 'Costela 12h — R$ 128', 'Purê de mandioquinha e chimichurri de ervas.'), f('heart', 'Peixe do dia — R$ 118', 'Manteiga de garrafa e pirão.'), f('heart', 'Cogumelos na lenha — R$ 86', 'Polenta cremosa e ovo caipira.')] } },
          { t: 'features', v: 'list', props: { eyebrow: 'Doces', title: 'Sobremesas', subtitle: '', items: [f('coffee', 'Pudim de tapioca — R$ 36', 'Calda de rapadura.'), f('coffee', 'Banana na brasa — R$ 32', 'Doce de leite e sorvete de canela.')] } },
          { t: 'cta', props: { title: 'Te esperamos à *mesa*', subtitle: 'Reservas abertas para os próximos 30 dias.', primaryLabel: 'Reservar agora', secondaryLabel: '' } },
          footer('Cozinha de fogo e estação desde 2016.', [['Visite', ['Ter a sex · 19h–23h30', 'Sáb e dom · 12h–23h30']], ['Casa', ['Vinhos', 'Eventos', 'Vale-presente']], ['Contato', ['reservas@casabrasa.com', '+55 11 3333-4444']]]),
        ],
      },
    ],
  },
  {
    id: 'realestate',
    name: 'Imobiliária Premium',
    description: 'Imóveis de alto padrão com vitrine, corretores e contato',
    category: 'Negócios locais',
    tags: ['Editorial', 'Serifado', 'Corporativo'],
    preset: 'estate',
    brief: { projectName: 'Atlas Imóveis', tagline: 'Endereços extraordinários', industry: 'Imobiliário / Alto padrão', tone: ['Sofisticado', 'Elegante', 'Confiante'], audience: 'Compradores e investidores de imóveis acima de R$ 2 milhões.', goal: 'Gerar leads qualificados para visitas.', features: ['Busca de imóveis com filtros', 'Galeria com lightbox', 'Integração com WhatsApp', 'SEO técnico completo'] },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Comprar', '#'], ['Lançamentos', '#'], ['Vender', '#'], ['Sobre', '#']], 'Agendar visita'),
        { t: 'hero', v: 'split', style: { background: 'surface', align: 'left' }, props: { badgeTag: '', badge: '', eyebrow: 'Alto padrão · São Paulo e litoral', title: 'Endereços *extraordinários*', subtitle: 'Curadoria de residências únicas, negociação discreta e acompanhamento jurídico completo.', primaryLabel: 'Ver imóveis', secondaryLabel: 'Avaliar meu imóvel', proof: '', showMockup: false } },
        { t: 'stats', v: 'bar', props: { items: stats(['R$ 3,2 bi', 'em imóveis vendidos'], ['28', 'anos de mercado'], ['640', 'famílias atendidas'], ['42', 'dias até a venda']) } },
        { t: 'gallery', props: { eyebrow: 'Em destaque', title: 'Residências *selecionadas*', images: imgs('Jardim Europa · 4 suítes · R$ 9,8 mi', 'Alto de Pinheiros · 5 suítes · R$ 12 mi', 'Itaim · Cobertura · R$ 7,4 mi', 'Baleia · Pé na areia · R$ 14 mi', 'Cidade Jardim · 4 suítes · R$ 8,2 mi', 'Vila Nova · Garden · R$ 5,6 mi') } },
        { t: 'features', style: { background: 'surface' }, props: { eyebrow: 'Serviços', title: 'Uma experiência *sob medida*', columns: '3', items: [f('target', 'Curadoria', 'Selecionamos apenas imóveis que atendem ao seu perfil.'), f('shield', 'Assessoria jurídica', 'Due diligence completa e contratos revisados.'), f('award', 'Avaliação técnica', 'Laudos com engenheiros e arquitetos parceiros.')] } },
        { t: 'content', props: { eyebrow: 'Para proprietários', title: 'Venda com *discrição* e no tempo certo', subtitle: 'Fotografia de arquitetura, tour 3D e uma rede privada de compradores qualificados.', bullets: bullets('Divulgação off-market opcional', 'Relatórios semanais de visitas', 'Comissão transparente'), primaryLabel: 'Avaliar meu imóvel' } },
        { t: 'team', props: { eyebrow: 'Corretores', title: 'Especialistas em *alto padrão*', members: people(['Ricardo Saad', 'Diretor · CRECI 12345'], ['Isabela Moura', 'Jardins e Itaim'], ['André Kato', 'Litoral Norte'], ['Paula Reis', 'Lançamentos']) } },
        { t: 'testimonials', v: 'highlight', props: { eyebrow: 'Clientes', items: [tm('Encontraram a casa certa em três visitas e cuidaram de cada detalhe da documentação. Profissionalismo raro.', 'Família Albuquerque', 'Jardim Europa')] } },
        { t: 'contact', style: { background: 'surface' }, props: { eyebrow: 'Contato', title: 'Agende uma *visita privada*', subtitle: 'Atendimento com hora marcada, inclusive aos fins de semana.', email: 'contato@atlasimoveis.com', phone: '+55 11 3500-0000', address: 'Av. Brigadeiro Faria Lima, 2000', button: 'Agendar visita' } },
        footer('Imóveis de alto padrão com curadoria e discrição.', [['Imóveis', ['Comprar', 'Lançamentos', 'Litoral', 'Off-market']], ['Proprietários', ['Vender', 'Avaliação', 'Administração']], ['Atlas', ['Sobre', 'Corretores', 'Contato', 'CRECI J-00000']]]),
      ],
    }],
  },
  {
    id: 'clinic',
    name: 'Clínica & Saúde',
    description: 'Clínica com especialidades, corpo médico, FAQ e agendamento',
    category: 'Negócios locais',
    tags: ['Suave', 'Serifado', 'Acolhedor'],
    preset: 'clinic',
    brief: { projectName: 'Vitta Clínica', tagline: 'Cuidado integrado para toda a família', industry: 'Saúde / Clínica médica', tone: ['Acolhedor', 'Confiante', 'Direto'], audience: 'Famílias e adultos de 30 a 60 anos que buscam atendimento particular e por convênio.', goal: 'Aumentar agendamentos online.', features: ['Agendamento (Cal.com)', 'Integração com WhatsApp', 'Banner de cookies LGPD', 'SEO local (Google Business)'] },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Especialidades', '#'], ['Médicos', '#'], ['Convênios', '#'], ['Contato', '#']], 'Agendar consulta'),
        { t: 'hero', v: 'split', style: { background: 'surface', align: 'left' }, props: { badgeTag: 'Novo', badge: 'Telemedicina disponível 7 dias por semana', title: 'Cuidado que *começa pela escuta*', subtitle: 'Consultas, exames e acompanhamento contínuo em um só lugar, com médicos que conhecem a sua história.', primaryLabel: 'Agendar consulta', secondaryLabel: 'Ver convênios', proof: 'Nota 4,9 no Google · 3.200 avaliações', showMockup: false } },
        { t: 'features', props: { eyebrow: 'Especialidades', title: 'Tudo que sua família *precisa*', columns: '3', items: [f('heart', 'Cardiologia', 'Check-up, ecocardiograma e acompanhamento.'), f('users', 'Pediatria', 'Do recém-nascido ao adolescente.'), f('leaf', 'Nutrição', 'Planos alimentares personalizados.'), f('sparkles', 'Dermatologia', 'Clínica e estética com tecnologia atual.'), f('target', 'Ortopedia', 'Coluna, joelho e medicina esportiva.'), f('smartphone', 'Telemedicina', 'Consultas por vídeo com receita digital.')] } },
        { t: 'stats', style: { background: 'surface' }, props: { items: stats(['25 mil', 'pacientes atendidos'], ['40', 'especialistas'], ['15 min', 'espera média'], ['30+', 'convênios']) } },
        { t: 'content', v: 'image-left', props: { eyebrow: 'Nossa clínica', title: 'Estrutura moderna, *atendimento humano*', subtitle: 'Exames no mesmo dia, prontuário digital e um time de enfermagem que acompanha você depois da consulta.', bullets: bullets('Exames laboratoriais e de imagem no local', 'Resultados no app em até 24h', 'Estacionamento e acessibilidade completa'), primaryLabel: 'Conhecer a estrutura' } },
        { t: 'team', props: { eyebrow: 'Corpo clínico', title: 'Médicos que *você confia*', members: people(['Dra. Marina Lopes', 'Cardiologista · CRM 00000'], ['Dr. Felipe Andrade', 'Pediatra · CRM 00000'], ['Dra. Camila Torres', 'Dermatologista · CRM 00000'], ['Dr. Rafael Nunes', 'Ortopedista · CRM 00000']) } },
        { t: 'testimonials', style: { background: 'surface' }, props: { eyebrow: 'Pacientes', title: 'Histórias de *cuidado*', items: [tm('Fui atendida no horário e saí com os exames feitos. Atendimento muito humano.', 'Luciana P.', 'Paciente desde 2021'), tm('O pediatra é paciente e atencioso. Meus filhos adoram vir.', 'Rodrigo S.', 'Pai do Theo e da Lia'), tm('A telemedicina resolveu minha vida durante uma viagem.', 'Amanda R.', 'Paciente')] } },
        { t: 'faq', props: { items: [qa('Quais convênios vocês aceitam?', 'Atendemos mais de 30 convênios, incluindo os principais planos nacionais. Consulte a lista completa.'), qa('Posso agendar pelo WhatsApp?', 'Sim, e também pelo site e pelo app, 24 horas por dia.'), qa('Vocês atendem urgências?', 'Atendemos demandas do mesmo dia. Em emergências, procure um pronto-socorro.')] } },
        { t: 'contact', style: { background: 'surface' }, props: { eyebrow: 'Agendamento', title: 'Marque sua *consulta*', subtitle: 'Retornamos em até 1 hora no horário comercial.', email: 'agenda@vittaclinica.com', phone: '+55 11 4002-8922', address: 'Rua Haddock Lobo, 400 — São Paulo', button: 'Solicitar horário' } },
        footer('Cuidado integrado para toda a família. Responsável técnico: Dr. Nome Sobrenome — CRM 00000.', [['Clínica', ['Especialidades', 'Exames', 'Convênios', 'Telemedicina']], ['Pacientes', ['Agendar', 'Resultados', 'Dúvidas', 'Ouvidoria']], ['Legal', ['Privacidade', 'LGPD', 'Termos']]]),
      ],
    }],
  },

  // ══ Eventos & Educação ════════════════════════════════════════
  {
    id: 'conference',
    name: 'Conferência / Evento',
    description: 'Evento com palestrantes, programação, ingressos e patrocinadores',
    category: 'Eventos & Educação',
    tags: ['Dark mode', 'Display', 'Colorido'],
    preset: 'festival',
    brief: { projectName: 'FUTURE/26', tagline: 'A conferência de tecnologia e criatividade da América Latina', industry: 'Eventos / Conferência', tone: ['Ousado', 'Inovador', 'Divertido'], audience: 'Profissionais de tecnologia, design e negócios.', goal: 'Vender ingressos e atrair patrocinadores.', features: ['Venda de ingressos (Sympla / Stripe)', 'Agenda filtrável por trilha', 'Contagem regressiva', 'SEO técnico completo'] },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Palestrantes', '#'], ['Programação', '#'], ['Ingressos', '#'], ['Patrocínio', '#']], 'Comprar ingresso'),
        { t: 'hero', style: { paddingY: 'xl' }, props: { badgeTag: '12–14 SET', badge: 'São Paulo · Expo Center Norte', title: 'O futuro *acontece aqui*', subtitle: 'Três dias, 120 palestras e 8 mil pessoas construindo o que vem a seguir em IA, design e negócios.', primaryLabel: 'Garantir ingresso', secondaryLabel: 'Ver programação', proof: 'Lote 2 com 30% off até domingo', showMockup: false } },
        { t: 'stats', v: 'bar', props: { items: stats(['120', 'palestras'], ['8 mil', 'participantes'], ['6', 'palcos'], ['3', 'dias']) } },
        { t: 'team', props: { eyebrow: 'Palestrantes', title: 'Quem vai *subir ao palco*', members: people(['Sofia Mendes', 'CEO, Orbis AI'], ['Kenji Watanabe', 'Design Lead, Kite'], ['Amara Diallo', 'Founder, Lumen'], ['Bruno Castro', 'CTO, Verde Bank'], ['Iris Novak', 'Pesquisadora, MIT'], ['Diego Ramos', 'VC, Atlas Ventures'], ['Lena Fischer', 'Head of Brand, Mare'], ['Tiago Cruz', 'Criador, Pixel Club']) } },
        { t: 'features', v: 'list', style: { background: 'surface' }, props: { eyebrow: 'Programação', title: 'Seis trilhas, *um só futuro*', subtitle: '', items: [f('cpu', 'IA aplicada', 'Casos reais de agentes, LLMs e automação em produção.'), f('palette', 'Design & marca', 'Produto, sistemas visuais e criatividade com IA.'), f('rocket', 'Startups', 'Fundraising, crescimento e bastidores de founders.'), f('code', 'Engenharia', 'Arquitetura, plataformas e developer experience.'), f('trending', 'Growth', 'Aquisição, retenção e dados.'), f('users', 'Cultura', 'Liderança, times remotos e carreira.')] } },
        { t: 'pricing', props: { eyebrow: 'Ingressos', title: 'Escolha sua *experiência*', subtitle: 'Meia-entrada disponível conforme a lei.', plans: [plan('Day Pass', 'R$ 390', '', 'Um dia à sua escolha.', ['Acesso a todos os palcos', 'Área de expositores', 'Certificado'], 'Comprar'), plan('Full Pass', 'R$ 890', '', 'Os três dias completos.', ['Tudo do Day Pass', 'Workshops práticos', 'Gravações das palestras', 'Festa de encerramento'], 'Comprar Full Pass', true), plan('VIP', 'R$ 2.490', '', 'Experiência premium.', ['Tudo do Full Pass', 'Lounge e almoço VIP', 'Meet & greet com palestrantes', 'Assento reservado'], 'Comprar VIP')] } },
        { t: 'logos', props: { label: 'PATROCINADORES', logos: logos(['Orbis', 'globe'], ['Verde Bank', 'leaf'], ['Kite', 'rocket'], ['Atlas', 'layers'], ['Nexa', 'cpu'], ['Mare', 'heart']) } },
        { t: 'faq', props: { items: [qa('Posso transferir meu ingresso?', 'Sim, até 7 dias antes do evento pela plataforma de vendas.'), qa('Haverá transmissão online?', 'Os palcos principais serão transmitidos para quem tem Full Pass ou VIP.'), qa('Como me tornar patrocinador?', 'Envie um e-mail para patrocinio@future26.com e receba o media kit.')] } },
        { t: 'cta', props: { title: 'Nos vemos em *setembro*', subtitle: 'Os ingressos do lote 2 estão acabando.', primaryLabel: 'Garantir ingresso', secondaryLabel: 'Quero patrocinar' } },
        footer('A conferência de tecnologia e criatividade da América Latina.', [['Evento', ['Palestrantes', 'Programação', 'Ingressos', 'Local']], ['Participe', ['Patrocínio', 'Call for papers', 'Voluntariado', 'Imprensa']], ['Ajuda', ['FAQ', 'Política de reembolso', 'Código de conduta', 'Contato']]]),
      ],
    }],
  },
  {
    id: 'course',
    name: 'Curso Online',
    description: 'Infoproduto com módulos, instrutores, planos e FAQ',
    category: 'Eventos & Educação',
    tags: ['Colorido', 'Moderno'],
    preset: 'academy',
    brief: { projectName: 'Academia Pro', tagline: 'Aprenda design de produto com quem faz', industry: 'Educação online', tone: ['Amigável', 'Confiante', 'Direto'], audience: 'Profissionais em transição de carreira para UX/UI e Product Design.', goal: 'Vender matrículas da próxima turma.', features: ['Checkout com Stripe / Hotmart', 'Área do aluno', 'Contagem regressiva', 'Analytics (GA4 / Plausible)'] },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Programa', '#'], ['Instrutores', '#'], ['Planos', '#'], ['FAQ', '#']], 'Garantir vaga'),
        { t: 'hero', v: 'split', style: { background: 'surface', align: 'left' }, props: { badgeTag: 'Turma 12', badge: 'Inscrições abertas até 30/04', title: 'Do zero ao seu *primeiro emprego* em Product Design', subtitle: '16 semanas de aulas ao vivo, projetos reais e mentoria individual com designers de grandes empresas.', primaryLabel: 'Garantir minha vaga', secondaryLabel: 'Ver programa', proof: '4.800 alunos · 87% empregados em 6 meses', showMockup: false } },
        { t: 'logos', props: { label: 'NOSSOS ALUNOS TRABALHAM EM', logos: logos(['Nubank', 'gem'], ['iFood', 'heart'], ['Mercado Livre', 'box'], ['QuintoAndar', 'pin'], ['Stone', 'shield']) } },
        { t: 'features', props: { eyebrow: 'O que você vai aprender', title: 'Habilidades que o *mercado pede*', columns: '3', items: [f('target', 'Pesquisa com usuários', 'Entrevistas, testes e síntese de insights.'), f('layers', 'UI e design systems', 'Interfaces consistentes com Figma e tokens.'), f('workflow', 'Prototipação', 'Do wireframe ao protótipo de alta fidelidade.'), f('chart', 'Métricas de produto', 'Decisões guiadas por dados e experimentos.'), f('users', 'Trabalho com times', 'Rituais ágeis e colaboração com engenharia.'), f('award', 'Portfólio', 'Três cases completos para mostrar em entrevistas.')] } },
        { t: 'content', v: 'image-left', props: { eyebrow: 'Programa', title: '16 semanas, *4 módulos*', subtitle: 'Aulas ao vivo às terças e quintas, gravadas para rever quando quiser.', bullets: bullets('Módulo 1 — Fundamentos de UX', 'Módulo 2 — Interface e sistemas', 'Módulo 3 — Produto e métricas', 'Módulo 4 — Portfólio e carreira'), primaryLabel: 'Baixar ementa completa' } },
        { t: 'team', props: { eyebrow: 'Instrutores', title: 'Aprenda com *quem faz*', members: people(['Mariana Costa', 'Lead Designer'], ['João Pedro', 'Design Manager'], ['Aline Ferraz', 'UX Researcher'], ['Rafael Lima', 'Product Manager']) } },
        { t: 'testimonials', style: { background: 'surface' }, props: { eyebrow: 'Alunos', title: 'Carreiras *transformadas*', items: [tm('Saí da contabilidade e em 5 meses estava contratada como UX Designer júnior.', 'Patrícia N.', 'Turma 9'), tm('A mentoria individual fez toda a diferença no meu portfólio.', 'Lucas F.', 'Turma 10'), tm('Conteúdo prático, direto e com professores que estão no mercado.', 'Bianca T.', 'Turma 11')] } },
        { t: 'pricing', props: { eyebrow: 'Investimento', title: 'Escolha seu *plano*', subtitle: 'Garantia incondicional de 7 dias.', plans: [plan('Essencial', '12x R$ 197', '', 'Aulas e comunidade.', ['Aulas ao vivo e gravadas', 'Comunidade de alunos', 'Certificado'], 'Matricular'), plan('Completo', '12x R$ 297', '', 'Com mentoria e carreira.', ['Tudo do Essencial', '6 mentorias individuais', 'Revisão de portfólio', 'Preparação para entrevistas'], 'Matricular no Completo', true)] } },
        { t: 'faq', props: { items: [qa('Preciso ter experiência?', 'Não. O curso começa do zero e é pensado para quem está em transição de carreira.'), qa('Por quanto tempo tenho acesso?', 'Acesso vitalício às gravações e às atualizações do conteúdo.'), qa('E se eu não gostar?', 'Você tem 7 dias de garantia para pedir reembolso integral.')] } },
        { t: 'cta', props: { title: 'Sua nova carreira começa *agora*', subtitle: 'Vagas limitadas para manter a qualidade da mentoria.', primaryLabel: 'Garantir minha vaga', secondaryLabel: 'Falar com um consultor' } },
        footer('Educação prática em design de produto.', [['Cursos', ['Product Design', 'UX Research', 'Design Systems']], ['Academia', ['Sobre', 'Blog', 'Empresas', 'Bolsas']], ['Ajuda', ['FAQ', 'Contato', 'Termos', 'Privacidade']]]),
      ],
    }],
  },

  // ══ Institucional ═════════════════════════════════════════════
  {
    id: 'consulting',
    name: 'Consultoria B2B',
    description: 'Institucional corporativo multi-página: início, sobre e contato',
    category: 'Institucional',
    tags: ['Corporativo', 'Multi-página'],
    preset: 'navy',
    brief: { projectName: 'Meridian Partners', tagline: 'Estratégia e transformação para empresas que lideram', industry: 'Consultoria empresarial', tone: ['Confiante', 'Sofisticado', 'Direto'], audience: 'C-levels e conselhos de empresas de médio e grande porte.', goal: 'Gerar reuniões com tomadores de decisão.' },
    pages: [
      {
        name: 'Início', slug: '/', sections: [
          nav([['Início', '/'], ['Sobre', '/sobre'], ['Contato', '/contato']], 'Fale conosco', '/contato'),
          { t: 'hero', v: 'split', style: { background: 'surface', align: 'left' }, props: { badgeTag: '', badge: '', eyebrow: 'Estratégia · Operações · Digital', title: 'Decisões melhores, *resultados mensuráveis*', subtitle: 'Apoiamos conselhos e lideranças em estratégia, eficiência operacional e transformação digital.', primaryLabel: 'Agendar conversa', primaryHref: '/contato', secondaryLabel: 'Conheça a Meridian', secondaryHref: '/sobre', proof: '', showMockup: true } },
          { t: 'logos', props: { label: 'CONFIAM EM NÓS', logos: logos(['Vale do Sul', 'globe'], ['Grupo Aurora', 'sparkles'], ['Nortec', 'cpu'], ['Banco Uno', 'shield'], ['Agro+', 'leaf']) } },
          { t: 'features', props: { eyebrow: 'Atuação', title: 'Onde *geramos valor*', columns: '3', items: [f('target', 'Estratégia corporativa', 'Portfólio, M&A e planejamento de longo prazo.'), f('gauge', 'Eficiência operacional', 'Redução de custos e excelência em processos.'), f('cpu', 'Transformação digital', 'Dados, IA e novos modelos de negócio.')] } },
          { t: 'stats', v: 'bar', props: { items: stats(['R$ 2,1 bi', 'em valor capturado'], ['300+', 'projetos'], ['18', 'anos'], ['94%', 'clientes recorrentes']) } },
          { t: 'testimonials', props: { eyebrow: 'Clientes', title: 'Parceria de *longo prazo*', items: [tm('A Meridian conduziu nossa reestruturação com rigor e sensibilidade. Ganhamos 6 pontos de margem.', 'Roberto Lima', 'CEO, Nortec'), tm('Time sênior, presente e orientado a resultado.', 'Cláudia Prado', 'CFO, Banco Uno'), tm('A melhor decisão estratégica que tomamos nos últimos anos.', 'Henrique Vaz', 'Conselheiro, Agro+')] } },
          { t: 'cta', props: { title: 'Vamos conversar sobre o *seu desafio*', subtitle: 'Uma primeira reunião sem compromisso com um sócio.', primaryLabel: 'Agendar conversa', primaryHref: '/contato', secondaryLabel: '' } },
          footer('Estratégia e transformação para empresas que lideram.', [['Meridian', ['Sobre', 'Sócios', 'Carreiras']], ['Atuação', ['Estratégia', 'Operações', 'Digital']], ['Contato', ['contato@meridian.com', '+55 11 3100-0000', 'LinkedIn']]]),
        ],
      },
      {
        name: 'Sobre', slug: '/sobre', seoDescription: 'Conheça a história, os sócios e os valores da Meridian Partners.', sections: [
          nav([['Início', '/'], ['Sobre', '/sobre'], ['Contato', '/contato']], 'Fale conosco', '/contato'),
          { t: 'hero', v: 'minimal', style: { background: 'surface', paddingY: 'lg' }, props: { badgeTag: '', badge: '', eyebrow: 'Sobre nós', title: 'Independentes por *convicção*', subtitle: 'Fundada em 2007 por ex-sócios de consultorias globais para entregar senioridade de verdade em cada projeto.', primaryLabel: '', secondaryLabel: '', proof: '' } },
          { t: 'content', props: { eyebrow: 'Nosso jeito', title: 'Sócios *no projeto*, não só na venda', subtitle: 'Times enxutos, liderados por sócios, que trabalham lado a lado com a sua equipe até o resultado aparecer.', bullets: bullets('Honorários atrelados a resultado', 'Sem conflitos de interesse', 'Confidencialidade absoluta'), primaryLabel: '' } },
          { t: 'team', props: { eyebrow: 'Sócios', title: 'Liderança', members: people(['Eduardo Prates', 'Sócio-fundador'], ['Marina Ventura', 'Sócia · Estratégia'], ['Paulo Hideki', 'Sócio · Operações'], ['Renata Alves', 'Sócia · Digital']) } },
          footer('Estratégia e transformação para empresas que lideram.', [['Meridian', ['Sobre', 'Sócios', 'Carreiras']], ['Atuação', ['Estratégia', 'Operações', 'Digital']], ['Contato', ['contato@meridian.com', '+55 11 3100-0000']]]),
        ],
      },
      {
        name: 'Contato', slug: '/contato', seoDescription: 'Agende uma conversa com um sócio da Meridian Partners.', sections: [
          nav([['Início', '/'], ['Sobre', '/sobre'], ['Contato', '/contato']], 'Fale conosco', '/contato'),
          { t: 'contact', style: { paddingY: 'xl' }, props: { eyebrow: 'Contato', title: 'Fale com um *sócio*', subtitle: 'Respondemos em até um dia útil.', email: 'contato@meridian.com', phone: '+55 11 3100-0000', address: 'Av. Faria Lima, 3500 — São Paulo', button: 'Enviar mensagem' } },
          { t: 'faq', props: { items: [qa('Com que porte de empresa vocês trabalham?', 'Principalmente empresas com faturamento acima de R$ 200 milhões.'), qa('Quanto dura um projeto típico?', 'Entre 8 e 24 semanas, com acompanhamento posterior opcional.')] } },
          footer('Estratégia e transformação para empresas que lideram.', [['Meridian', ['Sobre', 'Sócios']], ['Atuação', ['Estratégia', 'Operações', 'Digital']], ['Contato', ['contato@meridian.com']]]),
        ],
      },
    ],
  },
  {
    id: 'ngo',
    name: 'ONG / Causa social',
    description: 'Organização sem fins lucrativos com impacto, histórias e doação',
    category: 'Institucional',
    tags: ['Orgânico', 'Serifado', 'Acolhedor'],
    preset: 'organic',
    brief: { projectName: 'Raízes', tagline: 'Educação que transforma comunidades', industry: 'Terceiro setor / Educação', tone: ['Acolhedor', 'Confiante', 'Atemporal'], audience: 'Doadores pessoa física, empresas parceiras e voluntários.', goal: 'Aumentar doações recorrentes.', features: ['Doações recorrentes (Stripe / Pix)', 'Prestação de contas em PDF', 'Newsletter (Resend / Mailchimp)'] },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Nosso trabalho', '#'], ['Impacto', '#'], ['Transparência', '#'], ['Voluntariado', '#']], 'Doar agora'),
        { t: 'hero', style: { background: 'surface' }, props: { badgeTag: '15 anos', badge: 'Mais de 20 mil crianças atendidas', title: 'Educação que *transforma* comunidades', subtitle: 'Levamos reforço escolar, leitura e tecnologia para crianças em 42 comunidades do Brasil.', primaryLabel: 'Doar agora', secondaryLabel: 'Ser voluntário', proof: 'Selo Doar · Melhores ONGs 2025', showMockup: false } },
        { t: 'stats', props: { eyebrow: 'Impacto', title: 'Cada real *vira futuro*', items: stats(['20 mil', 'crianças atendidas'], ['42', 'comunidades'], ['93%', 'aprovação escolar'], ['R$ 0,89', 'de cada R$ 1 vai ao campo']) } },
        { t: 'content', props: { eyebrow: 'Nosso trabalho', title: 'Presença *diária* onde é preciso', subtitle: 'Nossos núcleos funcionam no contraturno escolar, com educadores da própria comunidade e acompanhamento das famílias.', bullets: bullets('Reforço escolar e alfabetização', 'Bibliotecas comunitárias', 'Laboratórios de tecnologia'), primaryLabel: 'Conhecer os núcleos' } },
        { t: 'features', style: { background: 'surface' }, props: { eyebrow: 'Como ajudar', title: 'Escolha *seu jeito* de participar', columns: '3', items: [f('heart', 'Doação mensal', 'A partir de R$ 30 por mês você apadrinha uma turma.'), f('users', 'Voluntariado', 'Doe horas como mentor, leitor ou em projetos de tecnologia.'), f('award', 'Empresas parceiras', 'Investimento social com relatórios de impacto.')] } },
        { t: 'gallery', props: { eyebrow: 'No campo', title: 'Histórias *reais*', images: imgs('Núcleo Recife', 'Biblioteca Manaus', 'Lab de tecnologia', 'Formatura 2025', 'Leitura em família', 'Mutirão') } },
        { t: 'testimonials', v: 'highlight', style: { background: 'default' }, props: { eyebrow: 'Quem viveu', items: [tm('Eu aprendi a ler no núcleo. Hoje sou educadora aqui e ensino as crianças da minha rua.', 'Joana Silva', 'Ex-aluna e educadora')] } },
        { t: 'cta', props: { title: 'Doe hoje e *mude uma história*', subtitle: 'Doações são dedutíveis do Imposto de Renda.', primaryLabel: 'Quero doar', secondaryLabel: 'Ver prestação de contas' } },
        { t: 'newsletter', props: { eyebrow: 'Acompanhe', title: 'Receba nosso *relatório de impacto*', subtitle: 'Histórias e números do campo, uma vez por mês.', button: 'Assinar' } },
        footer('Organização sem fins lucrativos · CNPJ 00.000.000/0001-00', [['Raízes', ['Sobre', 'Equipe', 'Núcleos', 'Imprensa']], ['Participe', ['Doar', 'Voluntariado', 'Empresas', 'Eventos']], ['Transparência', ['Relatórios', 'Balanços', 'Estatuto']]]),
      ],
    }],
  },

  // ══ Mobile ════════════════════════════════════════════════════
  {
    id: 'mobileapp',
    name: 'App Mobile',
    description: 'Landing de aplicativo com bento, avaliações e download',
    category: 'Mobile',
    tags: ['Pastel', 'Bento grid', 'Arredondado'],
    preset: 'pastel',
    brief: { projectName: 'Flow', tagline: 'Hábitos que ficam', industry: 'App de bem-estar', tone: ['Amigável', 'Divertido', 'Moderno'], audience: 'Jovens adultos que querem criar rotinas saudáveis.', goal: 'Aumentar downloads nas lojas de aplicativos.', features: ['Links para App Store e Google Play', 'Smart banner mobile', 'Analytics (GA4 / Plausible)'] },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav([['Recursos', '#'], ['Depoimentos', '#'], ['Planos', '#']], 'Baixar app'),
        { t: 'hero', v: 'split', style: { background: 'mesh', align: 'left' }, props: { badgeTag: '#1', badge: 'App do dia na App Store', title: 'Pequenos hábitos, *grandes mudanças*', subtitle: 'Flow transforma metas em rotinas leves com lembretes inteligentes, sequências e uma comunidade que te apoia.', primaryLabel: 'Baixar na App Store', secondaryLabel: 'Disponível no Google Play', proof: '2 milhões de downloads · 4,9★', showMockup: false } },
        { t: 'features', v: 'bento', props: { eyebrow: 'Recursos', title: 'Feito para *caber no seu dia*', items: [f('sparkles', 'Rotinas guiadas', 'Planos prontos de sono, foco e movimento, adaptados ao seu ritmo.'), f('clock', 'Lembretes que entendem você', 'Notificações no melhor momento, não no pior.'), f('trending', 'Sequências e progresso', 'Visualize sua evolução semana a semana.'), f('users', 'Amigos e desafios', 'Combine metas e celebre juntos.'), f('heart', 'Integra com Saúde', 'Apple Health e Google Fit sincronizados.')] } },
        { t: 'stats', props: { items: stats(['2 mi', 'downloads'], ['4,9★', 'avaliação média'], ['68%', 'mantêm hábitos após 90 dias'], ['150', 'países']) } },
        { t: 'content', v: 'image-left', props: { eyebrow: 'Ciência', title: 'Baseado em *psicologia comportamental*', subtitle: 'Desenvolvido com pesquisadores para reduzir fricção e aumentar a consistência — sem culpa.', bullets: bullets('Metas pequenas e progressivas', 'Recompensas que motivam', 'Reflexões semanais'), primaryLabel: 'Ler o estudo' } },
        { t: 'testimonials', style: { background: 'surface' }, props: { eyebrow: 'Avaliações', title: 'Amado por *2 milhões* de pessoas', items: [tm('Primeiro app de hábitos que eu não abandonei em uma semana.', 'Bruna', 'App Store'), tm('Os lembretes são tão bons que parecem mágica.', 'Henrique', 'Google Play'), tm('Design lindo e muito leve. Uso todos os dias há 8 meses.', 'Mel', 'App Store')] } },
        { t: 'pricing', props: { eyebrow: 'Planos', title: 'Comece *grátis*', subtitle: 'Upgrade quando quiser, cancele quando quiser.', plans: [plan('Grátis', 'R$ 0', '', 'Para começar.', ['3 hábitos ativos', 'Lembretes básicos', 'Estatísticas da semana'], 'Baixar grátis'), plan('Flow+', 'R$ 14,90', '/mês', 'Para ir além.', ['Hábitos ilimitados', 'Rotinas guiadas', 'Desafios com amigos', 'Widgets e temas'], 'Testar 7 dias grátis', true)] } },
        { t: 'faq', props: { items: [qa('O Flow funciona offline?', 'Sim, tudo sincroniza quando você voltar a ficar online.'), qa('Meus dados são privados?', 'Sim. Não vendemos dados e você pode exportar ou apagar tudo a qualquer momento.')] } },
        { t: 'cta', props: { title: 'Seu próximo hábito começa *hoje*', subtitle: 'Grátis para iOS e Android.', primaryLabel: 'App Store', secondaryLabel: 'Google Play' } },
        footer('Hábitos que ficam.', [['App', ['Recursos', 'Planos', 'Novidades']], ['Empresa', ['Sobre', 'Blog', 'Imprensa']], ['Suporte', ['Ajuda', 'Privacidade', 'Termos']]]),
      ],
    }],
  },

  // ══ Básico ═════════════════════════════════════════════════════
  {
    id: 'blank',
    name: 'Em branco',
    description: 'Comece do zero com navbar e rodapé',
    category: 'Básico',
    tags: ['Minimal'],
    preset: 'saas',
    brief: {},
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', 'footer'] }],
  },
];

/** Every template: the structured catalog, then the themed Canvas ones (blank stays last). */
export const TEMPLATES: Template[] = [
  ...BASE_TEMPLATES.filter((t) => t.id !== 'blank'),
  ...THEMED_TEMPLATES,
  ...BASE_TEMPLATES.filter((t) => t.id === 'blank'),
];

// ─── instantiation ──────────────────────────────────────────────
const COPY_KEYS = ['eyebrow', 'subtitle', 'badge', 'badgeTag', 'proof', 'secondaryLabel', 'note'];
export function projectFromTemplate(tpl: Template): Project {
  const preset = THEME_PRESETS.find((p) => p.id === tpl.preset)?.theme ?? DEFAULT_THEME;
  const brief: Brief = { ...DEFAULT_BRIEF, ...tpl.brief };
  const pages: Page[] = tpl.pages.map((pg) => {
    const page = createPage(pg.name, pg.slug);
    page.sections = pg.sections.map((entry) => {
      const e = typeof entry === 'string' ? { t: entry } : entry;
      const s = createSection(e.t, e.v);
      if (e.style) s.style = { ...s.style, ...e.style };
      if (e.props) {
        // A template that rewrites a section's copy must not inherit unrelated
        // demo text (e.g. the generic subtitle) from the section defaults.
        for (const k of COPY_KEYS) if (k in s.props && !(k in e.props)) s.props[k] = '';
        s.props = { ...s.props, ...structuredClone(e.props) };
      }
      if (e.t === 'canvas' && Array.isArray(s.props.elements)) {
        s.props.elements = (s.props.elements as unknown as CanvasEl[]).map((x) => ({ ...x, id: elId() })) as unknown as PropValue;
      }
      if (e.name) s.name = e.name;
      if (e.notes) s.notes = e.notes;
      if ((e.t === 'navbar' || e.t === 'footer') && brief.projectName) {
        s.props.brand = brief.projectName;
        if (e.t === 'footer' && !e.props?.copyright) s.props.copyright = `© ${new Date().getFullYear()} ${brief.projectName}. Todos os direitos reservados.`;
      }
      return s;
    });
    page.seoTitle = pg.slug === '/' ? `${brief.projectName} — ${brief.tagline}` : `${pg.name} — ${brief.projectName}`;
    page.seoDescription = pg.seoDescription ?? brief.tagline;
    return page;
  });
  const now = Date.now();
  return { id: uid('proj'), version: 1, name: brief.projectName, createdAt: now, updatedAt: now, brief, theme: structuredClone(preset) as Theme, pages };
}

export function createDefaultProject(): Project {
  return projectFromTemplate(TEMPLATES[0]);
}
