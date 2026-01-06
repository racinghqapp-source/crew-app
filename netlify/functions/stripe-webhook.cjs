const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

function rawBodyFromEvent(event) {
  // Netlify passes body as string; for Stripe signature verification we need the raw string
  return event.body || "";
}

exports.handler = async (event) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret) {
    return { statusCode: 500, body: "Missing Stripe env vars" };
  }
  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: "Missing Supabase env vars" };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

  let stripeEvent;
  try {
    const raw = rawBodyFromEvent(event);
    stripeEvent = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` };
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    // We upgrade on successful checkout completion
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const userId =
        session.client_reference_id ||
        session.metadata?.user_id ||
        null;

      if (userId) {
        const { error } = await admin
          .from("profiles")
          .update({ plan_tier: "pro" })
          .eq("id", userId);

        if (error) throw new Error(error.message);
      }
    }

    // Optional: handle subscription canceled → downgrade
    if (stripeEvent.type === "customer.subscription.deleted") {
      const sub = stripeEvent.data.object;
      // If you later store stripe_customer_id on profiles, you can map back here.
      // For MVP, skip downgrade automation.
    }

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    return { statusCode: 500, body: e.message ?? String(e) };
  }
};
