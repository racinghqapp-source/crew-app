const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function getSiteUrl(event) {
  const env = process.env.SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const origin = event.headers?.origin;
  if (origin) return origin.replace(/\/$/, "");
  return "http://localhost:5173";
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_OWNER_PRO;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeKey || !priceId) return json(500, { error: "Missing Stripe env vars" });
    if (!supabaseUrl || !serviceKey) return json(500, { error: "Missing Supabase env vars" });

    const { userId } = JSON.parse(event.body || "{}");
    if (!userId) return json(400, { error: "Missing userId" });

    // Look up user's email (optional but nice for Stripe customer)
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: prof, error: profErr } = await admin
      .from("profiles")
      .select("id, display_name")
      .eq("id", userId)
      .single();

    if (profErr) return json(400, { error: profErr.message });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const siteUrl = getSiteUrl(event);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/?upgrade=success`,
      cancel_url: `${siteUrl}/?upgrade=cancel`,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan: "owner_pro",
      },
    });

    return json(200, { url: session.url });
  } catch (e) {
    return json(500, { error: e.message ?? String(e) });
  }
};
