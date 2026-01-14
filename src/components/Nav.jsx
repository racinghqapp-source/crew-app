// src/components/Nav.jsx
import { ROUTES } from "../routes";

export default function Nav({ current, onChange, isOwner, locked = false, unreadInvites = 0 }) {
  const tabs = [
    { id: ROUTES.PROFILE, label: "Profile" },
    { id: ROUTES.INBOX, label: "Inbox", badge: unreadInvites },
    { id: ROUTES.DISCOVER, label: "Discover" },
    { id: ROUTES.APPLICATIONS, label: "Applications" },
    { id: ROUTES.SAILING, label: "Sailing" },
    ...(isOwner ? [{ id: ROUTES.BOATS, label: "Boats" }, { id: ROUTES.EVENTS, label: "Events" }] : []),
    ...(isOwner ? [{ id: ROUTES.INVITES, label: "Invites" }] : []),
    { id: ROUTES.UPGRADE, label: "Upgrade" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const isActive =
          current === t.id || (t.id === ROUTES.PROFILE && current === ROUTES.SAILOR_ONBOARDING);
        const disabled = locked && t.id !== ROUTES.PROFILE;

        return (
          <button
            key={t.id}
            onClick={() => !disabled && onChange(t.id)}
            disabled={disabled}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: isActive ? "#0b2440" : "#fff",
              color: isActive ? "#fff" : "#111827",
              fontWeight: 700,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
            title={disabled ? "Complete your profile to unlock the app" : ""}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {t.label}
              {t.badge ? (
                <span
                  style={{
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#00D2C8",
                    color: "#071A2C",
                    fontWeight: 900,
                  }}
                >
                  {t.badge}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
