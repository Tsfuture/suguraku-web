const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS 設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // フロントから送られてきた JSON を読む
  let rawBody = '';
  for await (const chunk of req) {
    rawBody += chunk;
  }

  let payload = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (e) {
    console.error('Failed to parse JSON body', e);
  }

  const people = Number(payload.people) || 1;
  const name = payload.name || '';
  const email = payload.email || '';

  const origin = req.headers.origin || 'https://suguraku-web.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'Suguraku チケット',
              description: '列を短縮するための優先チケット',
            },
            unit_amount: 1000, // TODO: ダイナミックプライシングを入れる
          },
          quantity: 1, // 1組あたり
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}&people=${encodeURIComponent(
        people
      )}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
      cancel_url: `${origin}/cancel.html`,
      metadata: {
        people: String(people),
        customer_name: name,
        customer_email: email,
      },
    });

    return res.status(200).json({
      id: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe API Error:', error);
    return res.status(500).json({
      error: 'Checkout session creation failed',
      details: error.message,
    });
  }
};
