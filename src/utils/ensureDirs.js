// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Ensure all required directories exist at startup
// ─────────────────────────────────────────────────────────────────
import fs from 'fs';
import { config } from '../config/index.js';

export function ensureDirs() {
  const dirs = [
    config.storage.products,
    config.storage.fingerprinted,
    config.storage.logs,
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[RaPaX™] Created directory: ${dir}`);
    }
  }
}
