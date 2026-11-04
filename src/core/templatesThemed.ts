import type { Template, TemplatePage } from './templates';
import type { Props, SectionStyle } from './types';
import { cardsComp, ctaComp, galleryComp, heroComp, listComp, quoteComp, splitComp, statsComp, toProps, type Composition } from './canvasKit';

// ════════════════════════════════════════════════════════════════
//  Themed templates built from free-form sections (Canvas mode).
//  Navbar and footer stay structured sections; everything in between is
//  a 12-column composition the user can drag around.
// ════════════════════════════════════════════════════════════════

type Entry = TemplatePage['sections'][number];

const canvas = (name: string, comp: Composition, style?: Partial<SectionStyle>): Entry => ({ t: 'canvas', name, style, props: toProps(comp) });
const nav = (links: string[], ctaLabel: string): Entry => ({ t: 'navbar', props: { links: links.map((label) => ({ label, href: '#' })), ctaLabel, ctaHref: '#' } as Props });
const footer = (blurb: string, cols: [string, string[]][], style?: Partial<SectionStyle>): Entry => ({
  t: 'footer', style, props: { blurb, columns: cols.map(([title, l]) => ({ title, links: l.join('\n') })) } as Props,
});

export const THEMED_TEMPLATES: Template[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Festival de arte digital com neon, brilho e grade livre',
    category: 'Temáticos',
    tags: ['Cyberpunk', 'Neon', 'Dark mode', 'Canvas'],
    preset: 'cyberpunk',
    mode: 'canvas',
    brief: { projectName: 'NEON//DISTRICT', tagline: 'Festival de arte digital e música eletrônica', industry: 'Eventos / Arte digital', tone: ['Ousado', 'Inovador', 'Criativo'], audience: 'Jovens adultos apaixonados por música eletrônica, games e arte digital.', goal: 'Vender ingressos para as três noites do festival.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Line-up', 'Experiências', 'Ingressos', 'Mapa'], 'Comprar ingresso'),
        canvas('Abertura', heroComp({ eyebrow: 'Edição 2077', title: 'O futuro é *neon*', text: 'Três noites de música eletrônica, arte generativa e realidade aumentada no coração da cidade.', primary: 'Garantir ingresso', secondary: 'Ver line-up', image: true, deco: 'neon' }), { background: 'default', paddingY: 'xl' }),
        canvas('Experiências', cardsComp({ eyebrow: 'Experiências', title: 'Entre na *rede*', items: [
          { icon: 'cpu', title: 'Arte generativa', text: 'Instalações que reagem ao público em tempo real.' },
          { icon: 'zap', title: 'Seis palcos', text: 'Techno, synthwave e drum & bass até o sol nascer.' },
          { icon: 'globe', title: 'Cidade em RA', text: 'O bairro inteiro vira um jogo no seu celular.' },
        ] })),
        canvas('Números', statsComp([{ value: '3', label: 'noites' }, { value: '6', label: 'palcos' }, { value: '40+', label: 'artistas' }, { value: '25k', label: 'pessoas' }]), { background: 'surface', paddingY: 'md' }),
        canvas('Chamada', ctaComp({ title: 'Conecte-se antes que *esgote*', text: 'Lote 1 com 30% de desconto por tempo limitado.', button: 'Comprar agora', deco: 'neon' })),
        footer('Festival de arte digital e música eletrônica.', [['Festival', ['Line-up', 'Mapa', 'FAQ']], ['Ingressos', ['Lotes', 'Meia-entrada', 'Reembolso']], ['Contato', ['Imprensa', 'Patrocínio', 'Instagram']]]),
      ],
    }],
  },
  {
    id: 'scifi',
    name: 'Sci-fi Espacial',
    description: 'Startup espacial com planetas, estrelas e vidro',
    category: 'Temáticos',
    tags: ['Sci-fi', 'Espacial', 'Glassmorphism', 'Canvas'],
    preset: 'scifi',
    mode: 'canvas',
    brief: { projectName: 'Orbital', tagline: 'Viagens à órbita para todos', industry: 'Aeroespacial / Turismo', tone: ['Inovador', 'Confiante', 'Sofisticado'], audience: 'Viajantes de alto padrão e entusiastas de tecnologia espacial.', goal: 'Captar reservas para a lista de voos de 2028.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Missões', 'Tecnologia', 'Treinamento', 'Reservas'], 'Reservar assento'),
        canvas('Abertura', heroComp({ eyebrow: 'Voos a partir de 2028', title: 'Próxima parada: *órbita*', text: 'Doze horas a 400 km da Terra, com treinamento completo e a vista mais bonita que existe.', primary: 'Reservar assento', secondary: 'Conhecer a nave', center: true, deco: 'stars' }), { background: 'default', paddingY: 'xl' }),
        canvas('Missão', splitComp({ eyebrow: 'A nave', title: 'Tecnologia de *outra galáxia*', text: 'Cápsula reutilizável com janelas panorâmicas, gravidade zero por 6 horas e pouso suave no oceano.', button: 'Ficha técnica', imageLeft: true, deco: 'orbs' })),
        canvas('Diferenciais', cardsComp({ title: 'Pronto para *decolar*', items: [
          { icon: 'rocket', title: 'Treino de 5 dias', text: 'Preparação física e simulador com astronautas.' },
          { icon: 'shield', title: 'Segurança total', text: 'Sistemas redundantes e 200 voos de teste.' },
          { icon: 'globe', title: 'Vista de 360°', text: 'A maior janela já instalada em uma cápsula.' },
        ] })),
        canvas('Chamada', ctaComp({ title: 'O céu *não é o limite*', text: 'Apenas 120 assentos por ano. Entre na lista de espera.', button: 'Quero voar', deco: 'stars' })),
        footer('Viagens à órbita para todos.', [['Missões', ['Calendário', 'Rotas', 'Preços']], ['Empresa', ['Sobre', 'Engenharia', 'Carreiras']], ['Ajuda', ['FAQ', 'Saúde e preparo', 'Contato']]]),
      ],
    }],
  },
  {
    id: 'fantasy',
    name: 'Fantasia Épica',
    description: 'Lançamento de RPG ou livro com dourado, runas e serifas',
    category: 'Temáticos',
    tags: ['Fantasia', 'Serifado', 'Dark mode', 'Canvas'],
    preset: 'fantasy',
    mode: 'canvas',
    brief: { projectName: 'Reinos de Aether', tagline: 'Uma saga de fantasia em mundo aberto', industry: 'Games / Entretenimento', tone: ['Épico', 'Atemporal', 'Sofisticado'], audience: 'Jogadores de RPG e leitores de fantasia.', goal: 'Gerar pré-vendas e inscrições no beta fechado.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['O mundo', 'Classes', 'Bestiário', 'Pré-venda'], 'Entrar no beta'),
        canvas('Abertura', heroComp({ eyebrow: 'Capítulo I', title: 'Uma lenda *desperta*', text: 'Explore cinco reinos, forje alianças e decida o destino de Aether em um RPG de mundo aberto.', primary: 'Pré-venda', secondary: 'Assistir trailer', image: true, deco: 'runes' }), { background: 'default', paddingY: 'xl' }),
        canvas('O mundo', splitComp({ eyebrow: 'O mundo', title: 'Cinco reinos, *mil histórias*', text: 'Das florestas de cristal às cidadelas flutuantes, cada região tem sua magia, suas facções e seus segredos.', button: 'Ver o mapa', deco: 'runes' })),
        canvas('Galeria', galleryComp({ title: 'Do *bestiário*', captions: ['Dragão de obsidiana', 'Guardião da floresta', 'Cidadela flutuante'] })),
        canvas('Citação', quoteComp({ quote: 'A magia não escolhe heróis. Ela escolhe quem tem coragem de perguntar.', author: 'Lyra, arquimaga de Aether' }), { background: 'surface' }),
        canvas('Chamada', ctaComp({ title: 'Sua jornada *começa agora*', text: 'Garanta a edição de colecionador com mapa físico e artbook.', button: 'Garantir pré-venda', deco: 'runes' })),
        footer('Uma saga de fantasia em mundo aberto.', [['Jogo', ['Classes', 'Reinos', 'Atualizações']], ['Comunidade', ['Discord', 'Fórum', 'Fan art']], ['Suporte', ['FAQ', 'Requisitos', 'Contato']]]),
      ],
    }],
  },
  {
    id: 'computing',
    name: 'Computação / Dev',
    description: 'Ferramenta para desenvolvedores com estética de terminal',
    category: 'Temáticos',
    tags: ['Computação', 'Terminal', 'Dark mode', 'Canvas'],
    preset: 'terminal',
    mode: 'canvas',
    brief: { projectName: 'kernel.dev', tagline: 'Deploy de qualquer stack em um comando', industry: 'Ferramentas para desenvolvedores', tone: ['Técnico', 'Direto', 'Confiante'], audience: 'Desenvolvedores e times de plataforma.', goal: 'Gerar cadastros no plano gratuito.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Docs', 'Preços', 'Changelog', 'GitHub'], 'Começar grátis'),
        canvas('Abertura', heroComp({ eyebrow: 'v4.0 · open source', title: 'Deploy em *um comando*', text: 'Conecte o repositório, rode kernel deploy e tenha previews, logs e rollback automáticos.', primary: 'Começar grátis', secondary: 'Ler a documentação', deco: 'terminal' }), { background: 'default', paddingY: 'xl' }),
        canvas('Recursos', cardsComp({ eyebrow: 'Por baixo do capô', title: 'Feito para *quem codifica*', items: [
          { icon: 'code', title: 'Qualquer stack', text: 'Node, Python, Go, Rust e containers sem configurar nada.' },
          { icon: 'database', title: 'Bancos gerenciados', text: 'Postgres e Redis com backup e branching por PR.' },
          { icon: 'gauge', title: 'Edge global', text: '35 regiões e cold start abaixo de 50 ms.' },
        ] })),
        canvas('Números', statsComp([{ value: '1,2s', label: 'build médio' }, { value: '99,99%', label: 'uptime' }, { value: '80k', label: 'devs' }, { value: '35', label: 'regiões' }]), { background: 'surface', paddingY: 'md' }),
        canvas('Depoimento', quoteComp({ quote: 'Migramos 40 serviços em uma tarde. O rollback automático já salvou dois lançamentos.', author: 'Ana Ribeiro — Staff Engineer, Orbis' })),
        canvas('Chamada', ctaComp({ title: '$ kernel *deploy*', text: 'Plano gratuito para sempre em projetos pessoais.', button: 'Criar conta' })),
        footer('Deploy de qualquer stack em um comando.', [['Produto', ['Docs', 'Preços', 'Status']], ['Open source', ['GitHub', 'Contribuir', 'Roadmap']], ['Empresa', ['Sobre', 'Segurança', 'Contato']]]),
      ],
    }],
  },
  {
    id: 'education',
    name: 'Educação Infantil',
    description: 'Escola com formas coloridas, arredondadas e acolhedoras',
    category: 'Temáticos',
    tags: ['Educação', 'Colorido', 'Arredondado', 'Canvas'],
    preset: 'school',
    mode: 'canvas',
    brief: { projectName: 'Escola Aurora', tagline: 'Educação infantil bilíngue com propósito', industry: 'Educação', tone: ['Acolhedor', 'Divertido', 'Confiante'], audience: 'Famílias com crianças de 2 a 10 anos.', goal: 'Agendar visitas e matrículas para o próximo ano letivo.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Proposta', 'Turmas', 'Estrutura', 'Matrículas'], 'Agendar visita'),
        canvas('Abertura', heroComp({ eyebrow: 'Matrículas 2027 abertas', title: 'Aprender é uma *aventura*', text: 'Educação bilíngue, natureza e muita brincadeira para crianças de 2 a 10 anos.', primary: 'Agendar visita', secondary: 'Conhecer turmas', image: true, deco: 'playful' }), { background: 'default', paddingY: 'xl' }),
        canvas('Proposta', cardsComp({ eyebrow: 'Nossa proposta', title: 'Cada criança *no seu tempo*', cardFill: 'surface', items: [
          { icon: 'sparkles', title: 'Bilíngue', text: 'Português e inglês desde o primeiro dia, brincando.' },
          { icon: 'leaf', title: 'Natureza', text: 'Horta, pátio verde e aulas ao ar livre toda semana.' },
          { icon: 'palette', title: 'Artes', text: 'Música, teatro e ateliê para criar sem medo.' },
        ] })),
        canvas('Estrutura', splitComp({ eyebrow: 'Estrutura', title: 'Espaços pensados para *crescer*', text: 'Salas amplas e iluminadas, biblioteca infantil, laboratório maker e quadra coberta.', button: 'Fazer tour virtual', imageLeft: true })),
        canvas('Números', statsComp([{ value: '1:8', label: 'professor por aluno' }, { value: '25', label: 'anos de história' }, { value: '98%', label: 'famílias satisfeitas' }]), { background: 'surface', paddingY: 'md' }),
        canvas('Chamada', ctaComp({ title: 'Venha *conhecer* a escola', text: 'Visitas guiadas de segunda a sexta, com as crianças.', button: 'Agendar visita', deco: 'playful' })),
        footer('Educação infantil bilíngue com propósito.', [['Escola', ['Proposta', 'Equipe', 'Estrutura']], ['Famílias', ['Matrículas', 'Calendário', 'Cardápio']], ['Contato', ['WhatsApp', 'Endereço', 'Instagram']]]),
      ],
    }],
  },
  {
    id: 'retro-game',
    name: 'Games Retrô',
    description: 'Jogo indie com pixels, cores vibrantes e fonte 8-bit',
    category: 'Temáticos',
    tags: ['Games', 'Pixel art', 'Neon', 'Canvas'],
    preset: 'retro',
    mode: 'canvas',
    brief: { projectName: 'Pixel Quest', tagline: 'Uma aventura 8-bit para os dias de hoje', industry: 'Games indie', tone: ['Divertido', 'Ousado', 'Criativo'], audience: 'Fãs de jogos retrô e plataformas indie.', goal: 'Adicionar o jogo à lista de desejos na loja.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Jogo', 'Personagens', 'Trilha', 'Imprensa'], 'Lista de desejos'),
        canvas('Abertura', heroComp({ eyebrow: 'Lançamento em março', title: 'Salve o reino *8-bit*', text: 'Plataforma e exploração com 60 fases desenhadas pixel a pixel e trilha chiptune original.', primary: 'Adicionar à lista', secondary: 'Ver trailer', deco: 'pixel' }), { background: 'default', paddingY: 'xl' }),
        canvas('Galeria', galleryComp({ title: 'Capturas de *tela*', captions: ['Floresta de cristal', 'Chefe do castelo', 'Mapa do mundo'] })),
        canvas('Recursos', cardsComp({ title: 'Feito com *nostalgia*', items: [
          { icon: 'gem', title: '60 fases', text: 'Segredos em cada canto e chefes memoráveis.' },
          { icon: 'users', title: 'Cooperativo', text: 'Jogue com um amigo no mesmo sofá.' },
          { icon: 'award', title: 'Speedrun', text: 'Modo contra o relógio com ranking global.' },
        ] })),
        canvas('Chamada', ctaComp({ title: 'Press *start*', text: 'Disponível para PC e consoles. Demo grátis hoje.', button: 'Baixar demo', deco: 'pixel' })),
        footer('Uma aventura 8-bit para os dias de hoje.', [['Jogo', ['Plataformas', 'Requisitos', 'Atualizações']], ['Comunidade', ['Discord', 'Speedrun', 'Fan art']], ['Estúdio', ['Imprensa', 'Contato', 'Trabalhe conosco']]]),
      ],
    }],
  },
  {
    id: 'music-artist',
    name: 'Música / Artista',
    description: 'Lançamento de álbum com equalizador e cores vibrantes',
    category: 'Temáticos',
    tags: ['Música', 'Dark mode', 'Colorido', 'Canvas'],
    preset: 'music',
    mode: 'canvas',
    brief: { projectName: 'Eco Sessions', tagline: 'Novo álbum: Ressonância', industry: 'Música', tone: ['Criativo', 'Ousado', 'Acolhedor'], audience: 'Fãs de música alternativa e eletrônica.', goal: 'Aumentar streams do novo álbum e vender ingressos da turnê.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Álbum', 'Turnê', 'Vídeos', 'Loja'], 'Ouvir agora'),
        canvas('Abertura', heroComp({ eyebrow: 'Novo álbum', title: '*Ressonância*', text: 'Doze faixas gravadas ao vivo em uma igreja de 1890. Disponível em todas as plataformas.', primary: 'Ouvir agora', secondary: 'Datas da turnê', image: true, deco: 'eq' }), { background: 'default', paddingY: 'xl' }),
        canvas('Sobre', splitComp({ eyebrow: 'O disco', title: 'Gravado *ao vivo*', text: 'Sem cortes nem overdubs: só a sala, os instrumentos e o eco das paredes de pedra.', button: 'Assistir ao making of', deco: 'eq' })),
        canvas('Números', statsComp([{ value: '12', label: 'faixas' }, { value: '3M', label: 'streams na estreia' }, { value: '18', label: 'cidades na turnê' }]), { background: 'surface', paddingY: 'md' }),
        canvas('Chamada', ctaComp({ title: 'A turnê *começa em maio*', text: 'Ingressos limitados nas 18 cidades.', button: 'Ver datas', deco: 'eq' })),
        footer('Novo álbum: Ressonância.', [['Música', ['Álbum', 'Singles', 'Letras']], ['Ao vivo', ['Turnê', 'Vídeos', 'Fotos']], ['Contato', ['Booking', 'Imprensa', 'Loja']]]),
      ],
    }],
  },
  {
    id: 'nature-eco',
    name: 'Natureza / Eco',
    description: 'Marca sustentável com formas orgânicas e tons de verde',
    category: 'Temáticos',
    tags: ['Natureza', 'Orgânico', 'Serifado', 'Canvas'],
    preset: 'nature',
    mode: 'canvas',
    brief: { projectName: 'Verde Vivo', tagline: 'Reflorestamento com transparência', industry: 'Sustentabilidade', tone: ['Acolhedor', 'Confiante', 'Atemporal'], audience: 'Pessoas e empresas que querem compensar sua pegada de carbono.', goal: 'Converter visitantes em apoiadores mensais.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Projetos', 'Impacto', 'Empresas', 'Transparência'], 'Plantar agora'),
        canvas('Abertura', heroComp({ eyebrow: '1 milhão de árvores', title: 'Cultive um futuro *mais verde*', text: 'Cada assinatura planta árvores nativas da Mata Atlântica, com geolocalização e fotos do crescimento.', primary: 'Plantar agora', secondary: 'Ver projetos', image: true, deco: 'leaves' }), { background: 'default', paddingY: 'xl' }),
        canvas('Como funciona', cardsComp({ eyebrow: 'Como funciona', title: 'Do viveiro à *floresta*', cardFill: 'surface', items: [
          { icon: 'leaf', title: 'Mudas nativas', text: 'Espécies escolhidas com biólogos para cada região.' },
          { icon: 'users', title: 'Comunidades locais', text: 'Plantio e cuidado feitos por famílias da região.' },
          { icon: 'chart', title: 'Impacto medido', text: 'Relatórios com satélite e carbono capturado.' },
        ] })),
        canvas('Depoimento', quoteComp({ quote: 'Ver pelo mapa as árvores que plantamos crescendo virou um ritual da nossa equipe.', author: 'Marina Costa — Diretora de ESG, Lumen' }), { background: 'surface' }),
        canvas('Chamada', ctaComp({ title: 'Plante sua *primeira árvore*', text: 'A partir de R$ 19 por mês. Cancele quando quiser.', button: 'Quero apoiar', deco: 'leaves' })),
        footer('Reflorestamento com transparência.', [['Projetos', ['Mata Atlântica', 'Cerrado', 'Mapa']], ['Apoie', ['Pessoa física', 'Empresas', 'Presentear']], ['Transparência', ['Relatórios', 'Parceiros', 'Contato']]]),
      ],
    }],
  },
  {
    id: 'neon-merc',
    name: 'Neon Mercenário',
    description: 'Clínica de implantes com amarelo elétrico, glitch e cantos retos',
    category: 'Temáticos',
    tags: ['Cyberpunk', 'HUD', 'Glitch', 'Dark mode', 'Canvas'],
    preset: 'neon-merc',
    mode: 'canvas',
    brief: { projectName: 'CROMO//CLÍNICA', tagline: 'Implantes cibernéticos de grife', industry: 'Tecnologia / Ficção cyberpunk', tone: ['Ousado', 'Direto', 'Técnico'], audience: 'Fãs de ficção cyberpunk e jogadores de RPG que querem uma estética HUD agressiva.', goal: 'Agendar avaliações e vender pacotes de upgrade.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Implantes', 'Contratos', 'Garantia', 'Contato'], 'Agendar avaliação'),
        canvas('Abertura', heroComp({ eyebrow: 'SYS://ONLINE', title: 'Seu corpo, *versão 2.0*', text: 'Implantes ópticos, reflexos sintéticos e braços sob medida. Instalação em uma tarde e garantia vitalícia de firmware.', primary: 'Agendar avaliação', secondary: 'Ver catálogo', image: true, deco: 'glitch' }), { background: 'default', paddingY: 'xl' }),
        canvas('Catálogo', cardsComp({ eyebrow: 'Catálogo', title: 'Upgrades em *estoque*', items: [
          { icon: 'eye', title: 'Óptica de combate', text: 'Zoom 20x, visão térmica e leitura de dados em tempo real.' },
          { icon: 'activity', title: 'Reflexos sintéticos', text: 'Tempo de reação três vezes menor, calibrado ao seu sistema nervoso.' },
          { icon: 'crosshair', title: 'Braço tático', text: 'Liga de titânio, ferramentas integradas e acabamento cromado.' },
        ] })),
        canvas('Números', statsComp([{ value: '0,3s', label: 'tempo de reação' }, { value: '12k', label: 'implantes instalados' }, { value: '99,7%', label: 'compatibilidade' }, { value: '24/7', label: 'suporte de campo' }]), { background: 'surface', paddingY: 'md' }),
        canvas('Contratos', splitComp({ eyebrow: 'Contratos', title: 'Trabalho sujo, *preço limpo*', text: 'Pacotes para quem vive de contrato: instalação discreta, manutenção noturna e peças de reposição entregues onde você estiver.', button: 'Ver pacotes', imageLeft: true, deco: 'glitch' })),
        canvas('Chamada', ctaComp({ title: 'Upgrade hoje. Pague em 12 ciclos.', text: 'Avaliação neural gratuita na primeira visita. Vagas limitadas por noite.', button: 'Agendar agora', fill: 'primary', ink: 'black', radius: 0 })),
        footer('Implantes cibernéticos de grife.', [['Implantes', ['Óptica', 'Reflexos', 'Membros']], ['Clínica', ['Garantia', 'Financiamento', 'Unidades']], ['Contato', ['Emergência 24h', 'Parcerias', 'Imprensa']]]),
      ],
    }],
  },
  {
    id: 'crimson-line',
    name: 'Expedição Carmesim',
    description: 'Teatro imersivo gótico em vermelho, preto e dourado',
    category: 'Temáticos',
    tags: ['Gótico', 'Literário', 'Sombrio', 'Dark mode', 'Canvas'],
    preset: 'crimson',
    mode: 'canvas',
    brief: { projectName: 'LINHA 12', tagline: 'Uma viagem noturna por doze clássicos da literatura', industry: 'Teatro imersivo / Cultura', tone: ['Sombrio', 'Literário', 'Intenso'], audience: 'Adultos que gostam de teatro imersivo, literatura clássica e experiências noturnas.', goal: 'Vender assentos para as temporadas da expedição.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['A viagem', 'Paradas', 'Regras', 'Temporadas'], 'Embarcar'),
        canvas('Abertura', heroComp({ eyebrow: 'Partida às 23h', title: 'Doze clássicos. *Uma noite.*', text: 'Um ônibus atravessa a cidade adormecida e para em doze cenas de teatro imersivo. Cada parada é um livro; cada passageiro, um cúmplice.', primary: 'Reservar assento', secondary: 'Ver o trajeto', image: true, deco: 'crimson' }), { background: 'default', paddingY: 'xl' }),
        canvas('Manifesto', quoteComp({ quote: 'Toda história cobra uma passagem. Nesta viagem, você paga com a sua coragem.', author: 'Diário de bordo — Temporada I' }), { background: 'surface', paddingY: 'lg' }),
        canvas('Trajeto', listComp({ eyebrow: 'Trajeto', title: 'Paradas da *expedição*', text: 'Doze cenas inspiradas em obras em domínio público. Algumas delas:', items: [
          { title: 'O Inferno', text: 'Nove círculos encenados em um túnel desativado.' },
          { title: 'A Baleia Branca', text: 'Uma obsessão que cabe dentro de um galpão no porto.' },
          { title: 'O Cavaleiro Sonhador', text: 'Moinhos, gigantes e a coragem de quem não desiste.' },
          { title: 'O Pacto', text: 'Um contrato assinado à meia-noite, com tinta vermelha.' },
          { title: 'Crime e Castigo', text: 'Um interrogatório em que o público decide o veredito.' },
        ] })),
        canvas('Regras', cardsComp({ eyebrow: 'Antes de embarcar', title: 'Regras da *viagem*', items: [
          { icon: 'clock', title: 'Pontualidade', text: 'O ônibus parte às 23h em ponto. Ninguém volta para buscar.' },
          { icon: 'flame', title: 'Coragem', text: 'Algumas cenas são intensas. Recomendado para maiores de 16 anos.' },
          { icon: 'ticket', title: 'Bilhete nominal', text: 'Cada assento é numerado de 1 a 28 e não pode ser transferido.' },
        ] })),
        canvas('Números', statsComp([{ value: '12', label: 'paradas' }, { value: '5h', label: 'de viagem' }, { value: '28', label: 'passageiros por noite' }, { value: '1', label: 'motorista silencioso' }]), { background: 'surface', paddingY: 'md' }),
        canvas('Chamada', ctaComp({ title: 'O próximo ônibus parte em breve', text: 'Temporada II com assentos limitados. Embarque se tiver coragem.', button: 'Reservar assento', deco: 'crimson', radius: 2 })),
        footer('Uma viagem noturna por doze clássicos da literatura.', [['Expedição', ['Trajeto', 'Temporadas', 'Elenco']], ['Passageiros', ['Regras', 'Acessibilidade', 'Reembolso']], ['Contato', ['Imprensa', 'Grupos', 'Instagram']]]),
      ],
    }],
  },
  {
    id: 'ten-floors-library',
    name: 'Biblioteca dos Dez Andares',
    description: 'Livraria-café em dourado e sépia, com estantes e serifas clássicas',
    category: 'Temáticos',
    tags: ['Biblioteca', 'Serifado', 'Art nouveau', 'Dark mode', 'Canvas'],
    preset: 'library',
    mode: 'canvas',
    brief: { projectName: 'Biblioteca dos Dez Andares', tagline: 'Livraria, café e salão de leitura', industry: 'Livraria / Cultura', tone: ['Acolhedor', 'Erudito', 'Misterioso'], audience: 'Leitores, estudantes e curiosos que procuram um lugar para ler, estudar e participar de encontros.', goal: 'Atrair visitantes e distribuir convites para os encontros de sexta.' },
    pages: [{
      name: 'Início', slug: '/', sections: [
        nav(['Andares', 'Convites', 'Acervo', 'Visite'], 'Pedir convite'),
        canvas('Abertura', heroComp({ eyebrow: 'Aberta até a meia-noite', title: 'Todo saber tem *o seu andar*', text: 'Dez andares de livros, cada um dedicado a uma área do conhecimento. Suba, escolha uma mesa e fique o quanto quiser.', primary: 'Pedir um convite', secondary: 'Conhecer os andares', deco: 'shelves' }), { background: 'default', paddingY: 'xl' }),
        canvas('Andares', listComp({ eyebrow: 'Os andares', title: 'Do térreo à *cobertura*', text: 'Cada andar tem seu curador, seu silêncio e sua trilha de leituras.', items: [
          { title: 'História', text: 'Mapas antigos, crônicas e biografias.' },
          { title: 'Ciências', text: 'Do átomo às estrelas, com bancada de experimentos.' },
          { title: 'Literatura', text: 'Romances, poesia e uma sala só para contos.' },
          { title: 'Arte', text: 'Livros de arte, partituras e uma galeria rotativa.' },
          { title: 'Filosofia', text: 'Poltronas fundas e perguntas sem pressa.' },
        ] })),
        canvas('Convites', splitComp({ eyebrow: 'Convites', title: 'Toda sexta, *um convite*', text: 'Lançamentos, leituras em voz alta e debates com autores. Cada convite chega em envelope lacrado, com um livro escolhido para você.', button: 'Quero receber', imageLeft: true, deco: 'shelves' }), { background: 'surface' }),
        canvas('Inscrição', quoteComp({ quote: 'Um livro aberto é uma porta; uma biblioteca é uma cidade inteira.', author: 'Inscrição na entrada do térreo' })),
        canvas('Acervo', galleryComp({ title: 'O *acervo*', captions: ['Salão de leitura do quinto andar', 'Estante de livros raros', 'Café do térreo'] })),
        canvas('Chamada', ctaComp({ title: 'Sua mesa *está reservada*', text: 'Peça seu convite e receba um livro escolhido pelos curadores.', button: 'Pedir convite', fill: 'secondary', radius: 12, deco: 'orbs' })),
        footer('Livraria, café e salão de leitura.', [['Biblioteca', ['Andares', 'Acervo', 'Curadores']], ['Visite', ['Horários', 'Café', 'Acessibilidade']], ['Convites', ['Agenda', 'Clube de leitura', 'Contato']]]),
      ],
    }],
  },
];
