// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Public Product Routes
//  GET /products
//  GET /product/:id
// ─────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { ProductModel } from '../models/productModel.js';

const router = Router();

// GET /products — public listing (no file_path exposed)
router.get('/products', (req, res) => {
  try {
    const products = ProductModel.listPublic();
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /product/:id — single product (public safe)
router.get('/product/:id', (req, res) => {
  try {
    const product = ProductModel.findByIdPublic(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
