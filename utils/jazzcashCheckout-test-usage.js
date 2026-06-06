// Simple sanity test for jazzcash-checkout module.
// Run from backened/: node utils/jazzcashCheckout-test-usage.js

const JC = require('./jazzcashCheckout');

JC.pay(
  {
    // These field names depend on the library's expected PAY request format.
    // Replace/align with jazzcash-checkout docs for your integration style.
    pp_Version: '1.1',
    pp_Amount: '1000',
    pp_TxnCurrency: 'PKR',
    pp_BillReference: 'billRef123',
    pp_Description: 'Description of transaction',
    pp_Language: 'EN',
    // NOTE: library usually fills merchant/password/hash from Jazzcash.credentials()
  },
  (res) => {
    console.log('PAY response:', res);
  }
);

