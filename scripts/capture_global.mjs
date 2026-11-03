import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9224;

async function run() {
  const p = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    'http://localhost:3000',
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const tabs = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
  const tab = tabs.find((t) => t.type === 'page');
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (m, params = {}) =>
    new Promise((res) => {
      const cur = id++;
      const handler = (e) => {
        const data = JSON.parse(e.data);
        if (data.id === cur) {
          ws.removeEventListener('message', handler);
          res(data);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params }));
    });

  await send('Runtime.evaluate', {
    expression: 'window.__gameStore.getState().setAuthModal("global")',
  });
  await new Promise((r) => setTimeout(r, 1200));

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(
    'C:/Users/truon/.gemini/antigravity/brain/b1b53591-595c-4730-ac8e-e3d56c07c35a/test_global_modal.png',
    Buffer.from(snap.result.data, 'base64')
  );
  console.log('Saved test_global_modal.png');

  ws.close();
  p.kill();
}

run();
