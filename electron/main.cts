import { app, BrowserWindow, dialog, ipcMain, Menu, shell, nativeTheme, type MenuItemConstructorOptions } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const isDev = !!process.env.VITE_DEV_SERVER_URL;
let win: BrowserWindow | null = null;

function send(action: string) {
  win?.webContents.send('fw:menu', action);
}

function createWindow() {
  nativeTheme.themeSource = 'dark';
  win = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#07070c',
    title: 'Frameworks Studio',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => win?.show());

  // Open external links in the user's browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL + '#/studio');
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'), { hash: '/studio' });
  }
}

function buildMenu() {
  const mac = process.platform === 'darwin';
  const template: MenuItemConstructorOptions[] = [
    ...(mac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Novo a partir de template…', accelerator: 'CmdOrCtrl+N', click: () => send('new') },
        { label: 'Abrir projeto…', accelerator: 'CmdOrCtrl+O', click: () => send('open') },
        { type: 'separator' },
        { label: 'Salvar', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
        { label: 'Salvar como…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('save-as') },
        { type: 'separator' },
        { label: 'Exportar…', accelerator: 'CmdOrCtrl+E', click: () => send('export') },
        { label: 'Gerar prompt para Claude Code', accelerator: 'CmdOrCtrl+Enter', click: () => send('prompt') },
        { type: 'separator' },
        mac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Desfazer', accelerator: 'CmdOrCtrl+Z', click: () => send('undo') },
        { label: 'Refazer', accelerator: 'CmdOrCtrl+Shift+Z', click: () => send('redo') },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        { label: 'Paleta de comandos', accelerator: 'CmdOrCtrl+K', click: () => send('palette') },
        { label: 'Modo preview', accelerator: 'CmdOrCtrl+P', click: () => send('preview') },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        { label: 'Atalhos de teclado', accelerator: 'CmdOrCtrl+/', click: () => send('shortcuts') },
        { label: 'Documentação do Claude Code', click: () => shell.openExternal('https://docs.claude.com/en/docs/claude-code/overview') },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle('fw:save-file', async (_e, opts: { defaultPath: string; content: string | ArrayBuffer; filters?: Electron.FileFilter[] }) => {
  if (!win) return null;
  const { canceled, filePath } = await dialog.showSaveDialog(win, { defaultPath: opts.defaultPath, filters: opts.filters });
  if (canceled || !filePath) return null;
  const data = typeof opts.content === 'string' ? opts.content : Buffer.from(opts.content);
  await writeFile(filePath, data);
  return filePath;
});

ipcMain.handle('fw:write-file', async (_e, path: string, content: string) => {
  if (!path.endsWith('.fwstudio')) return false; // only project files can be silently overwritten
  await writeFile(path, content, 'utf8');
  return true;
});

ipcMain.handle('fw:open-project', async () => {
  if (!win) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Frameworks Studio', extensions: ['fwstudio', 'json'] }],
  });
  if (canceled || !filePaths[0]) return null;
  return { path: filePaths[0], content: await readFile(filePaths[0], 'utf8') };
});

ipcMain.on('fw:set-title', (_e, title: string) => win?.setTitle(title));
ipcMain.on('fw:open-external', (_e, url: string) => {
  if (/^https?:/.test(url)) shell.openExternal(url);
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
