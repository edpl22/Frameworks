import { useStore } from '../core/store';
import { uid } from '../core/factory';
import { assetRef, deleteBlob, processImage, putBlob, useAssetUrls, type AssetMeta } from '../core/assets';

/** Processes, stores and registers an image. Returns its `asset:` ref (or null on failure). */
export async function uploadImage(file: File): Promise<string | null> {
  const st = useStore.getState();
  try {
    const { blob, type, width, height } = await processImage(file);
    const id = uid('img');
    await putBlob(id, blob);
    useAssetUrls.getState().register(id, blob);
    const meta: AssetMeta = { id, name: file.name, type, width, height, size: blob.size, createdAt: Date.now() };
    st.commit((p) => ({ ...p, assets: { ...(p.assets ?? {}), [id]: meta } }), 'asset-upload');
    return assetRef(id);
  } catch (e) {
    st.toast((e as Error).message || 'Falha ao enviar a imagem', 'error');
    return null;
  }
}

export async function uploadImages(files: FileList | File[]): Promise<string[]> {
  const refs: string[] = [];
  for (const f of Array.from(files)) {
    const r = await uploadImage(f);
    if (r) refs.push(r);
  }
  if (refs.length) useStore.getState().toast(refs.length === 1 ? 'Imagem adicionada à biblioteca' : `${refs.length} imagens adicionadas`);
  return refs;
}

export async function removeAsset(id: string) {
  const st = useStore.getState();
  st.commit((p) => {
    const { [id]: _gone, ...rest } = p.assets ?? {};
    return { ...p, assets: rest };
  });
  try { await deleteBlob(id); } catch { /* ignore */ }
  useAssetUrls.getState().forget(id);
}
