import type { ReactNode } from 'react';
import { Monitor, Tablet, Smartphone, Undo2, Redo2, Eye, EyeOff, Grid3x3, Download, Sparkles, Command, Minus, Plus, LayoutTemplate, FolderOpen, Save } from 'lucide-react';
import { useStore } from '../core/store';
import type { Device } from '../core/types';
import { Segmented, mod } from './ui';
import { isDesktop } from '../core/platform';
import { openProjectFile, saveProject } from './fileOps';

export function Logo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs><linearGradient id="lg-fw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c4b5fd" /><stop offset="1" stopColor="#22d3ee" /></linearGradient></defs>
      <path d="M5 4h14v4H9.5v3H17v4H9.5v5H5z" fill="url(#lg-fw)" />
    </svg>
  );
}

export function TopBar() {
  const s = useStore();
  const devices: { value: Device; icon: ReactNode; title: string }[] = [
    { value: 'desktop', icon: <Monitor size={14} />, title: 'Desktop (1440px)' },
    { value: 'tablet', icon: <Tablet size={14} />, title: 'Tablet (820px)' },
    { value: 'mobile', icon: <Smartphone size={14} />, title: 'Mobile (390px)' },
  ];
  const setZoom = (z: number) => s.set({ zoom: Math.max(0.25, Math.min(2, Math.round(z * 100) / 100)) });

  return (
    <header className="topbar">
      <a className="brand-mark" href="#/" title="Página inicial" style={isDesktop() ? { pointerEvents: 'none', paddingLeft: navigator.platform.includes('Mac') ? 64 : 0 } : undefined}>
        <span className="logo"><Logo /></span>
        <span className="tb-hide-md">Frameworks</span>
      </a>
      <div className="tb-sep" />
      <input className="project-name" value={s.project.brief.projectName} onChange={(e) => s.setBrief({ projectName: e.target.value })} aria-label="Nome do projeto" />
      {s.dirty && isDesktop() && <span className="dirty-dot" title="Alterações não salvas" />}
      <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="Templates" onClick={() => s.set({ modal: 'templates' })} aria-label="Templates"><LayoutTemplate size={15} /></button>
      <button className="btn btn-ghost btn-icon btn-sm" title={`Abrir projeto (${mod}+O)`} onClick={openProjectFile} aria-label="Abrir"><FolderOpen size={15} /></button>
      <button className="btn btn-ghost btn-icon btn-sm" title={`Salvar projeto (${mod}+S)`} onClick={() => saveProject()} aria-label="Salvar"><Save size={15} /></button>

      <div className="spacer" />

      <div className="tb-center">
        <button className="btn btn-ghost btn-icon btn-sm" title={`Desfazer (${mod}+Z)`} disabled={!s.past.length} onClick={s.undo} aria-label="Desfazer"><Undo2 size={15} /></button>
        <button className="btn btn-ghost btn-icon btn-sm" title={`Refazer (${mod}+Shift+Z)`} disabled={!s.future.length} onClick={s.redo} aria-label="Refazer"><Redo2 size={15} /></button>
        <div className="tb-sep" />
        <div style={{ width: 120 }}>
          <Segmented value={s.device} onChange={(d) => s.set({ device: d })} options={devices} />
        </div>
        <div className="zoom-group" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setZoom(s.zoom - 0.1)} aria-label="Diminuir zoom"><Minus size={13} /></button>
          <span className="zoom-label" title="Escala real — clique para ajustar à tela" onClick={() => setZoom(1)}>{Math.round(s.fitScale * 100)}%</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setZoom(s.zoom + 0.1)} aria-label="Aumentar zoom"><Plus size={13} /></button>
        </div>
        <div className="tb-sep" />
        <button className={'btn btn-ghost btn-icon btn-sm' + (s.showGrid ? ' active' : '')} title="Grade de 12 colunas (G)" onClick={() => s.set({ showGrid: !s.showGrid })} aria-label="Grade"><Grid3x3 size={15} /></button>
        <button className={'btn btn-ghost btn-icon btn-sm' + (s.preview ? ' active' : '')} title={`Preview (${mod}+P)`} onClick={() => s.set({ preview: !s.preview, selectedId: null })} aria-label="Preview">{s.preview ? <EyeOff size={15} /> : <Eye size={15} />}</button>
      </div>

      <div className="spacer" />

      <button className="btn btn-sm tb-hide-md" onClick={() => s.set({ palette: true })} style={{ gap: 10, color: 'var(--text-3)' }}>
        <Command size={13} /> Comandos <span className="kbd">{mod} K</span>
      </button>
      <button className="btn btn-sm" onClick={() => s.set({ modal: 'export' })}><Download size={14} /> Exportar</button>
      <button className="btn btn-primary btn-sm btn-glow" onClick={() => s.set({ modal: 'prompt' })} style={{ height: 32, padding: '0 14px' }}>
        <Sparkles size={14} /> Gerar prompt
      </button>
    </header>
  );
}
