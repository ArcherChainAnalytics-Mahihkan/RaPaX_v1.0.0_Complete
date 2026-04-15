// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Payment Address Model
// ─────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../utils/initDb.js';

export const PaymentAddressModel = {

  create({ transaction_id, currency, address, expected_amount, derivation_idx = null }) {
    const address_id = uuidv4();
    const created_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    getDb().prepare(`
      INSERT INTO payment_addresses
        (address_id,transaction_id,currency,address,expected_amount,
         derivation_idx,created_at,expires_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).run([address_id, transaction_id, currency, address,
            expected_amount, derivation_idx, created_at, expires_at]);
    return PaymentAddressModel.findByTransactionId(transaction_id);
  },

  findByTransactionId(transactionId) {
    return getDb().prepare(
      `SELECT * FROM payment_addresses WHERE transaction_id=?`
    ).get([transactionId]) ?? null;
  },

  findByAddress(address) {
    return getDb().prepare(
      `SELECT * FROM payment_addresses WHERE address=?`
    ).get([address]) ?? null;
  },
};
