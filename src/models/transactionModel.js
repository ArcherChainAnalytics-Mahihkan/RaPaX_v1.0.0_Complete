// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Transaction Model
// ─────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../utils/initDb.js';

const now = () => new Date().toISOString();

export const TxStatus = {
  PENDING: 'pending', CONFIRMING: 'confirming', CONFIRMED: 'confirmed',
  FINGERPRINTING: 'fingerprinting', DELIVERING: 'delivering',
  COMPLETE: 'complete', FAILED: 'failed', EXPIRED: 'expired',
};

export const TransactionModel = {

  create({ product_id, buyer_wallet = null, currency, amount_expected, product_version }) {
    const transaction_id = uuidv4();
    const ts = now();
    getDb().prepare(`
      INSERT INTO transactions
        (transaction_id,product_id,buyer_wallet,currency,amount_expected,
         product_version,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,'pending',?,?)
    `).run([transaction_id, product_id, buyer_wallet, currency,
            amount_expected, product_version, ts, ts]);
    return TransactionModel.findById(transaction_id);
  },

  findById(id) {
    return getDb().prepare(
      `SELECT * FROM transactions WHERE transaction_id=?`
    ).get([id]) ?? null;
  },

  updateStatus(transactionId, status, extra = {}) {
    const allowed = ['amount_received','tx_hash','confirmations','buyer_wallet'];
    const sets = ['status=?', 'updated_at=?'];
    const vals = [status, now()];
    for (const key of allowed) {
      if (key in extra) { sets.push(`${key}=?`); vals.push(extra[key]); }
    }
    vals.push(transactionId);
    getDb().prepare(
      `UPDATE transactions SET ${sets.join(',')} WHERE transaction_id=?`
    ).run(vals);
    return TransactionModel.findById(transactionId);
  },

  listPending() {
    return getDb().prepare(`
      SELECT * FROM transactions WHERE status IN ('pending','confirming')
      ORDER BY created_at ASC
    `).all();
  },

  listAll({ limit = 100, offset = 0 } = {}) {
    return getDb().prepare(
      `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all([limit, offset]);
  },
};
