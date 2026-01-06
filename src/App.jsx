// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

import { supabase } from "./lib/supabase";
import { useSession } from "./hooks/useSession";
import { ensureProfile } from "./api/profile";

import Login from "./pages/Login";
import MyParticipations from "./pages/MyParticipations";
import OwnerApplicants from "./pages/OwnerApplicants";
import Upgrade from "./pages/Upgrade";
import Discovery from "./pages/Discovery";

export default function App() {
  const { user, loading } = useSession();

  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(false);
  const [bootErr, setBootErr] = useState(null);

  // used to force re-fetch after upgrade
  const [planBump, setPlanBump] = useState(0);

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

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  // ---------- RENDER STATES ----------

  if (loading) {
    return <div style={{ padding: 16 }}>Loading session…</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (booting) {
    return <div style={{ padding: 16 }}>Setting up your profile…</div>;
  }

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Crew App</h2>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Signed in as <b>{user.email}</b>
          </div>
        </div>
        <button onClick={signOut}>Sign out</button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {/* Profile */}
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
        <div>
          <b>User ID:</b> {profile?.id}
        </div>
      </div>

      {/* Upgrade */}
      <Upgrade
        userId={user.id}
        planTier={profile?.plan_tier}
        onUpgraded={() => setPlanBump((n) => n + 1)}
      />

      {/* Discovery */}
      <Discovery profileType={profile?.profile_type} />

      {/* Participations */}
      <MyParticipations />

      {/* Owner view */}
      <OwnerApplicants
        profileType={profile?.profile_type}
        planTier={profile?.plan_tier}
      />

      <div style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>
        Next: Discovery → Invitations → Crew reputation network.
      </div>
    </div>
  );
}
