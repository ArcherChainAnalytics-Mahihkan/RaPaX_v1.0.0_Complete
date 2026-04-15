// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Fingerprint Model
// ─────────────────────────────────────────────────────────────────
import { getDb } from '../utils/initDb.js';

export const FingerprintModel = {

  create({ fingerprint_id, transaction_id, product_id, buyer_wallet,
           original_file_path, fingerprinted_file_path, file_hash, acerbe_response_raw }) {
    getDb().prepare(`
      INSERT INTO fingerprints
        (fingerprint_id,transaction_id,product_id,buyer_wallet,
         original_file_path,fingerprinted_file_path,file_hash,acerbe_response_raw,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run([
      fingerprint_id, transaction_id, product_id, buyer_wallet ?? null,
      original_file_path, fingerprinted_file_path, file_hash,
      acerbe_response_raw ? JSON.stringify(acerbe_response_raw) : null,
      new Date().toISOString(),
    ]);
    return FingerprintModel.findById(fingerprint_id);
  },

  findById(id) {
    return getDb().prepare(
      `SELECT * FROM fingerprints WHERE fingerprint_id=?`
    ).get([id]) ?? null;
  },

  findByTransactionId(transactionId) {
    return getDb().prepare(
      `SELECT * FROM fingerprints WHERE transaction_id=?`
    ).get([transactionId]) ?? null;
  },
};
