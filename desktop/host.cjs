const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const { loadEnvConfig } = require(require.resolve('@next/env', { paths: [root] }));

async function main() {
  loadEnvConfig(root);
  const settings = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET,
  };
  const missing = Object.keys(settings).filter(name => !settings[name]?.trim());
  if (missing.length) {
    throw new Error(`Điền các biến sau trong .env.local: ${missing.join(', ')}`);
  }

  const url = new URL(settings.NEXT_PUBLIC_SUPABASE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL phải là địa chỉ HTTPS gốc của dự án.');
  }
  const serviceKey = settings.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = settings.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey === serviceKey || anonKey.startsWith('sb_secret_')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY phải dùng khóa công khai riêng.');
  }
  if (anonKey.split('.').length === 3) {
    const [, payload] = anonKey.split('.');
    let role;
    try {
      role = JSON.parse(Buffer.from(payload, 'base64url')).role;
    } catch {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY không phải JWT hợp lệ.');
    }
    if (role !== 'anon') throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY phải dùng JWT có role anon.');
  }

  const { createClient } = require(require.resolve('@supabase/supabase-js', { paths: [root] }));
  const db = createClient(url.origin, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, options) => fetch(input, { ...options, signal: AbortSignal.timeout(10000) }) },
  });
  const [authCheck, ...tables] = await Promise.all([
    fetch(new URL('/auth/v1/settings', url), { headers: { apikey: anonKey }, signal: AbortSignal.timeout(10000) }),
    db.from('users').select('id', { head: true }).limit(1),
    db.from('rooms').select('code', { head: true }).limit(1),
  ]);
  if (!authCheck.ok) throw new Error(`Supabase từ chối khóa công khai (HTTP ${authCheck.status}).`);
  for (const [index, result] of tables.entries()) {
    if (result.error) {
      throw new Error(`Không đọc được bảng ${['users', 'rooms'][index]} trên Supabase (${result.error.code || 'lỗi kết nối'}).`);
    }
  }
  console.log('Supabase đã phản hồi cho khóa công khai và các bảng tài khoản, phòng đấu.');
  if (process.argv.includes('--check')) return;

  const next = require.resolve('next/dist/bin/next', { paths: [root] });
  const server = spawn(process.execPath, [next, 'start', '--hostname', '127.0.0.1', '--port', '3000'], {
    cwd: root,
    stdio: 'inherit',
  });
  server.on('exit', code => { process.exitCode = code ?? 0; });
  server.on('error', () => {
    console.error('Không khởi động được máy chủ Dice Maniac.');
    process.exitCode = 1;
  });
}

main().catch(error => {
  console.error(error instanceof TypeError ? 'Không kết nối được Supabase. Kiểm tra URL và mạng.' : error.message);
  process.exitCode = 1;
});
