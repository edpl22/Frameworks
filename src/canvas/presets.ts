import { newElement, type CanvasEl, type ShapeKind } from '../core/canvas';
import { TEXT_PRESETS } from '../core/canvasKit';

/** dataTransfer type for elements dragged from the Canvas side panels. */
export const DND_ELEMENT = 'application/x-fw-el';

export const SHAPE_PRESETS: { key: string; label: string; make: () => CanvasEl }[] = [
  { key: 'rect', label: 'Retângulo', make: () => newElement('shape', { shape: 'rect', span: 3, rows: 3, fill: 'primary', radius: 16 }) },
  { key: 'pill', label: 'Pílula', make: () => newElement('shape', { shape: 'pill', span: 4, rows: 1, fill: 'secondary' }) },
  { key: 'circle', label: 'Círculo', make: () => newElement('shape', { shape: 'circle', span: 2, rows: 3, fill: 'accent' }) },
  { key: 'blob', label: 'Orgânica', make: () => newElement('shape', { shape: 'blob', span: 3, rows: 4, fill: 'gradient' }) },
  { key: 'ring', label: 'Anel', make: () => newElement('shape', { shape: 'ring', span: 3, rows: 4, fill: 'primary', radius: 3 }) },
  { key: 'line', label: 'Linha', make: () => newElement('shape', { shape: 'line', span: 6, rows: 1, fill: 'primary' }) },
  { key: 'orb', label: 'Brilho', make: () => newElement('shape', { shape: 'circle', span: 4, rows: 5, fill: 'primary', blur: 60, opacity: 0.6, mobileHidden: true }) },
  { key: 'card', label: 'Cartão', make: () => newElement('shape', { shape: 'rect', span: 4, rows: 5, fill: 'surface', radius: 20, shadow: true }) },
];

export const BUTTON_PRESETS: { key: string; label: string; make: () => CanvasEl }[] = [
  { key: 'primary', label: 'Principal', make: () => newElement('button', { variant: 'primary', text: 'Começar agora' }) },
  { key: 'secondary', label: 'Secundário', make: () => newElement('button', { variant: 'secondary', text: 'Saiba mais' }) },
  { key: 'ghost', label: 'Discreto', make: () => newElement('button', { variant: 'ghost', text: 'Ver detalhes →' }) },
];

export const ICON_PICKS = ['sparkles', 'zap', 'rocket', 'shield', 'heart', 'star', 'globe', 'cpu', 'code', 'palette', 'camera', 'leaf', 'gem', 'award', 'target', 'wand', 'users', 'chart', 'clock', 'coffee', 'box', 'layers', 'cloud', 'database', 'eye', 'book', 'feather', 'key', 'flame', 'moon', 'hourglass', 'crosshair', 'activity', 'bus', 'scroll', 'ticket'];

export function elementFromKey(key: string): CanvasEl | null {
  const [kind, arg] = key.split(':');
  switch (kind) {
    case 'text': return TEXT_PRESETS[Number(arg)]?.make() ?? null;
    case 'shape': return SHAPE_PRESETS.find((s) => s.key === arg)?.make() ?? null;
    case 'button': return BUTTON_PRESETS.find((s) => s.key === arg)?.make() ?? null;
    case 'icon': return newElement('icon', { icon: arg || 'sparkles', span: 1, rows: 1, color: 'primary' });
    case 'image': return newElement('image', { span: 5, rows: 6 });
    case 'badge': return newElement('badge', { text: 'Novidade' });
    case 'divider': return newElement('divider');
    default: return null;
  }
}

export const SHAPE_KINDS: { value: ShapeKind; label: string }[] = [
  { value: 'rect', label: 'Retângulo' }, { value: 'pill', label: 'Pílula' }, { value: 'circle', label: 'Círculo' },
  { value: 'blob', label: 'Orgânica' }, { value: 'ring', label: 'Anel' }, { value: 'line', label: 'Linha' }, { value: 'dot', label: 'Ponto' },
];
