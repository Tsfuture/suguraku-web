// api/checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ★追加部分 1: 店舗ごとの価格テーブル (ここを後で変更すれば価格を更新できる)
const PRICING_TABLE = {
  'default': { base: 1000, peakExtra: 0 },   // デフォルト価格
  'store-a': { base: 1200, peakExtra: 300 }, // 店舗A
  'store-b': { base: 1500, peakExtra: 500 }, // 店舗B
};

// ★追加部分 2: 価格を計算する関数
function calcDynamicPrice(facilityId) {
  // 該当する店舗の設定を見つける。見つからなければ'default'を使う
  const config = PRICING_TABLE[facilityId] || PRICING_TABLE['default'];
  
  const now = new Date();
  const hour = now.getHours(); // 現在時刻 (0〜23時)

  let price = config.base; // 基本価格で開始

  // 例: 18時〜21時を「ピークタイム」とし、追加料金を上乗せ
  if (hour >= 18 && hour < 21) {
    price += config.peakExtra;
  }

  return price;
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // ★追加部分 3: フロントエンドから送られてきた施設IDを取得
      const { facility } = JSON.parse(req.body);
      const facilityId = facility || 'default';

      // ★追加部分 4: 動的に価格を計算
      const unitAmount = calcDynamicPrice(facilityId);

      // 5. Stripe Checkout セッション作成 (既存コードを以下のように変更)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          // 商品名や説明は必要に応じてfacilityIdに応じて変えることもできます
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `Suguraku待ち時間短縮チケット (${facilityId})`,
            },
            unit_amount: unitAmount, // ← ここで計算した価格を使う！
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.headers.origin}/success.html`,
        cancel_url: `${req.headers.origin}/cancel.html`,
      });

      res.status(200).json({ url: session.url });
    } catch (err) {
      res.status(500).json({ error: 'Error creating checkout session' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};
