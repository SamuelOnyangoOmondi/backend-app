#!/usr/bin/env node
/**
 * Wait for backend to be up, then run sync-from-Supa-School test.
 * Use this to confirm sync works before manually testing on the device.
 *
 * 1. Start backend in another terminal: npm run dev
 * 2. Run this: npm run test:sync-students:live
 *
 * Or against Railway: API_BASE_URL=https://your-app.railway.app npm run test:sync-students:live
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, 'test-sync-students.mjs');

const BASE = process.env.API_BASE_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000';
const url = BASE.replace(/\/$/, '') + '/health';
const maxAttempts = 30;
const intervalMs = 1000;

async function waitForBackend() {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (_) {}
    if (i < maxAttempts - 1) {
      process.stderr.write(`Waiting for backend at ${url}... (${i + 1}/${maxAttempts})\n`);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  return false;
}

async function main() {
  process.stderr.write('Checking backend is up before testing sync from Supa School...\n');
  const up = await waitForBackend();
  if (!up) {
    process.stderr.write(`Backend not reachable at ${url} after ${maxAttempts}s.\n`);
    process.stderr.write('Start it with: npm run dev\n');
    process.exit(1);
  }
  process.stderr.write('Backend is up. Running sync test.\n\n');

  const child = spawn('node', [scriptPath], {
    stdio: 'inherit',
    env: process.env,
    cwd: join(__dirname, '..'),
  });
  const code = await new Promise((resolve) => child.on('close', resolve));
  process.exit(code ?? 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
