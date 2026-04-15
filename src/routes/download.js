// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Download Route
//  GET /download/:token
//  No file paths exposed. Token-only access.
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { DeliveryService } from '../services/deliveryService.js';

const router = Router();

router.get('/download/:token', (req, res) => {
  try {
    const { filePath, filename } = DeliveryService.resolveToken(req.params.token);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-RaPaX-Fingerprinted', 'true');
    res.download(filePath, filename);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
