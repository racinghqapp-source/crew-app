// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { supabase } from "./lib/supabase";
import { useSession } from "./hooks/useSession";
import { ensureProfile } from "./api/profile";

import Login from "./pages/Login";
import Discovery from "./pages/Discovery";
import MyApplications from "./pages/MyApplications";
import MyParticipations from "./pages/MyParticipations";
import OwnerApplicants from "./pages/OwnerApplicants";
import Upgrade from "./pages/Upgrade";

import Nav from "./components/Nav";

export default function App() {
  const { user, loading } = useSession();

  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(false);
  const [bootErr, setBootErr] = useState(null);

  // used to force re-fetch after upgrade
  const [planBump, setPlanBump] = useState(0);

  // UI state
  const [page, setPage] = useState("discover");
  const [showProfile, setShowProfile] = useState(false);

  const isOwner = useMemo(() => profile?.profile_type === "owner", [profile?.profile_type]);

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

        // Set a sensible default landing page once we know role
        // (only if user hasn't already navigated)
        setPage((prev) => {
          if (prev && prev !== "discover") return prev;
          return p?.profile_type === "owner" ? "manage" : "applications";
        });
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

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  // ---------- RENDER STATES ----------

  if (loading) return <div style={{ padding: 16 }}>Loading session…</div>;
  if (!user) return <Login />;
  if (booting) return <div style={{ padding: 16 }}>Setting up your profile…</div>;

  if (bootErr) {
    return (
      <div style={{ padding: 16 }}>
        <h3>Boot error</h3>
        <div style={{ color: "crimson" }}>{bootErr}</div>
        <button style={{ marginTop: 12 }} onClick={signOut}>
          Sign out
        </button>
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
          Common causes: RLS policies, missing columns, or env vars not set.
        </div>
      </div>
    );
  }

  // ---------- MAIN APP ----------

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Crew App</h2>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Signed in as <b>{user.email}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setShowProfile((v) => !v)}>
            {showProfile ? "Hide profile" : "Profile"}
          </button>
          <button onClick={signOut}>Sign out</button>
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {/* Collapsible Profile */}
      {showProfile && (
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Profile</h3>
          <div style={{ lineHeight: "1.6" }}>
            <div>
              <b>Name:</b> {profile?.display_name}
            </div>
            <div>
              <b>Type:</b> {profile?.profile_type}
            </div>
            <div>
              <b>Plan:</b> {(profile?.plan_tier ?? "free").toUpperCase()}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              <b>User ID:</b> {profile?.id}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Nav current={page} onChange={setPage} isOwner={isOwner} />

      {/* Pages (ONLY ONE AT A TIME) */}
      {page === "discover" && <Discovery profileType={profile?.profile_type} />}

      {page === "applications" && <MyApplications />}

      {page === "sailing" && <MyParticipations />}

      {page === "manage" && (
        <OwnerApplicants profileType={profile?.profile_type} planTier={profile?.plan_tier} />
      )}

      {page === "upgrade" && (
        <Upgrade
          userId={user.id}
          planTier={profile?.plan_tier}
          onUpgraded={() => setPlanBump((n) => n + 1)}
        />
      )}

      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.7 }}>
        Tip: Use <b>Applications</b> as your inbox, <b>Sailing</b> for confirmed sails, and <b>Discover</b> to find crew.
      </div>
    </div>
  );
}
