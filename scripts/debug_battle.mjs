import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223;

async function run() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  const tabs = await res.json();
  const tab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let msgId = 1;
  const send = (method, params = {}) => new Promise(r => {
    const curId = msgId++;
    const handler = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        r(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  // Navigate to battle
  await send('Runtime.evaluate', {
    expression: 'window.__gameStore.getState().startNewBattle({ mode: "pve", mapId: "castle" });',
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 1500));

  // Check all images on page
  const evalRes = await send('Runtime.evaluate', {
    expression: 'Array.from(document.querySelectorAll("img")).map(i => ({ src: i.src, naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight, w: i.offsetWidth, h: i.offsetHeight }))',
    returnByValue: true
  });
  console.log('Images in battle:', evalRes.result?.value);

  // Take screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/test_check_battle_frame.png', Buffer.from(shot.data, 'base64'));
  console.log('Screenshot saved to public/test_check_battle_frame.png');

  ws.close();
  chrome.kill();
}
run();
