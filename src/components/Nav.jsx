// src/components/Nav.jsx
import { ROUTES } from "../routes";
import "./Nav.css";

export default function Nav({
  current,
  onChange,
  isOwner,
  locked = false,
  unreadInvites = 0,
}) {
  const tabs = [
    { id: ROUTES.APPLICATIONS, label: "Applications" },
    { id: ROUTES.SAILING, label: "Sailing" },
    ...(isOwner ? [{ id: ROUTES.INVITES, label: "Invites" }] : []),
    { id: ROUTES.UPGRADE, label: "Upgrade" },
  ];

  return (
    <div className="navRow">
      {tabs.map((t) => {
        const isActive =
          current === t.id ||
          (t.id === ROUTES.PROFILE && current === ROUTES.SAILOR_ONBOARDING);

        const disabled = locked && t.id !== ROUTES.PROFILE;

        return (
          <button
            key={t.id}
            onClick={() => !disabled && onChange(t.id)}
            disabled={disabled}
            className={`navBtn ${isActive ? "navBtnActive" : ""}`}
            title={disabled ? "Complete your profile to unlock the app" : ""}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {t.label}
              {t.id === ROUTES.INBOX && unreadInvites > 0 ? (
                <span className="badgeCount">{unreadInvites}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
