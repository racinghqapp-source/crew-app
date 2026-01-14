// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { searchYachtClubs, fetchYachtClubById } from "../api/locations";
import { fetchMyProfile, needsSailorOnboarding, updateMyProfile } from "../api/profile";

function Section({ title, children }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "white" }}>
      <div style={{ fontWeight: 900, color: "#0b2440", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
        fontSize: 12,
        fontWeight: 800,
        color: "#111827",
      }}
    >
      {children}
    </span>
  );
}

function HomeClubSection({ user, profile, setProfile }) {
  const [q, setQ] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [showOther, setShowOther] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile?.home_club_id) {
        setSelectedClub(null);
        return;
      }
      const club = await fetchYachtClubById(profile.home_club_id);
      if (mounted) setSelectedClub(club);
    })();
    return () => {
      mounted = false;
    };
  }, [profile?.home_club_id]);

  useEffect(() => {
    let mounted = true;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchYachtClubs(q);
        if (mounted) setOptions(res);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 250);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [q]);

  async function pickClub(club) {
    if (!user?.id) return;
    setSaving(true);
    try {
      const updated = await updateMyProfile(user.id, {
        home_club_id: club?.id || null,
      });
      setProfile(updated);
      setSelectedClub(club || null);
    } finally {
      setSaving(false);
    }
  }

  async function saveOtherHomePort(value) {
    if (!user?.id) return;
    setSaving(true);
    try {
      const updated = await updateMyProfile(user.id, {
        home_port: value || null,
      });
      setProfile(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: "1px solid #e7e7e7", borderRadius: 16, padding: 14, background: "white" }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
        Home yacht club (recommended)
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 650 }}>
          {selectedClub ? `${selectedClub.name} — ${selectedClub.state || ""}` : "None selected"}
        </div>

        <button
          disabled={saving}
          onClick={() => pickClub(null)}
          style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid #ccc", background: "white" }}
        >
          Clear
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clubs (e.g. Sandringham, RPYC, Blairgowrie)…"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
        />
        <div style={{ alignSelf: "center", fontSize: 12, opacity: 0.75 }}>
          {loading ? "Searching…" : `${options.length} results`}
        </div>
      </div>

      <div style={{ marginTop: 10, maxHeight: 240, overflow: "auto" }}>
        {options.map((club) => (
          <button
            key={club.id}
            disabled={saving}
            onClick={() => pickClub(club)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 10px",
              borderRadius: 12,
              border: "1px solid transparent",
              background: "transparent",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f6f7fb")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ fontWeight: 650 }}>{club.name}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{club.state}</div>
          </button>
        ))}

        {!loading && options.length === 0 && (
          <div style={{ padding: 10, opacity: 0.75 }}>
            No matches. If you just loaded the clubs, this usually means RLS isn’t allowing reads.
          </div>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          onClick={() => setShowOther((v) => !v)}
          style={{ padding: 0, border: "none", background: "transparent", color: "#1a4fff", cursor: "pointer" }}
        >
          Can’t find your club?
        </button>

        {showOther && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
              Other home port (optional)
            </div>
            <input
              defaultValue={profile?.home_port || ""}
              onBlur={(e) => saveOtherHomePort(e.target.value)}
              placeholder="Type your home port / club name…"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" }}
            />
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
              This is only used if your club isn’t in the list.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ROLE_OPTIONS = ["Bow", "Pit", "Mast", "Tactician", "Trimmer", "Grinder", "Helm", "Nav", "Offshore"];
const EXPERIENCE_OPTIONS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "expert", label: "Expert" },
];
const PROFILE_TYPES = [
  { id: "sailor", label: "Sailor" },
  { id: "owner", label: "Owner" },
  { id: "both", label: "Both" },
];

export default function Profile({ profile: initialProfile, onSaved }) {
  const { user } = useSession();

  const [p, setP] = useState(initialProfile || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [okMsg, setOkMsg] = useState("");

  async function load() {
    if (!user?.id) return;
    setErr(null);
    setLoading(true);
    try {
      const fresh = await fetchMyProfile(user.id);
      setP(fresh);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const complete = useMemo(() => (p ? !needsSailorOnboarding(p) : false), [p]);

  async function save() {
    if (!user?.id) return;
    setSaving(true);
    setErr(null);
    setOkMsg("");
    try {
      const patch = {
        display_name: p?.display_name ?? "",
        profile_type: p?.profile_type ?? "sailor",
        roles: p?.roles ?? [],
        sailor_roles: p?.sailor_roles ?? p?.roles ?? [],
        experience_level: p?.experience_level ?? null,
        location_text: p?.location_text ?? null,
        home_port: p?.home_port ?? null,
        home_club_id: p?.home_club_id ?? null,
        offshore_qualified: !!p?.offshore_qualified,
        is_available: !!p?.is_available,
        willing_to_travel: !!p?.willing_to_travel,
      };

      const saved = await updateMyProfile(user.id, patch);
      setP(saved);
      setOkMsg("Saved ✅");
      onSaved?.();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div style={{ marginTop: 12, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: 0, color: "#0b2440" }}>Your profile</h3>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Complete this to unlock the app.
            <span style={{ marginLeft: 10 }}>{complete ? <Chip>Complete</Chip> : <Chip>Incomplete</Chip>}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={load}
            disabled={loading}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white" }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={save}
            disabled={saving || loading || !p}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #0b2440",
              background: "#0b2440",
              color: "white",
              fontWeight: 900,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}
      {okMsg && <div style={{ color: "#166534", marginTop: 12 }}>{okMsg}</div>}

      {!p ? (
        <div style={{ marginTop: 12, opacity: 0.75 }}>Loading profile…</div>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <Section title="Basics (required)">
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>
                Display name <b style={{ color: "crimson" }}>*</b>
              </label>
              <input
                value={p.display_name ?? ""}
                onChange={(e) => setP({ ...p, display_name: e.target.value })}
                style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
                placeholder="e.g. Rhett Nicholas"
              />

              <label style={{ fontSize: 12, opacity: 0.8 }}>
                Account type <b style={{ color: "crimson" }}>*</b>
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {PROFILE_TYPES.map((t) => {
                  const active = String(p.profile_type || "").toLowerCase() === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setP({ ...p, profile_type: t.id })}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        background: active ? "#0b2440" : "white",
                        color: active ? "white" : "#111827",
                        fontWeight: 900,
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <label style={{ fontSize: 12, opacity: 0.8 }}>Location</label>
              <input
                value={p.location_text ?? ""}
                onChange={(e) => setP({ ...p, location_text: e.target.value })}
                style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
                placeholder="e.g. Melbourne, VIC"
              />
            </div>
          </Section>

          <Section title="Home yacht club">
            <HomeClubSection user={user} profile={p} setProfile={setP} />
          </Section>

          {String(p.profile_type || "").toLowerCase() !== "owner" && (
            <Section title="Roles (required for sailors)">
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
                Pick at least <b>one role</b> so owners can match you.
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {ROLE_OPTIONS.map((r) => {
                  const selected = Array.isArray(p.roles) && p.roles.includes(r);
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        const roles = Array.isArray(p.roles) ? [...p.roles] : [];
                        const next = selected ? roles.filter((x) => x !== r) : roles.concat(r);
                        setP({ ...p, roles: next });
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 999,
                        border: "1px solid #e5e7eb",
                        background: selected ? "#0b2440" : "white",
                        color: selected ? "white" : "#111827",
                        fontWeight: 900,
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {String(p.profile_type || "").toLowerCase() !== "owner" && (
            <Section title="Sailing experience (required for sailors)">
              <label style={{ fontSize: 12, opacity: 0.8 }}>Experience level</label>
              <select
                value={p.experience_level ?? ""}
                onChange={(e) =>
                  setP({ ...p, experience_level: e.target.value || null })
                }
                style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }}
              >
                <option value="">Select level</option>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Section>
          )}

          <Section title="Availability & qualifications">
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={!!p.offshore_qualified}
                  onChange={(e) => setP({ ...p, offshore_qualified: e.target.checked })}
                />
                Offshore qualified
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={!!p.is_available}
                  onChange={(e) => setP({ ...p, is_available: e.target.checked })}
                />
                Currently available
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={!!p.willing_to_travel}
                  onChange={(e) => setP({ ...p, willing_to_travel: e.target.checked })}
                />
                Willing to travel
              </label>
            </div>
          </Section>
        </div>
      )}

      {!complete && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 14,
            border: "1px solid #fed7aa",
            background: "#fff7ed",
            color: "#9a3412",
            fontWeight: 800,
          }}
        >
          Finish the required fields (display name + account type + roles + experience level for sailors)
          to unlock the app.
        </div>
      )}
    </div>
  );
}
