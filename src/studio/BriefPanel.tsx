import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useStore } from '../core/store';
import { STACKS } from '../core/prompt';
import type { TargetStack } from '../core/types';
import { Field, TextInput, TextArea, Select } from './ui';

const TONES = ['Premium', 'Confiante', 'Moderno', 'Elegante', 'Ousado', 'Minimalista', 'Amigável', 'Técnico', 'Divertido', 'Sofisticado', 'Inovador', 'Acolhedor', 'Direto', 'Atemporal', 'Criativo'];
const FEATURE_SUGGESTIONS = [
  'Formulário de contato funcional', 'SEO técnico completo', 'Animações on-scroll', 'Modo escuro', 'Blog com MDX', 'Internacionalização (i18n)',
  'Integração com Stripe', 'Analytics (GA4 / Plausible)', 'Newsletter (Resend / Mailchimp)', 'Autenticação de usuários', 'CMS headless (Sanity)', 'Chat ao vivo / WhatsApp',
  'Banner de cookies LGPD', 'Agendamento (Cal.com)', 'PWA instalável', 'Deploy na Vercel',
];

export function BriefPanel() {
  const b = useStore((s) => s.project.brief);
  const setBrief = useStore((s) => s.setBrief);
  const [custom, setCustom] = useState('');
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="panel-body" style={{ paddingTop: 14 }}>
      <p className="hint" style={{ marginTop: 0 }}>O briefing dá contexto de negócio ao prompt gerado — quanto mais preciso, melhor o resultado do Claude Code.</p>
      <div className="group">
        <div className="group-title">Identidade</div>
        <Field label="Nome do projeto"><TextInput value={b.projectName} onChange={(v) => setBrief({ projectName: v })} /></Field>
        <Field label="Tagline"><TextInput value={b.tagline} onChange={(v) => setBrief({ tagline: v })} /></Field>
        <Field label="Segmento"><TextInput value={b.industry} onChange={(v) => setBrief({ industry: v })} /></Field>
        <Field label="Idioma do site">
          <Select value={b.language} onChange={(v) => setBrief({ language: v })} options={[{ value: 'pt-BR', label: 'Português (BR)' }, { value: 'en', label: 'English' }, { value: 'es', label: 'Español' }, { value: 'fr', label: 'Français' }, { value: 'de', label: 'Deutsch' }]} />
        </Field>
      </div>
      <div className="group">
        <div className="group-title">Estratégia</div>
        <Field label="Objetivo principal"><TextArea value={b.goal} onChange={(v) => setBrief({ goal: v })} rows={2} /></Field>
        <Field label="Público-alvo"><TextArea value={b.audience} onChange={(v) => setBrief({ audience: v })} rows={2} /></Field>
        <Field label="Tom de voz">
          <div className="chips">{TONES.map((t) => <button key={t} className={'chip' + (b.tone.includes(t) ? ' on' : '')} onClick={() => setBrief({ tone: toggle(b.tone, t) })}>{t}</button>)}</div>
        </Field>
      </div>
      <div className="group">
        <div className="group-title">Stack de destino</div>
        <div className="stack-grid">
          {(Object.keys(STACKS) as TargetStack[]).map((k) => (
            <button key={k} className={'stack-card' + (b.stack === k ? ' on' : '')} onClick={() => setBrief({ stack: k })}>
              <b>{STACKS[k].label.split(' + ')[0]}</b>{STACKS[k].label.split(' + ').slice(1).join(' + ') || 'Sem framework'}
            </button>
          ))}
        </div>
      </div>
      <div className="group">
        <div className="group-title">Funcionalidades</div>
        <div className="chips" style={{ marginBottom: 10 }}>
          {Array.from(new Set([...FEATURE_SUGGESTIONS, ...b.features])).map((f) => (
            <button key={f} className={'chip' + (b.features.includes(f) ? ' on' : '')} onClick={() => setBrief({ features: toggle(b.features, f) })}>
              {f}{b.features.includes(f) && !FEATURE_SUGGESTIONS.includes(f) && <X size={11} />}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input" placeholder="Outra funcionalidade…" value={custom} onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && custom.trim()) { setBrief({ features: [...b.features, custom.trim()] }); setCustom(''); } }} />
          <button className="btn btn-icon" onClick={() => { if (custom.trim()) { setBrief({ features: [...b.features, custom.trim()] }); setCustom(''); } }} aria-label="Adicionar"><Plus size={14} /></button>
        </div>
      </div>
      <div className="group">
        <div className="group-title">Contexto extra</div>
        <Field label="Referências / inspirações"><TextArea value={b.references} onChange={(v) => setBrief({ references: v })} placeholder="linear.app, stripe.com, vercel.com…" rows={2} /></Field>
        <Field label="Instruções adicionais"><TextArea value={b.extraInstructions} onChange={(v) => setBrief({ extraInstructions: v })} placeholder="Restrições, integrações, requisitos legais…" rows={4} /></Field>
      </div>
    </div>
  );
}
