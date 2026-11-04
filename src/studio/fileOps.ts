import { useStore } from '../core/store';
import { parseProject, projectJSON } from '../core/exporters';
import { desktop, pickTextFile, saveAs } from '../core/platform';

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'projeto';

export async function saveProject(forceDialog = false) {
  const st = useStore.getState();
  const json = projectJSON(st.project);
  const d = desktop();
  if (d && st.filePath && !forceDialog) {
    const ok = await d.writeFile(st.filePath, json);
    if (ok) { st.markSaved(); st.toast('Projeto salvo'); return; }
  }
  const path = await saveAs(`${slugify(st.project.brief.projectName)}.fwstudio`, json, 'application/json');
  if (path) {
    st.markSaved(d ? path : st.filePath);
    st.toast(d ? 'Projeto salvo' : 'Projeto baixado (.fwstudio)');
  }
}

export async function openProjectFile() {
  const st = useStore.getState();
  const file = await pickTextFile();
  if (!file) return;
  try {
    const p = parseProject(file.content);
    st.loadProject(p, desktop() ? file.name : null);
    st.toast(`“${p.brief.projectName}” aberto`);
  } catch (e) {
    st.toast((e as Error).message || 'Não foi possível abrir o arquivo', 'error');
  }
}
