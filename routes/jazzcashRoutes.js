import express from 'express';
import { handleJazzCashCallback } from '../database/controllers/jazzcashController.js';
import { initiateJazzcashPayment } from '../database/controllers/orderController.js';
import { isAuthenticated } from '../middleware/isAuthenticated.js';

const router = express.Router();

// JazzCash IPN/Webhook endpoint (Sandbox)
router.post('/callback', handleJazzCashCallback);

/**
 * Fallback: allow frontend to initiate from /api/v1/orders/jazzcash/initiate-jazzcash
 * (server.mjs mounts this router at /api/v1/orders/jazzcash)
 */

// If someone accidentally hits this endpoint with GET, return a deterministic response
router.get('/initiate-jazzcash', (req, res) => {
  return res.status(405).json({
    success: false,
    message: 'Method Not Allowed. Use POST /api/v1/orders/jazzcash/initiate-jazzcash',
    expectedMethod: 'POST',
    path: req.path,
    method: req.method
  });
});

router.post('/initiate-jazzcash', async (req, res, next) => {
  try {
    console.log('[JazzCash ROUTE] POST /initiate-jazzcash hit:', {
      hasBody: !!req.body,
      keys: req.body ? Object.keys(req.body) : [],
      paymentToken: req.body?.paymentToken ? String(req.body.paymentToken).slice(0, 8) + '...' : null,
    });

    const paymentToken = req.body?.paymentToken;

    // TEST mode: bypass auth completely
    if (paymentToken === 'test123') {
      console.log('[JazzCash ROUTE] TEST MODE accepted: test123');
      return initiateJazzcashPayment(req, res);
    }

    // Real flow: run auth, then controller
    return isAuthenticated(req, res, () => initiateJazzcashPayment(req, res));
  } catch (err) {
    console.error('[JazzCash ROUTE] Error in initiate-jazzcash handler:', err);
    return res.status(500).json({
      success: false,
      message: 'JazzCash initiation failed (server error)',
    });
  }
});

export default router;

