import { useEffect, useRef, useState } from "react";
import { ROUTES } from "../routes";
import CrewHQLogo from "../assets/crewhq-logo.svg";

export default function AppHeader({
  user,
  profile,
  current,
  isOwner,
  inviteCount = 0,
  onNavigate,
  onSignOut,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initials = String(profile?.display_name || user?.email || "U")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  const topNav = [
    { id: ROUTES.DISCOVER, label: "Discover" },
    ...(isOwner ? [{ id: ROUTES.EVENTS, label: "Events" }] : []),
    ...(isOwner ? [{ id: ROUTES.BOATS, label: "Boats" }] : []),
  ];

  return (
    <header className="appHeader">
      <div className="appHeaderInner">
        <div className="hdrLeft">
          <button className="brand" onClick={() => onNavigate?.(ROUTES.DISCOVER)}>
            <img src={CrewHQLogo} alt="CrewHQ" className="brandLogo" />
          </button>

          {topNav.length ? (
            <nav className="topNav">
              {topNav.map((t) => (
                <button
                  key={t.id}
                  className={`topNavLink ${current === t.id ? "topNavLinkActive" : ""}`}
                  onClick={() => onNavigate?.(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="hdrRight">
          <button
            className="iconBtn"
            aria-label="Inbox"
            onClick={() => onNavigate?.(ROUTES.INBOX)}
            title="Inbox"
          >
            <span className="icon">✉️</span>
            {inviteCount > 0 ? <span className="badge">{inviteCount}</span> : null}
          </button>

          <div className="profileWrap" ref={menuRef}>
            <button className="profileBtn" onClick={() => setOpen((v) => !v)}>
              <span className="avatar">{initials}</span>
              <span className="caret">▾</span>
            </button>

            {open ? (
              <div className="menu">
                <button className="menuItem" onClick={() => onNavigate?.(ROUTES.PROFILE)}>
                  My Profile
                </button>
                <button className="menuItem" onClick={() => onNavigate?.(ROUTES.APPLICATIONS)}>
                  My Applications
                </button>
                <div className="menuSep" />
                <button className="menuItem menuItemDanger" onClick={onSignOut}>
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
