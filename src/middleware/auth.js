// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Operator Auth Middleware
// ─────────────────────────────────────────────────────────────────
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function operatorAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    req.operator  = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}

/** Generate an operator token (used at login) */
export function generateOperatorToken() {
  return jwt.sign({ role: 'operator' }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}
