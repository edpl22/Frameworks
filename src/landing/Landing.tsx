import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Sparkles, MousePointer2, Palette, Layers3, Wand2, Download, Monitor, Container, Command,
  Check, Code2, Zap, ShieldCheck, Gauge, Terminal, Smartphone, Undo2, Braces,
} from 'lucide-react';
import { Logo, GithubMark as Github } from '../ui/Logo';
import { CATALOG } from '../core/catalog';
import type { Demo } from './demo';
import './landing.css';

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp [data-reveal]');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useSpotlight() {
  useEffect(() => {
    const on = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.lp-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    window.addEventListener('pointermove', on, { passive: true });
    return () => window.removeEventListener('pointermove', on);
  }, []);
}

function Typewriter({ text, speed = 6 }: { text: string; speed?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) {
        started = true;
        const tick = () => { setN((x) => { const nx = Math.min(text.length, x + speed); if (nx < text.length) raf = requestAnimationFrame(tick); return nx; }); };
        raf = requestAnimationFrame(tick);
      }
    });
    if (ref.current) io.observe(ref.current);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [text, speed]);
  return <pre ref={ref}>{text.slice(0, n)}<span className="caret" /></pre>;
}

const FEATURES = [
  { icon: <MousePointer2 size={20} />, title: 'Canvas visual de verdade', text: 'Arraste seções, edite textos direto na página, reordene camadas e veja o resultado em tempo real.' },
  { icon: <Palette size={20} />, title: 'Design system vivo', text: 'Gerador de paletas por harmonia, contraste WCAG ao vivo, 14 pares tipográficos e escala modular.' },
  { icon: <Smartphone size={20} />, title: 'Responsivo de verdade', text: 'Preview desktop, tablet e mobile com container queries — o que você vê é o que será entregue.' },
  { icon: <Wand2 size={20} />, title: 'Prompt para Claude Code', text: 'Cada pixel vira especificação: stack, tokens, seções, conteúdo, critérios de aceite e plano de execução.' },
  { icon: <Download size={20} />, title: 'Exporte tudo', text: 'HTML estático, ZIP completo, design tokens W3C, tema Tailwind v4, CSS variables e JSON do projeto.' },
  { icon: <Command size={20} />, title: 'Feito para profissionais', text: 'Paleta de comandos ⌘K, atalhos de teclado, histórico com 150 passos de undo e autosave.' },
];

const STEPS = [
  { n: '01', title: 'Desenhe', text: `Escolha entre ${CATALOG.templates} templates — SaaS, portfólio, e-commerce, restaurante, evento e mais — ou comece do zero.` },
  { n: '02', title: 'Refine', text: 'Ajuste tema, tipografia, espaçamentos, animações e conteúdo com controles precisos.' },
  { n: '03', title: 'Gere', text: 'Um clique transforma seu design em um prompt estruturado e otimizado para o Claude Code.' },
  { n: '04', title: 'Construa', text: 'Cole no Claude Code e receba um projeto Next.js, Astro, Nuxt, SvelteKit ou HTML pronto para produção.' },
];

