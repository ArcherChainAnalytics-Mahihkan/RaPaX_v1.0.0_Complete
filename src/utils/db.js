// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Database Adapter  (sql.js wrapper)
//  Provides a synchronous-style API over sql.js with auto-persist.
//  All models use positional ? params — simpler and fully compatible.
// ─────────────────────────────────────────────────────────────────
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

let SQL = null;
let _db = null;
const dbPath = config.db.path;

export async function openDb() {
  if (_db) return _db;
  if (!SQL) SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }
  return _db;
}

export function persistDb() {
  if (!_db) return;
  const data = _db.export();
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));
}

let _autoPersist = null;
export function startAutoPersist(intervalMs = 5000) {
  if (_autoPersist) return;
  _autoPersist = setInterval(persistDb, intervalMs);
  process.on('exit',    persistDb);
  process.on('SIGINT',  () => { persistDb(); process.exit(0); });
  process.on('SIGTERM', () => { persistDb(); process.exit(0); });
}

// ── SyncDb wrapper ────────────────────────────────────────────────
class SyncDb {
  constructor(sqlJsDb) { this._db = sqlJsDb; }

  exec(sql) { this._db.run(sql); return this; }
  pragma()  { return this; }
  close()   { persistDb(); }

  prepare(sql) {
    const db = this._db;
    return {
      // INSERT / UPDATE / DELETE  → params as positional array or object
      run(...args) {
        const p = flattenArgs(args);
        db.run(sql, p);
        persistDb();
        const ch  = db.exec('SELECT changes()');
        const lid = db.exec('SELECT last_insert_rowid()');
        return {
          changes:          ch[0]?.values[0][0]  ?? 0,
          lastInsertRowid:  lid[0]?.values[0][0] ?? null,
        };
      },

      // SELECT one row → plain object or undefined
      get(...args) {
        const p    = flattenArgs(args);
        const stmt = db.prepare(sql);
        if (p) stmt.bind(p);
        let row;
        if (stmt.step()) row = stmt.getAsObject();
        stmt.free();
        return row;
      },

      // SELECT all rows → plain object array
      all(...args) {
        const p    = flattenArgs(args);
        const stmt = db.prepare(sql);
        if (p) stmt.bind(p);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
    };
  }
}

// ── Param flattener ───────────────────────────────────────────────
// Accepts: .run(p1,p2,...) or .run([p1,p2]) or .run({$k:v})
// sql.js bind() wants an array or {$key:val} object.
function flattenArgs(args) {
  if (!args || args.length === 0) return undefined;
  if (args.length === 1) {
    const a = args[0];
    if (a === null || a === undefined) return undefined;
    if (Array.isArray(a)) return a.length ? a : undefined;
    if (typeof a === 'object') return a;  // pass {$k:v} through directly
    return [a];
  }
  return args; // multiple positional args
}

export function getDb() {
  if (!_db) throw new Error('[RaPaX™] DB not initialised. Call initDb() at startup.');
  return new SyncDb(_db);
}
