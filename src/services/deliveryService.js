// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Delivery Service
//  Generates secure expiring download tokens.
//  Serves fingerprinted assets. Logs every delivery event.
// ─────────────────────────────────────────────────────────────────
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DeliveryModel } from '../models/deliveryModel.js';
import { FingerprintModel } from '../models/fingerprintModel.js';
import { TransactionModel, TxStatus } from '../models/transactionModel.js';
import { auditLog, EventType } from '../utils/auditLogger.js';

export const DeliveryService = {

  /**
   * Issue a secure expiring download link after fingerprinting completes.
   */
  async issueDelivery({ transactionId, product, fingerprint }) {
    // Generate a cryptographically random download token — no file path exposed
    const downloadToken = crypto.randomBytes(48).toString('hex');

    const delivery = DeliveryModel.create({
      transaction_id: transactionId,
      product_id:     product.product_id,
      buyer_wallet:   fingerprint.buyer_wallet,
      fingerprint_id: fingerprint.fingerprint_id,
      download_token: downloadToken,
      file_hash:      fingerprint.file_hash,
    });

    // Advance transaction to 'delivering'
    TransactionModel.updateStatus(transactionId, TxStatus.DELIVERING);

    auditLog({
      eventType:     EventType.DELIVERY,
      transactionId,
      productId:     product.product_id,
      fingerprintId: fingerprint.fingerprint_id,
      deliveryId:    delivery.delivery_id,
      actor:         fingerprint.buyer_wallet || 'anonymous',
      payload:       {
        action:        'DELIVERY_ISSUED',
        download_link: delivery.download_link,
        expires_at:    delivery.expires_at,
        file_hash:     delivery.file_hash,
      },
    });

    return delivery;
  },

  /**
   * Resolve a download token to a file path and serve it.
   * Returns { filePath, filename } or throws on invalid/expired token.
   */
  resolveToken(token) {
    const delivery = DeliveryModel.findByToken(token);

    if (!delivery) {
      throw Object.assign(new Error('Invalid download token'), { status: 404 });
    }

    if (new Date(delivery.expires_at) < new Date()) {
      throw Object.assign(new Error('Download link has expired'), { status: 410 });
    }

    const fingerprint = FingerprintModel.findById(delivery.fingerprint_id);
    if (!fingerprint) {
      throw Object.assign(new Error('Fingerprint record missing'), { status: 500 });
    }

    const filePath = fingerprint.fingerprinted_file_path;

    if (!fs.existsSync(filePath)) {
      throw Object.assign(new Error('File not found on server'), { status: 404 });
    }

    // Record download event
    DeliveryModel.recordDownload(delivery.delivery_id);
    TransactionModel.updateStatus(delivery.transaction_id, TxStatus.COMPLETE);

    auditLog({
      eventType:     EventType.DELIVERY,
      transactionId: delivery.transaction_id,
      productId:     delivery.product_id,
      fingerprintId: delivery.fingerprint_id,
      deliveryId:    delivery.delivery_id,
      actor:         delivery.buyer_wallet || 'anonymous',
      payload:       {
        action:       'ASSET_DOWNLOADED',
        download_count: delivery.download_count + 1,
        file_hash:    delivery.file_hash,
      },
    });

    return {
      filePath,
      filename: path.basename(filePath),
      delivery,
    };
  },
};
