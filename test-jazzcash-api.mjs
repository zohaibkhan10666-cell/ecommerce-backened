import process from 'process';

const base = process.env.BASE_URL || 'http://localhost:8000';
const url = `${base}/api/v1/orders/jazzcash/initiate-jazzcash`;

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

async function getFirstProductId() {
  const res = await fetch(`${base}/api/v1/products`);
  const text = await res.text();
  const json = safeJson(text);

  console.log('[TEST] GET /api/v1/products =>', res.status);

  const productId =
    json?.products?.[0]?._id ||
    json?._id ||
    json?.data?.products?.[0]?._id;

  if (!productId) {
    throw new Error(`Could not extract productId from /api/v1/products response: ${text.slice(0, 500)}`);
  }
  return productId;
}

async function post(body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const json = safeJson(text);

  console.log(
    '[TEST] POST',
    {
      paymentToken: body?.paymentToken,
      Authorization: headers.Authorization ? 'present' : 'none',
      itemsCount: body?.items?.length ?? null
    },
    '=>',
    res.status,
    json ?? text
  );

  return { status: res.status, json, text };
}

(async () => {
  const productId = await getFirstProductId();

  const mkBody = (paymentToken, items) => ({
    items,
    shippingAddress: { address: 'addr', city: 'city', zipCode: '123', phoneNo: '9999999999' },
    paymentToken
  });

  console.log('[TEST] Running CRITICAL ONLY option 1...');
  // 1) No Authorization + test123 => expect 201
  await post(mkBody('test123', [{ productId, quantity: 1 }]));

  // 2) No Authorization + realToken => expect 401
  await post(mkBody('realToken', [{ productId, quantity: 1 }]));

  // 3) Invalid Authorization + test123 => expect 201
  await post(
    mkBody('test123', [{ productId, quantity: 1 }]),
    { Authorization: 'Bearer invalid.jwt.token' }
  );

  // 4) Empty items => expect 400 with message
  await post(mkBody('test123', []));
})().catch((e) => {
  console.error('[TEST] ERROR:', e?.message || e);
  process.exit(1);
});
