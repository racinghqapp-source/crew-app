export function normalisePlanTier(tier) {
  const v = String(tier || "free").toLowerCase().trim();
  if (v === "pro" || v === "paid") return "pro";
  return "free";
}

export function isPro(planTier) {
  return normalisePlanTier(planTier) === "pro";
}
