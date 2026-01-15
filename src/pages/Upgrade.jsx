import { useState } from "react";
import { supabase } from "../lib/supabase";
import { isPro } from "../hooks/usePlan";

export default function Upgrade({ userId, planTier, onUpgraded }) {
  const pro = isPro(planTier);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function devActivatePro() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.rpc("dev_set_my_plan_tier", { p_tier: "pro" });
      if (error) throw error;
      onUpgraded?.();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function devDowngradeFree() {
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.rpc("dev_set_my_plan_tier", { p_tier: "free" });
      if (error) throw error;
      onUpgraded?.();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 24, border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <h3 style={{ marginTop: 0 }}>Upgrade</h3>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Your Plan: <b>{String(planTier || "free").toUpperCase()}</b>
      </div>

      <div style={{ marginTop: 12, lineHeight: "1.6" }}>
        <b>Owner Pro</b> unlocks:
        <ul style={{ marginTop: 6 }}>
          <li>Rank Applicants By Trust Score</li>
          <li>See Reliability / Verified Sails / Would-Sail-Again</li>
          <li>Accept / Reject Applications</li>
        </ul>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
        {!pro ? (
          <button disabled={busy || !userId} onClick={devActivatePro}>
            {busy ? "Working…" : "Activate Pro (Dev)"}
          </button>
        ) : (
          <button disabled={busy || !userId} onClick={devDowngradeFree}>
            {busy ? "Working…" : "Downgrade To Free (Dev)"}
          </button>
        )}

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Payments (Stripe) Will Plug Into This Later.
        </div>
      </div>
    </div>
  );
}
