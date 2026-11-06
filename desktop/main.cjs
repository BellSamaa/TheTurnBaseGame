const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const setupPage = path.join(__dirname, 'connect.html');
const setupUrl = pathToFileURL(setupPage).href;
let window;
let server;

function parseServer(value) {
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Nhập địa chỉ HTTPS của máy chủ, ví dụ https://game.example.com.');
  }
  return url.origin;
}

function settingsFile() {
  return path.join(app.getPath('userData'), 'server.json');
}

async function showSetup() {
  await window.loadFile(setupPage);
}

async function openGame() {
  try {
    await window.loadURL(server);
  } catch (error) {
    if (error.code === 'ERR_ABORTED' || window.isDestroyed()) return;
    await showSetup();
    window.webContents.send('server-unavailable');
  }
}

function requireSetup(event) {
  if (event.sender !== window.webContents || event.senderFrame?.url !== setupUrl) {
    throw new Error('Server settings are available only in the app setup screen.');
  }
}

app.whenReady().then(async () => {
  try {
    server = parseServer(JSON.parse(await readFile(settingsFile(), 'utf8')).server);
  } catch {
    server = undefined;
  }

  window = new BrowserWindow({
    title: 'Dice Maniac',
    width: 1280,
    height: 800,
    minWidth: 850,
    minHeight: 560,
    backgroundColor: '#0d1325',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const guardNavigation = (event, url) => {
    if (url === setupUrl || (server && URL.canParse(url) && new URL(url).origin === server)) return;
    event.preventDefault();
  };
  window.webContents.on('will-navigate', guardNavigation);
  window.webContents.on('will-redirect', guardNavigation);
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  window.webContents.session.setPermissionCheckHandler(() => false);

  ipcMain.handle('get-server', event => {
    requireSetup(event);
    return server ?? '';
  });
  ipcMain.handle('connect-server', async (event, value) => {
    requireSetup(event);
    let address;
    try {
      address = parseServer(value);
    } catch {
      return 'Nhập địa chỉ HTTPS của máy chủ, ví dụ https://game.example.com.';
    }
    await writeFile(settingsFile(), JSON.stringify({ server: address }), 'utf8');
    server = address;
    void openGame();
    return '';
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Dice Maniac',
      submenu: [
        { label: 'Đổi máy chủ', click: () => void showSetup() },
        { label: 'Tải lại game', role: 'reload' },
        { label: 'Thoát', role: 'quit' },
      ],
    },
    { label: 'Hiển thị', submenu: [{ label: 'Toàn màn hình', role: 'togglefullscreen' }] },
  ]));

  await (server ? openGame() : showSetup());
});

app.on('window-all-closed', () => app.quit());
