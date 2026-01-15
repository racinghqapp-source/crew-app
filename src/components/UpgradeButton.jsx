import { useState } from "react";

export default function UpgradeButton({ userId, planTier }) {
  const [busy, setBusy] = useState(false);
  const isPro = String(planTier || "free").toLowerCase() === "pro";

  async function startCheckout() {
    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Checkout Failed");
      if (!j.url) throw new Error("Missing Checkout Url");
      window.location.href = j.url;
    } catch (e) {
      alert(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  if (isPro) return <span style={{ fontSize: 12, opacity: 0.8 }}>✅ Owner Pro Active</span>;

  return (
    <button onClick={startCheckout} disabled={busy || !userId}>
      {busy ? "Redirecting…" : "Upgrade To Owner Pro"}
    </button>
  );
}
