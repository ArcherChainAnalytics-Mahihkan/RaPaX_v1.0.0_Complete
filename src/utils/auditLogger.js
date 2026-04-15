// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Audit Logger  (append-only, immutable)
// ─────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './initDb.js';

export const EventType = {
  PAYMENT: 'PAYMENT', FINGERPRINT: 'FINGERPRINT',
  DELIVERY: 'DELIVERY', PRODUCT: 'PRODUCT', SYSTEM: 'SYSTEM',
};

export function auditLog({ eventType, payload, transactionId = null,
  productId = null, fingerprintId = null, deliveryId = null, actor = 'system' }) {
  getDb().prepare(`
    INSERT INTO audit_log
      (log_id,event_type,transaction_id,product_id,fingerprint_id,
       delivery_id,actor,payload,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run([
    uuidv4(), eventType, transactionId, productId,
    fingerprintId, deliveryId, actor,
    JSON.stringify(payload), new Date().toISOString(),
  ]);
}
