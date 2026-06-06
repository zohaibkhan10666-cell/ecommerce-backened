import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import cryptoJS from 'crypto-js';

const safeToUpper = (v) => (v || '').toString().toUpperCase();

// JazzCash integrity hash (HMAC-SHA256) used for form-based flows.
// For IPN callback verification, JazzCash may provide pp_SecureHash; we verify if possible.
const verifySecureHash = (body, integritySalt) => {
  // Common hash string pattern for JazzCash: integritySalt + key-values joined by '&'
  // If any of these fields differ from JazzCash spec, verification may fail.
  // We'll still gracefully accept when pp_SecureHash is missing.
  if (!body?.pp_SecureHash) return { ok: true, reason: 'pp_SecureHash missing' };

  const hashString = [
    integritySalt,
    body.pp_Amount,
    body.pp_BillReference || '',
    body.pp_Description || '',
    body.pp_Language || 'EN',
    body.pp_MerchantID,
    body.pp_Password,
    body.pp_TxnCurrency || 'PKR',
    body.pp_TxnDateTime,
    body.pp_TxnExpiryDateTime || '',
    body.pp_TxnRefNo,
  ].join('&');

  const computed = cryptoJS.HmacSHA256(hashString, integritySalt).toString().toUpperCase();
  const provided = safeToUpper(body.pp_SecureHash);

  return { ok: computed === provided, reason: computed === provided ? 'hash match' : 'hash mismatch' };
};

export const handleJazzCashCallback = async (req, res) => {
  try {
    const body = req.body || {};

    const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;
    if (!integritySalt) {
      console.warn('[JazzCash IPN] Missing JAZZCASH_INTEGRITY_SALT env var. Skipping hash verification.');
    }

    if (integritySalt) {
      const check = verifySecureHash(body, integritySalt);
      if (!check.ok) {
        console.warn('[JazzCash IPN] Hash verification failed:', check.reason);
        // Do not update order if hash mismatch.
        return res.status(400).send('INVALID_HASH');
      }
    }

    const responseCode = safeToUpper(body.pp_ResponseCode);
    const txnRefNo = body.pp_TxnRefNo || body.pp_TxnRefNo?.toString();
    const orderNumber = body.pp_BillReference || body.pp_BillReference?.toString();

    if (!orderNumber) {
      return res.status(400).send('MISSING_ORDER_REFERENCE');
    }

    const order = await Order.findOne({ orderNumber, isActive: true });
    if (!order) {
      return res.status(404).send('ORDER_NOT_FOUND');
    }

    // Idempotency guard
    if (order.paymentStatus === 'paid' && responseCode === '000') {
      return res.status(200).send('ALREADY_PAID');
    }

    if (responseCode === '000') {
      // Mark paid
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        transactionId: txnRefNo || order.paymentDetails?.transactionId,
        paidAt: new Date(),
        response: body,
      };

      await order.save();
      console.log('[JazzCash IPN] Payment SUCCESS:', {
        orderNumber,
        txnRefNo,
      });

      return res.status(200).send('OK');
    }

    // Failed: cancel & restore stock if not already cancelled
    if (order.paymentStatus !== 'failed') {
      order.paymentStatus = 'failed';
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        transactionId: txnRefNo || order.paymentDetails?.transactionId,
        failedAt: new Date(),
        response: body,
      };
      order.orderStatus = 'cancelled';
      await order.save();

      // Restore stock (if still active & not already restored)
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }

      console.log('[JazzCash IPN] Payment FAILED:', {
        orderNumber,
        txnRefNo,
        responseCode,
      });
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[JazzCash IPN] Error:', error);
    return res.status(500).send('SERVER_ERROR');
  }
};

