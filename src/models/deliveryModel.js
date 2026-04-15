// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Delivery Model
// ─────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../utils/initDb.js';
import { config } from '../config/index.js';

export const DeliveryModel = {

  create({ transaction_id, product_id, buyer_wallet, fingerprint_id, download_token, file_hash }) {
    const delivery_id   = uuidv4();
    const download_link = `http://localhost:${config.server.port}/api/download/${download_token}`;
    const expires_at    = new Date(Date.now() + config.delivery.linkTtl * 1000).toISOString();
    const created_at    = new Date().toISOString();
    getDb().prepare(`
      INSERT INTO deliveries
        (delivery_id,transaction_id,product_id,buyer_wallet,fingerprint_id,
         download_token,download_link,file_hash,expires_at,download_count,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,0,?)
    `).run([delivery_id, transaction_id, product_id, buyer_wallet ?? null,
            fingerprint_id, download_token, download_link,
            file_hash, expires_at, created_at]);
    return DeliveryModel.findById(delivery_id);
  },

  findById(id) {
    return getDb().prepare(
      `SELECT * FROM deliveries WHERE delivery_id=?`
    ).get([id]) ?? null;
  },

  findByToken(token) {
    return getDb().prepare(
      `SELECT * FROM deliveries WHERE download_token=?`
    ).get([token]) ?? null;
  },

  findByTransactionId(transactionId) {
    return getDb().prepare(
      `SELECT * FROM deliveries WHERE transaction_id=?`
    ).get([transactionId]) ?? null;
  },

  recordDownload(deliveryId) {
    const d = DeliveryModel.findById(deliveryId);
    const downloaded_at = d?.downloaded_at ?? new Date().toISOString();
    getDb().prepare(`
      UPDATE deliveries SET download_count=download_count+1,downloaded_at=?
      WHERE delivery_id=?
    `).run([downloaded_at, deliveryId]);
  },

  listAll({ limit = 100, offset = 0 } = {}) {
    return getDb().prepare(
      `SELECT * FROM deliveries ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all([limit, offset]);
  },
};
