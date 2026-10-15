import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let projectId = 'carbon-fragment-341j7';
try {
  const rootPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const relativePath = path.resolve(__dirname, '../../firebase-applet-config.json');
  const configPath = fs.existsSync(rootPath) ? rootPath : relativePath;
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.projectId) {
      projectId = parsed.projectId;
    }
  }
} catch (err) {
  console.warn('[AI Studio] Could not load firebase-applet-config.json, using fallback projectId:', err);
}

if (!getApps().length) {
  initializeApp({
    projectId,
  });
}

export const adminAuth = getAuth();