export function Landing() {
  useReveal();
  useSpotlight();
  // The live demo uses the real engine; it is code-split so the page paints first.
  const [demo, setDemo] = useState<Demo | null>(null);
  useEffect(() => {
    let alive = true;
    import('./demo').then((m) => { if (alive) setDemo(m.buildDemo()); });
    return () => { alive = false; };
  }, []);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <div className="lp">
      <div className="lp-noise" />
      <header className={'lp-nav' + (scrolled ? ' scrolled' : '')}>
        <div className="lp-container lp-nav-inner">
          <a href="#" className="lp-brand"><span className="logo"><Logo size={18} /></span>Frameworks<span className="lp-brand-tag">Studio</span></a>
          <nav className="lp-links">
            <a href="#recursos" onClick={(e) => { e.preventDefault(); document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' }); }}>Recursos</a>
            <a href="#como" onClick={(e) => { e.preventDefault(); document.getElementById('como')?.scrollIntoView({ behavior: 'smooth' }); }}>Como funciona</a>
            <a href="#prompt" onClick={(e) => { e.preventDefault(); document.getElementById('prompt')?.scrollIntoView({ behavior: 'smooth' }); }}>Prompt</a>
            <a href="#plataformas" onClick={(e) => { e.preventDefault(); document.getElementById('plataformas')?.scrollIntoView({ behavior: 'smooth' }); }}>Desktop & Docker</a>
          </nav>
          <a href="#studio" className="lp-btn lp-btn-primary lp-btn-sm">Abrir Studio <ArrowRight size={14} /></a>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-aurora" aria-hidden="true"><i /><i /><i /></div>
        <div className="lp-gridlines" aria-hidden="true" />
        <div className="lp-container" style={{ position: 'relative' }}>
          <a href="#studio" className="lp-pill" data-reveal>
            <span className="lp-pill-tag"><Sparkles size={11} /> Novo</span>
            Do design ao código com Claude Code
            <ArrowRight size={13} />
          </a>
          <h1 className="lp-h1" data-reveal>
            Desenhe sites<br /> <span className="lp-serif">extraordinários.</span><br />
            <span className="lp-grad">Entregue em minutos.</span>
          </h1>
          <p className="lp-lead" data-reveal>
            O framework visual que transforma sua criatividade em um prompt de engenharia impecável.
            Projete, refine e exporte — o Claude Code constrói o resto, com qualidade de produção.
          </p>
          <div className="lp-cta" data-reveal>
            <a href="#studio" className="lp-btn lp-btn-primary lp-btn-lg">Começar a criar — grátis <ArrowRight size={16} /></a>
            <a href="#prompt" className="lp-btn lp-btn-ghost lp-btn-lg" onClick={(e) => { e.preventDefault(); document.getElementById('prompt')?.scrollIntoView({ behavior: 'smooth' }); }}><Terminal size={16} /> Ver um prompt gerado</a>
          </div>
          <div className="lp-meta" data-reveal>
            <span><Check size={14} /> Sem cadastro</span><span><Check size={14} /> Web, Desktop & Docker</span><span><Check size={14} /> Open source</span>
          </div>

          {/* Product shot */}
          {/* Decorative product shot: hidden from assistive tech and the tab order (it contains a full demo site). */}
          <div className="lp-shot" data-reveal aria-hidden="true" inert>
            <div className="lp-shot-glow" />
            <div className="lp-shot-frame">
              <div className="lp-shot-bar"><i /><i /><i /><span>Frameworks Studio — Aurora</span></div>
              <div className="lp-shot-body">
                <aside className="lp-shot-side">
                  {['Navbar', 'Hero', 'Logos', 'Recursos', 'Números', 'Depoimentos', 'Preços', 'FAQ', 'Rodapé'].map((x, i) => (
                    <div key={x} className={'lp-shot-layer' + (i === 1 ? ' on' : '')}><Layers3 size={12} />{x}</div>
                  ))}
                </aside>
                <div className="lp-shot-canvas lp-demo">
                  {demo ? (
                    <>
                      <style>{demo.css}</style>
                      <div className="lp-shot-site" dangerouslySetInnerHTML={{ __html: demo.html }} />
                    </>
                  ) : <div className="lp-shot-site lp-shot-skeleton" />}
                  <div className="lp-shot-cursor"><MousePointer2 size={18} fill="#fff" /><span>Você</span></div>
                </div>
                <aside className="lp-shot-insp">
                  <div className="lp-shot-h">Design system</div>
                  <div className="lp-shot-sw">{['#07070c', '#8b5cf6', '#22d3ee', '#f472b6', '#f5f5fa'].map((c) => <i key={c} style={{ background: c }} />)}</div>
                  <div className="lp-shot-h">Tipografia</div>
                  <div className="lp-shot-font">Instrument Serif<small>Inter · 1.25</small></div>
                  <div className="lp-shot-h">Contraste</div>
                  <div className="lp-shot-badges"><b>AAA 18.4</b><b>AA 7.1</b></div>
                  <div className="lp-shot-gen"><Sparkles size={13} /> Gerar prompt</div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS / STATS */}
      <section className="lp-stats lp-container" data-reveal>
        {[[String(CATALOG.templates), 'templates profissionais'], [String(CATALOG.sections), 'tipos de seção'], [String(CATALOG.presets), 'presets de design'], [String(CATALOG.stacks), 'stacks de destino']].map(([v, l]) => (
          <div key={l}><b>{v}</b><span>{l}</span></div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="recursos">
        <div className="lp-container">
          <div className="lp-head" data-reveal>
            <span className="lp-eyebrow">Recursos</span>
            <h2 className="lp-h2">Ferramentas de nível <span className="lp-serif">estúdio</span>,<br />simplicidade de produto.</h2>
            <p className="lp-sub">Tudo que um time de design e engenharia de elite usaria — em uma única interface intuitiva.</p>
          </div>
          <div className="lp-bento">
            {FEATURES.map((f, i) => (
              <article key={f.title} className={'lp-card' + ([0, 3, 4].includes(i) ? ' wide' : '')} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="lp-card-ic">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                {i === 0 && (
                  <div className="lp-mini-canvas" aria-hidden="true">
                    <div className="b1" /><div className="b2"><span /><span /><span /></div><div className="b3" />
                    <div className="drag"><Layers3 size={12} /> Preços</div>
                  </div>
                )}
                {i === 3 && (
                  <div className="lp-mini-prompt" aria-hidden="true">
                    <div><span className="k">## 3.</span> Design system</div>
                    <div><span className="d">--color-primary:</span> <span className="v">#8b5cf6</span>;</div>
                    <div><span className="d">--font-heading:</span> <span className="v">"Instrument Serif"</span>;</div>
                    <div><span className="k">#### 2.</span> Hero — <span className="v">{'<Hero />'}</span></div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="lp-section" id="como">
        <div className="lp-container">
          <div className="lp-head" data-reveal>
            <span className="lp-eyebrow">Como funciona</span>
            <h2 className="lp-h2">Da ideia ao deploy em <span className="lp-serif">quatro</span> passos.</h2>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.n} className="lp-step" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMPT */}
      <section className="lp-section" id="prompt">
        <div className="lp-container lp-split">
          <div data-reveal>
            <span className="lp-eyebrow">O prompt</span>
            <h2 className="lp-h2">Engenharia de prompt,<br /><span className="lp-serif">automática.</span></h2>
            <p className="lp-sub" style={{ marginLeft: 0 }}>Cada decisão de design vira instrução precisa. O Claude Code recebe contexto de negócio, design tokens, arquitetura, conteúdo e critérios de qualidade — sem ambiguidade.</p>
            <ul className="lp-checks">
              {['Stack e estrutura de pastas por framework', 'Tokens CSS + relatório de contraste WCAG', 'Especificação de cada seção com conteúdo real', 'Requisitos de SEO, acessibilidade e performance', 'Plano de execução e critérios de aceite', 'Versão em português ou inglês'].map((x) => (
                <li key={x}><Check size={16} />{x}</li>
              ))}
            </ul>
            <a href="#studio" className="lp-btn lp-btn-primary" style={{ marginTop: 28 }}>Gerar meu prompt <ArrowRight size={15} /></a>
          </div>
          <div className="lp-terminal" data-reveal>
            <div className="lp-term-bar"><i /><i /><i /><span>CLAUDE_PROMPT.md</span></div>
            <Typewriter text={demo?.prompt ?? ''} />
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
      <section className="lp-section" id="plataformas">
        <div className="lp-container">
          <div className="lp-head" data-reveal>
            <span className="lp-eyebrow">Plataformas</span>
            <h2 className="lp-h2">Onde você <span className="lp-serif">trabalha</span>.</h2>
          </div>
          <div className="lp-platforms">
            <div className="lp-platform" data-reveal>
              <Monitor size={26} />
              <h3>App Desktop</h3>
              <p>Electron nativo para macOS, Windows e Linux. Menus nativos, salvar/abrir arquivos <code>.fwstudio</code> e funcionamento offline.</p>
              <code className="lp-cmd">npm run desktop:build</code>
            </div>
            <div className="lp-platform" data-reveal style={{ transitionDelay: '80ms' }}>
              <Container size={26} />
              <h3>Docker</h3>
              <p>Imagem multi-stage com nginx, headers de segurança e healthcheck. Suba para todo o time em segundos.</p>
              <code className="lp-cmd">docker compose up -d</code>
            </div>
            <div className="lp-platform" data-reveal style={{ transitionDelay: '160ms' }}>
              <Code2 size={26} />
              <h3>Web</h3>
              <p>React 19 + TypeScript + Vite. Build estático que roda em qualquer host — Vercel, Netlify, S3 ou seu servidor.</p>
              <code className="lp-cmd">npm run dev</code>
            </div>
          </div>
          <div className="lp-trust" data-reveal>
            <span><Zap size={15} /> Autosave local</span>
            <span><Undo2 size={15} /> 150 passos de histórico</span>
            <span><ShieldCheck size={15} /> Seus dados ficam com você</span>
            <span><Gauge size={15} /> Export Lighthouse-ready</span>
            <span><Braces size={15} /> Tokens W3C</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-final" data-reveal>
            <div className="lp-aurora small" aria-hidden="true"><i /><i /><i /></div>
            <h2 className="lp-h2" style={{ position: 'relative' }}>Seu próximo site começa<br /><span className="lp-serif">agora.</span></h2>
            <p className="lp-sub" style={{ position: 'relative' }}>Abra o Studio, escolha um template e gere seu primeiro prompt em menos de cinco minutos.</p>
            <div className="lp-cta" style={{ justifyContent: 'center', position: 'relative' }}>
              <a href="#studio" className="lp-btn lp-btn-primary lp-btn-lg">Abrir Frameworks Studio <ArrowRight size={16} /></a>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <a href="#" className="lp-brand"><span className="logo"><Logo size={16} /></span>Frameworks</a>
          <span>© {new Date().getFullYear()} Frameworks Studio. Feito para quem constrói.</span>
          <span className="lp-footer-links"><a href="#studio">Studio</a><a href="https://docs.claude.com/en/docs/claude-code/overview" target="_blank" rel="noreferrer">Claude Code</a><a href="https://github.com/edpl22/Frameworks" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={16} /></a></span>
        </div>
      </footer>
    </div>
  );
}
