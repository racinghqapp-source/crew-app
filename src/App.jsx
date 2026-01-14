// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { supabase } from "./lib/supabase";
import { useSession } from "./hooks/useSession";
import { ensureProfile, needsSailorOnboarding } from "./api/profile";
import { fetchUnreadInviteCount } from "./api/inbox";
import { ROUTES } from "./routes";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Nav from "./components/Nav";

import Discovery from "./pages/Discovery";
import MyApplications from "./pages/MyApplications";
import MyParticipations from "./pages/MyParticipations";
import Upgrade from "./pages/Upgrade";
import MyBoats from "./pages/MyBoats";
import OwnerInvites from "./pages/OwnerInvites";
import Events from "./pages/Events";
import EventCrewBoard from "./pages/EventCrewBoard";
import CreateEvent from "./pages/CreateEvent";
import Profile from "./pages/Profile";
import EventDetails from "./pages/EventDetails";
import Inbox from "./pages/Inbox";

export default function App() {
  const { user, loading } = useSession();

  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(false);
  const [bootErr, setBootErr] = useState(null);

  const [page, setPage] = useState(ROUTES.LOGIN);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [planBump, setPlanBump] = useState(0);
  const [unreadInvites, setUnreadInvites] = useState(0);

  const isOwner = useMemo(() => {
    const t = profile?.profile_type;
    return t === "owner" || t === "both";
  }, [profile?.profile_type]);

  // Boot profile (creates/ensures profile row exists)
  useEffect(() => {
    let mounted = true;

    async function boot() {
      setBootErr(null);
      setProfile(null);

      if (!user?.id) return;

      setBooting(true);
      try {
        const p = await ensureProfile({ user });
        if (!mounted) return;
        setProfile(p);
      } catch (e) {
        if (!mounted) return;
        setBootErr(e.message ?? String(e));
      } finally {
        if (mounted) setBooting(false);
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, [user?.id, planBump]);

  useEffect(() => {
    let mounted = true;

    async function loadUnread() {
      if (!user?.id) return;
      if (!profile) return;

      try {
        const n = await fetchUnreadInviteCount(user.id);
        if (mounted) setUnreadInvites(n);
      } catch {
        // ignore for MVP
      }
    }

    loadUnread();
    return () => {
      mounted = false;
    };
  }, [user?.id, profile?.id, planBump]);

  useEffect(() => {
    if (user?.id && (page === ROUTES.LOGIN || page === ROUTES.SIGN_UP)) {
      setPage(ROUTES.DISCOVER);
    }
  }, [user?.id, page]);

  // Guard owner-only pages
  useEffect(() => {
    const ownerOnly =
      page === ROUTES.BOATS ||
      page === ROUTES.EVENTS ||
      page === ROUTES.EVENT_CREW ||
      page === ROUTES.INVITES;
    if (!ownerOnly) return;
    if (!profile) return; // avoid flicker while booting

    // If onboarding incomplete, keep them in profile
    if (needsSailorOnboarding(profile)) {
      setPage(ROUTES.SAILOR_ONBOARDING);
      return;
    }

    if (!isOwner) setPage(ROUTES.DISCOVER);
  }, [page, profile, isOwner]);

  useEffect(() => {
    if (!user?.id) return;
    if (!profile) return;

    if (
      needsSailorOnboarding(profile) &&
      page !== ROUTES.SAILOR_ONBOARDING &&
      page !== ROUTES.PROFILE
    ) {
      setPage(ROUTES.SAILOR_ONBOARDING);
    }
  }, [user?.id, profile, page]);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setPage(ROUTES.LOGIN);
  }

  // ---- Render states ----
  if (loading) return <div className="container">Loading session…</div>;
  if (!user) {
    if (page === ROUTES.SIGN_UP) return <SignUp onDone={() => setPage(ROUTES.LOGIN)} />;
    return <Login onCreateAccount={() => setPage(ROUTES.SIGN_UP)} />;
  }
  if (booting) return <div className="container">Setting up your profile…</div>;

  if (bootErr) {
    return (
      <div className="container">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Boot error</h3>
          <div style={{ color: "crimson" }}>{bootErr}</div>
          <button className="btn btnPrimary" style={{ marginTop: 12 }} onClick={signOut}>
            Sign out
          </button>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
            Common causes: RLS policies, missing columns, or env vars not set.
          </div>
        </div>
      </div>
    );
  }

  function renderPage() {
    switch (page) {
      case ROUTES.PROFILE:
        return <Profile profile={profile} onSaved={() => setPlanBump((n) => n + 1)} />;
      case ROUTES.SAILOR_ONBOARDING:
        return <Profile profile={profile} onSaved={() => setPlanBump((n) => n + 1)} />;
      case ROUTES.DISCOVER:
        return (
          <Discovery
            profileType={profile?.profile_type}
            profile={profile}
            onNavigate={setPage}
            onOpenEvent={(eventId) => {
              setSelectedEventId(eventId);
              setPage(ROUTES.EVENT_DETAILS);
            }}
          />
        );
      case ROUTES.APPLICATIONS:
        return <MyApplications />;
      case ROUTES.SAILING:
        return <MyParticipations />;
      case ROUTES.BOATS:
        return <MyBoats profileType={profile?.profile_type} />;
      case ROUTES.EVENTS:
        return (
          <Events
            profileType={profile?.profile_type}
            onCreateEvent={() => {
              setPage(ROUTES.CREATE_EVENT);
            }}
            onManageCrew={(eventId) => {
              setSelectedEventId(eventId);
              setPage(ROUTES.EVENT_CREW);
            }}
          />
        );
      case ROUTES.EVENT_DETAILS:
        return (
          <EventDetails
            eventId={selectedEventId}
            profileType={profile?.profile_type}
            profile={profile}
            onBack={() => setPage(ROUTES.DISCOVER)}
            onGoApplications={() => setPage(ROUTES.APPLICATIONS)}
          />
        );
      case ROUTES.INVITES:
        return <OwnerInvites profileType={profile?.profile_type} />;
      case ROUTES.INBOX:
        return <Inbox userId={user.id} />;
      case ROUTES.CREATE_EVENT:
        return (
          <CreateEvent
            profileType={profile?.profile_type}
            onBack={() => setPage(ROUTES.EVENTS)}
            onCreated={() => setPage(ROUTES.EVENTS)}
          />
        );
      case ROUTES.EVENT_CREW:
        return (
          <EventCrewBoard
            eventId={selectedEventId}
            profileType={profile?.profile_type}
            onBack={() => setPage(ROUTES.EVENTS)}
          />
        );
      case ROUTES.UPGRADE:
        return (
          <Upgrade
            userId={user.id}
            planTier={profile?.plan_tier}
            onUpgraded={() => setPlanBump((n) => n + 1)}
          />
        );
      default:
        return <Discovery profileType={profile?.profile_type} />;
    }
  }

  if (import.meta.env.DEV) {
    const known = new Set(Object.values(ROUTES));
    if (!known.has(page)) console.warn("Unknown route:", { name: page });
  }

  return (
    <div className="container">
      <div className="topbar">
        <div>
          <div className="title">Crew App</div>
          <div className="subtle">
            Signed in as <b>{user.email}</b>
            {profile?.profile_type ? (
              <>
                {" "}
                • <b>{String(profile.profile_type).toUpperCase()}</b>
              </>
            ) : null}
          </div>
        </div>

        <button className="btn btnGhost" onClick={signOut}>
          Sign out
        </button>
      </div>

      <Nav
        current={page}
        onChange={setPage}
        isOwner={isOwner}
        locked={profile ? needsSailorOnboarding(profile) : true}
        unreadInvites={unreadInvites}
      />

      {renderPage()}

      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.6 }}>
        Owner spine: Boats → Events → Discover → Invite. Sailor spine: Discover → Applications → Sailing.
      </div>
    </div>
  );
}
