// Stripe を初期化（環境変数から取得）
const stripe = require(‘stripe’)(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
// CORS 設定（ブラウザからのリクエストを許可）
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

// OPTIONS リクエスト（プリフライト）の処理
if (req.method === ‘OPTIONS’) {
return res.status(200).end();
}

// POST 以外は拒否
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method Not Allowed’ });
}

try {
// Stripe チェックアウトセッションを作成
const session = await stripe.checkout.sessions.create({
payment_method_types: [‘card’], // クレジットカード決済
line_items: [
{
price_data: {
currency: ‘jpy’, // 日本円
product_data: {
name: ‘商品名’, // ← ここを実際の商品名に変更
description: ‘商品の説明文’,
},
unit_amount: 1000, // 金額（円）← ここを実際の価格に変更
},
quantity: 1, // 数量
},
],
mode: ‘payment’, // 一回払い
success_url: `${req.headers.origin || 'https://suguraku-web.vercel.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${req.headers.origin || 'https://suguraku-web.vercel.app'}/cancel.html`,
});

```
// 成功：セッションIDとURLを返す
return res.status(200).json({
  id: session.id,
  url: session.url,
});
```

} catch (error) {
// エラー：詳細をログに出力
console.error(‘Stripe API Error:’, error);
return res.status(500).json({
error: ‘Checkout session creation failed’,
details: error.message,
});
}
};
