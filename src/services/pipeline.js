// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Pipeline Orchestrator
//  Runs the full flow: confirmed payment → AcerbE™ → delivery
// ─────────────────────────────────────────────────────────────────
import { TransactionModel, TxStatus } from '../models/transactionModel.js';
import { ProductModel } from '../models/productModel.js';
import { AcerbEService } from './acerbeService.js';
import { DeliveryService } from './deliveryService.js';
import { auditLog, EventType } from '../utils/auditLogger.js';

export const Pipeline = {

  /**
   * Process a confirmed transaction all the way to delivery.
   * Called by: payment poller (auto) or /payment/confirm (manual webhook)
   */
  async run(transactionId) {
    const tx = TransactionModel.findById(transactionId);
    if (!tx) throw new Error(`Transaction ${transactionId} not found`);

    if (tx.status !== TxStatus.CONFIRMED) {
      console.warn(`[RaPaX™][Pipeline] Skipping — status is '${tx.status}', expected 'confirmed'`);
      return;
    }

    const product = ProductModel.findById(tx.product_id);
    if (!product) throw new Error(`Product ${tx.product_id} not found`);

    console.log(`[RaPaX™][Pipeline] Starting for tx: ${transactionId}`);

    try {
      // ── Step 1: AcerbE™ fingerprinting ─────────────────────────
      const fingerprint = await AcerbEService.fingerprint({
        transactionId,
        product,
        transaction: tx,
      });
      console.log(`[RaPaX™][Pipeline] Fingerprinted — id: ${fingerprint.fingerprint_id}`);

      // ── Step 2: Issue delivery ──────────────────────────────────
      const delivery = await DeliveryService.issueDelivery({
        transactionId,
        product,
        fingerprint,
      });
      console.log(`[RaPaX™][Pipeline] Delivery issued — token: ${delivery.download_token}`);

      auditLog({
        eventType:     EventType.SYSTEM,
        transactionId,
        productId:     product.product_id,
        fingerprintId: fingerprint.fingerprint_id,
        deliveryId:    delivery.delivery_id,
        actor:         tx.buyer_wallet || 'anonymous',
        payload:       {
          action:        'PIPELINE_COMPLETE',
          download_link: delivery.download_link,
        },
      });

      return { fingerprint, delivery };

    } catch (err) {
      console.error(`[RaPaX™][Pipeline] Error:`, err.message);
      TransactionModel.updateStatus(transactionId, TxStatus.FAILED);
      auditLog({
        eventType:     EventType.SYSTEM,
        transactionId,
        productId:     product.product_id,
        actor:         'system',
        payload:       { action: 'PIPELINE_FAILED', error: err.message },
      });
      throw err;
    }
  },
};
