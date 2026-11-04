import { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Wand2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore } from '../core/store';
import { auditProject, type AuditCategory, type Issue, type Severity } from '../core/audit';

const ICON: Record<Severity, React.ReactNode> = {
  error: <AlertCircle size={14} />,
  warning: <AlertTriangle size={14} />,
  info: <Info size={14} />,
};
const LABEL: Record<Severity, string> = { error: 'Erros', warning: 'Avisos', info: 'Sugestões' };

export function useAudit() {
  const project = useStore((s) => s.project);
  return useMemo(() => auditProject(project), [project]);
}

function scoreTone(score: number) {
  return score >= 90 ? 'ok' : score >= 70 ? 'warn' : 'err';
}

export function AuditPanel() {
  const { issues, score, counts } = useAudit();
  const { commit, set, select, toast } = useStore.getState();
  const [sev, setSev] = useState<Severity | 'all'>('all');
  const [cat, setCat] = useState<AuditCategory | 'all'>('all');
  const cats = Array.from(new Set(issues.map((i) => i.category)));
  const shown = issues.filter((i) => (sev === 'all' || i.severity === sev) && (cat === 'all' || i.category === cat));
  const fixable = issues.filter((i) => i.fix);

  const go = (i: Issue) => {
    if (i.pageId) set({ activePageId: i.pageId });
    if (i.sectionId) {
      select(i.sectionId);
      requestAnimationFrame(() => document.querySelector(`[data-section-id="${i.sectionId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } else if (i.category === 'Briefing') {
      set({ rightTab: 'brief', selectedId: null });
    } else if (i.id.startsWith('contrast')) {
      set({ rightTab: 'theme', selectedId: null });
    } else if (i.pageId) {
      set({ leftTab: 'pages', selectedId: null });
    }
  };
  const fixOne = (i: Issue) => { if (i.fix) { commit(i.fix); toast('Corrigido'); } };
  const fixAll = () => {
    commit((p) => fixable.reduce((acc, i) => (i.fix ? i.fix(acc) : acc), p));
    toast(`${fixable.length} problema(s) corrigido(s)`);
  };

  const C = 2 * Math.PI * 30;
  return (
    <>
      <div className="panel-head">
        <div>
          <div className="panel-title">Qualidade</div>
          <div className="panel-sub">Acessibilidade, SEO, conteúdo e links</div>
        </div>
      </div>
      <div className="panel-body">
        <div className={'audit-score ' + scoreTone(score)}>
          <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
            <circle cx="38" cy="38" r="30" className="track" />
            <circle cx="38" cy="38" r="30" className="bar" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
          </svg>
          <b>{score}</b>
          <div>
            <div className="audit-score-title">{score >= 90 ? 'Excelente' : score >= 70 ? 'Bom, com ajustes' : 'Precisa de atenção'}</div>
            <div className="audit-counts">
              {(['error', 'warning', 'info'] as Severity[]).map((s) => (
                <button key={s} className={'audit-count ' + s + (sev === s ? ' on' : '')} onClick={() => setSev(sev === s ? 'all' : s)}>
                  {ICON[s]} {counts[s]} <span>{LABEL[s]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {fixable.length > 0 && (
          <button className="btn btn-primary btn-sm" style={{ width: '100%', marginBottom: 12 }} onClick={fixAll}>
            <Wand2 size={13} /> Corrigir automaticamente ({fixable.length})
          </button>
        )}

        {cats.length > 1 && (
          <div className="chips" style={{ marginBottom: 12 }}>
            <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>Todas</button>
            {cats.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
          </div>
        )}

        {!issues.length && (
          <div className="empty-insp" style={{ padding: '24px 8px' }}>
            <div className="orb" style={{ color: 'var(--ok)' }}><CheckCircle2 size={26} /></div>
            <div style={{ color: 'var(--text)', fontWeight: 600 }}>Nenhum problema encontrado</div>
          </div>
        )}

        <div className="audit-list">
          {shown.map((i) => (
            <div key={i.id} className={'audit-item ' + i.severity}>
              <span className="audit-ic">{ICON[i.severity]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="audit-msg">{i.message}</div>
                {i.hint && <div className="audit-hint">{i.hint}</div>}
                <div className="audit-actions">
                  <span className="audit-cat">{i.category}</span>
                  {(i.sectionId || i.pageId || i.category === 'Briefing' || i.id.startsWith('contrast')) && (
                    <button className="btn btn-ghost btn-sm" onClick={() => go(i)}>Ver <ArrowRight size={12} /></button>
                  )}
                  {i.fix && <button className="btn btn-sm" onClick={() => fixOne(i)}><Wand2 size={12} /> {i.fixLabel ?? 'Corrigir'}</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 14 }}>Erros e avisos que restarem entram no prompt como “Pendências conhecidas” para o Claude Code resolver.</p>
      </div>
    </>
  );
}
