import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Launching headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    'http://localhost:3000',
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const tabs = await listRes.json();
    console.log('Available tabs:', tabs.length);
    const tab = tabs.find((t) => t.type === 'page');
    if (!tab) throw new Error('No page tab found');

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));
    console.log('Connected to Chrome DevTools Protocol via WebSocket');

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.result?.exceptionDetails) {
        console.error('Evaluate Exception:', JSON.stringify(res.result.exceptionDetails));
      }
      return res.result?.result?.value;
    }

    async function captureScreenshot(filename, width = 1920, height = 1080) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(300);
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.result.data, 'base64');
      const outPath = path.resolve('public', filename);
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved screenshot: ${outPath} (${width}x${height})`);
      return outPath;
    }

    await send('Page.enable');

    // Wait for page load
    await sleep(2000);

    // 0. Capture Home Screen with Authentic Sliced RPG Buttons
    console.log('0. Capturing Home Screen with authentic RPG buttons...');
    await evaluate(`window.__gameStore.getState().setPage('home');`);
    await sleep(1000);
    await captureScreenshot('test_home_buttons.png', 1920, 1080);

    // 0b. Capture Online Lobby Modal (Create & Join)
    console.log('0b. Capturing Online Lobby Modal...');
    await evaluate(`window.__gameStore.getState().setPage('play');`);
    await sleep(800);
    await evaluate(`
      const onlineCard = document.querySelectorAll('main > div')[1];
      if (onlineCard) onlineCard.click();
    `);
    await sleep(800);
    await captureScreenshot('test_online_lobby.png', 1920, 1080);

    // 1. Capture Menu & Mode Selector
    console.log('1. Navigating to Play Menu & Mode Selector...');
    await evaluate(`window.__gameStore.getState().setPage('play');`);
    await sleep(800);
    // Click Choose Mode & Arena
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CHOOSE MODE') || b.textContent.includes('VÀO CHỌN'));
      if (btn) btn.click();
    `);
    await sleep(800);
    await captureScreenshot('test_mode_select.png', 1920, 1080);

    // 2. Capture Character Customizer with a complete custom outfit
    console.log('2. Navigating to Character Customizer...');
    await evaluate(`
      const store = window.__gameStore.getState();
      store.setPage('character');
      store.updateCharacter({
        baseIndex: 2, // Titan
        hairIndex: 4,
        hairColor: '#38bdf8',
        skinColor: '#fcd34d',
        shirtIndex: 5,
        shirtColor: '#ef4444',
        pantsIndex: 7,
        pantsColor: '#1e293b',
        accessoryIndex: 6, // Cape behind body
        faceIndex: 3,
      });
    `);
    await sleep(1000);
    await captureScreenshot('test_customizer.png', 1920, 1080);

    // 3. Capture Battle Screen: 1. Start of Turn (Before Rolling)
    console.log('3. Starting a battle match (Start of Turn)...');
    const startRes = await evaluate(`
      (() => {
        const store = window.__gameStore.getState();
        const b = store.startNewBattle({
          mode: 'pve',
          mapId: 'castle',
          opponentName: 'Shadow Overlord (AI)',
        });
        return { currentPage: window.__gameStore.getState().currentPage, battleId: b?.id };
      })()
    `);
    console.log('startNewBattle result:', startRes);
    await sleep(1500);
    await captureScreenshot('test_battle_start.png', 1920, 1080);

    // 4. Capture Battle Screen: 2. Just Rolled Dice with Comparison Formula
    console.log('4. Rolling D20 and D6 in Battle...');
    await evaluate(`
      (() => {
        const rollD20Btn = Array.from(document.querySelectorAll('button')).find(
          b => b.title?.toLowerCase().includes('roll') ||
               b.querySelector('img[alt="ROLL DICE"]') ||
               b.textContent.includes('ROLL D20')
        );
        if (rollD20Btn) rollD20Btn.click();
        const rollD6Btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ROLL D6') || b.textContent.includes('TUNG D6'));
        if (rollD6Btn) rollD6Btn.click();
      })()
    `);
    // Wait for dice roll animations (900ms) to settle and capture damage popup
    await sleep(1300);
    await captureScreenshot('test_battle_damage.png', 1920, 1080);
    await sleep(900);
    await captureScreenshot('test_battle_rolled.png', 1920, 1080);

    // 5. Capture Battle Screen: 3. Skill Activation / Victory Modal
    console.log('5. Triggering Victory / Game Over...');
    await evaluate(`
      (() => {
        const store = window.__gameStore.getState();
        const bs = store.battleState;
        if (bs) {
          store.setBattleState({
            ...bs,
            player2: { ...bs.player2, hp: 0 },
            winnerId: bs.player1.id,
            phase: 'game_over'
          });
        }
      })()
    `);
    await sleep(1200);
    await captureScreenshot('test_battle_victory.png', 1920, 1080);

    // 6. Responsive Viewport Checks
    console.log('6. Checking responsive viewports...');
    // Reset to active battle
    await evaluate(`
      (() => {
        const store = window.__gameStore.getState();
        store.startNewBattle({
          mode: 'pve',
          mapId: 'desert',
          opponentName: 'Sand Wraith (AI)',
        });
      })()
    `);
    await sleep(1000);
    await captureScreenshot('test_battle_1366x768.png', 1366, 768);
    await captureScreenshot('test_battle_1280x720.png', 1280, 720);

    console.log('All screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error in capture script:', err);
  } finally {
    chrome.kill();
  }
}

main();
