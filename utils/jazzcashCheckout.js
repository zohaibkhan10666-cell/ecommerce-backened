const Jazzcash = require('jazzcash-checkout');

// Initializes your JazzCash
Jazzcash.credentials({
  config: {
    merchantId: process.env.JAZZCASH_MERCHANT_ID || '', // Merchant Id
    password: process.env.JAZZCASH_PASSWORD || '', // Password
    hashKey: process.env.JAZZCASH_INTEGRITY_SALT || '', // Hash Key
  },
  environment: process.env.JAZZCASH_ENVIRONMENT || 'sandbox', // available environment live or sandbox
});

const JC = {
  wallet: (data, callback) => {
    Jazzcash.setData(data);
    Jazzcash.createRequest('WALLET').then((res) => {
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      console.log(parsed);
      callback(parsed);
    }).catch((err) => {
      console.error('[JazzCash wallet] error:', err);
      callback({ error: err?.message || String(err) });
    });
  },

  pay: (data, callback) => {
    Jazzcash.setData(data);
    Jazzcash.createRequest('PAY').then((res) => {
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      console.log(parsed);
      callback(parsed);
    }).catch((err) => {
      console.error('[JazzCash pay] error:', err);
      callback({ error: err?.message || String(err) });
    });
  },

  refund: (data, callback) => {
    Jazzcash.setData(data);
    Jazzcash.createRequest('REFUND').then((res) => {
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      console.log(parsed);
      callback(parsed);
    }).catch((err) => {
      console.error('[JazzCash refund] error:', err);
      callback({ error: err?.message || String(err) });
    });
  },

  inquiry: (data, callback) => {
    Jazzcash.setData(data);
    Jazzcash.createRequest('INQUIRY').then((res) => {
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      console.log(parsed);
      callback(parsed);
    }).catch((err) => {
      console.error('[JazzCash inquiry] error:', err);
      callback({ error: err?.message || String(err) });
    });
  },
};

module.exports = JC;

