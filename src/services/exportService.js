// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Export Service  (JSON + CSV)
// ─────────────────────────────────────────────────────────────────
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { getDb } from '../utils/initDb.js';
import { config } from '../config/index.js';

function queryLogs(filters = {}) {
  const db     = getDb();
  let   sql    = `SELECT * FROM audit_log WHERE 1=1`;
  const params = [];
  if (filters.event_type) { sql += ` AND event_type=?`;  params.push(filters.event_type); }
  if (filters.from)       { sql += ` AND created_at>=?`; params.push(filters.from); }
  if (filters.to)         { sql += ` AND created_at<=?`; params.push(filters.to); }
  sql += ` ORDER BY created_at DESC`;
  if (filters.limit)      { sql += ` LIMIT ?`; params.push(parseInt(filters.limit, 10)); }
  return params.length
    ? db.prepare(sql).all(params)
    : db.prepare(sql).all();
}

export const ExportService = {

  asJson(filters = {}) {
    return JSON.stringify(queryLogs(filters), null, 2);
  },

  async asCsv(filters = {}) {
    const rows     = queryLogs(filters);
    const filename = `rapax_audit_${Date.now()}.csv`;
    const filePath = path.join(config.storage.logs, filename);
    const writer   = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'log_id',         title: 'Log ID' },
        { id: 'event_type',     title: 'Event Type' },
        { id: 'transaction_id', title: 'Transaction ID' },
        { id: 'product_id',     title: 'Product ID' },
        { id: 'fingerprint_id', title: 'Fingerprint ID' },
        { id: 'delivery_id',    title: 'Delivery ID' },
        { id: 'actor',          title: 'Actor' },
        { id: 'payload',        title: 'Payload (JSON)' },
        { id: 'created_at',     title: 'Timestamp' },
      ],
    });
    await writer.writeRecords(rows);
    return filePath;
  },

  deliveryLog() {
    return getDb().prepare(
      `SELECT * FROM deliveries ORDER BY created_at DESC`
    ).all();
  },
};
