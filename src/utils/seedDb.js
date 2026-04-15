// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Seed Script
//  Creates sample products and a test transaction for development.
// ─────────────────────────────────────────────────────────────────
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { initDb } from './initDb.js';
import { ProductModel } from '../models/productModel.js';
import { config } from '../config/index.js';

initDb();

// Create a stub product file
const stubPath = path.join(config.storage.products, 'sample_product.txt');
fs.writeFileSync(stubPath, 'This is a sample digital product file. Replace with actual content.');

const products = [
  {
    name:        'Sovereign Beat Pack Vol. 1',
    description: 'Exclusive producer kit — 24 custom drumkits, 48 one-shots, 12 melody loops.',
    price_btc:   0.0008,
    price_eth:   0.012,
    price_sol:   0.5,
    price_usdt:  49.99,
    file_path:   stubPath,
    version:     '1.0.0',
    availability: true,
  },
  {
    name:        'RaPaX™ Developer SDK',
    description: 'Full integration SDK for building on the RaPaX™ vending protocol.',
    price_btc:   0.002,
    price_eth:   0.03,
    price_sol:   1.2,
    price_usdt:  129.00,
    file_path:   stubPath,
    version:     '1.0.0',
    availability: true,
  },
  {
    name:        'Stealth Template Pack',
    description: 'Unreleased design templates. Limited edition.',
    price_btc:   0.0004,
    price_eth:   0.006,
    price_sol:   0.25,
    price_usdt:  24.99,
    file_path:   stubPath,
    version:     '2.1.0',
    availability: false,
  },
];

for (const p of products) {
  const created = ProductModel.create(p);
  console.log(`[Seed] Created product: ${created.name} (${created.product_id})`);
}

console.log('\n[RaPaX™] Seed complete ✓');
