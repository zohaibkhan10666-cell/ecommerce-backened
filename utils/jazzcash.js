import cryptoJS from 'crypto-js';
import moment from 'moment';

export const generateJazzCashHash = (params, integritySalt) => {
  const hashString = [
    integritySalt,
    params.pp_Amount,
    params.pp_BillReference || '',
    params.pp_Description || '',
    params.pp_Language || 'EN',
    params.pp_MerchantID,
    params.pp_Password,
    params.pp_TxnCurrency || 'PKR',
    params.pp_TxnDateTime,
    params.pp_TxnExpiryDateTime,
    params.pp_TxnRefNo
  ].join('&');

  return cryptoJS.HmacSHA256(hashString, integritySalt).toString().toUpperCase();
};

export const createJazzCashFormData = (order) => {
  const txnDateTime = moment().format('YYYYMMDDHHmmss');
  const txnExpiryDateTime = moment().add(30, 'minutes').format('YYYYMMDDHHmmss');

  return {
    pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
    pp_Password: process.env.JAZZCASH_PASSWORD,
    pp_TxnRefNo: order.orderNumber,
    pp_Amount: order.total.toFixed(2),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: txnDateTime,
    pp_BillReference: order.orderNumber,
    pp_Description: `Order #${order.orderNumber}`,
    pp_TxnExpiryDateTime: txnExpiryDateTime,
    pp_ReturnURL: process.env.JAZZCASH_RETURN_URL || 'http://localhost:5173/payment-success/' + order.orderNumber,
    ppmpf_1: order._id.toString(),
    ppmpf_2: order.user.userId.toString(),
    ppmpf_3: order.user.email,
    ppmpf_4: '',
    ppmpf_5: ''
  };
};

