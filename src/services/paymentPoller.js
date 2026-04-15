// ─────────────────────────────────────────────────────────────────
//  RaPaX™ — Payment Poller (Cron Job)
//  Polls pending/confirming transactions every 60 seconds.
//  When confirmed → runs Pipeline.
// ─────────────────────────────────────────────────────────────────
import cron from 'node-cron';
import { TransactionModel, TxStatus } from '../models/transactionModel.js';
import { PaymentService } from './paymentService.js';
import { Pipeline } from './pipeline.js';

let running = false;

export function startPaymentPoller() {
  // Run every 60 seconds
  cron.schedule('*/60 * * * * *', async () => {
    if (running) return; // prevent overlap
    running = true;

    try {
      const pending = TransactionModel.listPending();
      if (pending.length === 0) { running = false; return; }

      console.log(`[RaPaX™][Poller] Checking ${pending.length} pending transaction(s)…`);

      for (const tx of pending) {
        try {
          const newStatus = await PaymentService.pollTransaction(tx.transaction_id);

          if (newStatus === TxStatus.CONFIRMED) {
            console.log(`[RaPaX™][Poller] Confirmed: ${tx.transaction_id} — starting pipeline…`);
            await Pipeline.run(tx.transaction_id);
          }
        } catch (err) {
          console.error(`[RaPaX™][Poller] Error on tx ${tx.transaction_id}:`, err.message);
        }
      }
    } finally {
      running = false;
    }
  });

  console.log('[RaPaX™] Payment poller started (every 60s)');
}
