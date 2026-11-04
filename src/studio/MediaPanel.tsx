import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload, X, Library, Link2 } from 'lucide-react';
import { useStore } from '../core/store';
import { assetIdOf, assetRef, collectAssetIds, formatBytes, isAssetRef, useAssetUrls, type AssetMeta } from '../core/assets';
import { removeAsset, uploadImages } from './assetOps';

export { DND_ASSET_TYPE as DND_ASSET } from '../core/render/editable';
import { DND_ASSET_TYPE as DND_ASSET } from '../core/render/editable';

function useAssets(): AssetMeta[] {
  const assets = useStore((s) => s.project.assets);
  return useMemo(() => Object.values(assets ?? {}).sort((a, b) => b.createdAt - a.createdAt), [assets]);
}

function Thumb({ id, className }: { id: string; className?: string }) {
  const url = useAssetUrls((s) => s.urls[id]);
  return url ? <img src={url} alt="" className={className} draggable={false} /> : <div className={className + ' media-missing'} />;
}

/** Left-panel tab: the project's media library. */
export function MediaPanel() {
  const assets = useAssets();
  const project = useStore((s) => s.project);
  const used = useMemo(() => new Set(collectAssetIds(project)), [project]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const total = assets.reduce((n, a) => n + a.size, 0);

  return (
    <>
      <div className="panel-head">
        <div>
          <div className="panel-title">Mídia</div>
          <div className="panel-sub">{assets.length} imagens · {formatBytes(total)}</div>
        </div>
        <button className="btn btn-sm" onClick={() => input.current?.click()}><Upload size={13} /> Enviar</button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) uploadImages(e.target.files); e.target.value = ''; }} />
      </div>
      <div
        className={'panel-body media-body' + (dragging ? ' dragging' : '')}
        onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragging(true); } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) uploadImages(e.dataTransfer.files); }}
      >
        {!assets.length && (
          <button className="media-empty" onClick={() => input.current?.click()}>
            <ImagePlus size={26} />
            <b>Arraste imagens para cá</b>
            <span>PNG, JPG, WebP, SVG ou GIF · otimizadas automaticamente</span>
          </button>
        )}
        <p className="hint" style={{ margin: '0 0 12px' }}>Arraste uma imagem da biblioteca para qualquer foto do canvas, ou clique em “Enviar imagem” direto na seção.</p>
        <div className="media-grid">
          {assets.map((a) => (
            <div
              key={a.id}
              className="media-item"
              draggable
              onDragStart={(e) => { e.dataTransfer.setData(DND_ASSET, assetRef(a.id)); e.dataTransfer.effectAllowed = 'copy'; }}
              title={`${a.name}\n${a.width}×${a.height} · ${formatBytes(a.size)}`}
            >
              <Thumb id={a.id} className="media-thumb" />
              {used.has(a.id) && <span className="media-used">em uso</span>}
              <div className="media-meta">
                <span className="media-name">{a.name}</span>
                <span>{a.width}×{a.height} · {formatBytes(a.size)}</span>
              </div>
              <button
                className="media-del"
                title="Excluir"
                onClick={() => {
                  if (used.has(a.id) && !window.confirm(`“${a.name}” está em uso no projeto. Excluir mesmo assim? As seções voltarão ao placeholder.`)) return;
                  removeAsset(a.id);
                }}
              ><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** Inspector control for image props: upload, pick from library, URL or clear. */
export function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const assets = useAssets();
  const [picking, setPicking] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const isAsset = isAssetRef(value);
  const meta = isAsset ? assets.find((a) => a.id === assetIdOf(value)) : undefined;
  const liveUrl = useAssetUrls((s) => (isAsset ? s.urls[assetIdOf(value)] : undefined));
  const preview = isAsset ? liveUrl : value || undefined;

  return (
    <div
      className="img-field"
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes(DND_ASSET)) e.preventDefault(); }}
      onDrop={async (e) => {
        e.preventDefault();
        const ref = e.dataTransfer.getData(DND_ASSET);
        if (ref) return onChange(ref);
        if (e.dataTransfer.files.length) { const [r] = await uploadImages([e.dataTransfer.files[0]]); if (r) onChange(r); }
      }}
    >
      <div className="img-field-row">
        <div className="img-field-preview">{preview ? <img src={preview} alt="" /> : <ImagePlus size={16} />}</div>
        <div className="img-field-info">
          <span>{meta ? meta.name : value ? 'URL externa' : 'Placeholder'}</span>
          <small>{meta ? `${meta.width}×${meta.height} · ${formatBytes(meta.size)}` : value ? value.replace(/^https?:\/\//, '').slice(0, 34) : 'Envie, arraste ou escolha da biblioteca'}</small>
        </div>
        {value && <button className="btn btn-ghost btn-icon btn-sm" title="Remover imagem" onClick={() => onChange('')}><X size={13} /></button>}
      </div>
      <div className="img-field-actions">
        <button className="btn btn-sm" onClick={() => input.current?.click()}><Upload size={12} /> Enviar</button>
        <button className={'btn btn-sm' + (picking ? ' active' : '')} onClick={() => setPicking((p) => !p)} disabled={!assets.length}><Library size={12} /> Biblioteca</button>
        <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const [r] = await uploadImages([f]); if (r) onChange(r); } }} />
      </div>
      {picking && (
        <div className="img-picker">
          {assets.map((a) => (
            <button key={a.id} className={assetRef(a.id) === value ? 'on' : ''} title={a.name} onClick={() => { onChange(assetRef(a.id)); setPicking(false); }}>
              <Thumb id={a.id} className="img-picker-thumb" />
            </button>
          ))}
        </div>
      )}
      <div className="img-field-url">
        <Link2 size={12} />
        <input className="input" placeholder="https://… (URL externa)" value={isAsset ? '' : value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
