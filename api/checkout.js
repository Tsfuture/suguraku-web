import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { name: "FastPass" },
            unit_amount: 700,
          },
          quantity: 1,
        },
      ],
      success_url: "https://suguraku-web.vercel.app/success.html",
      cancel_url: "https://suguraku-web.vercel.app/cancel.html",
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
