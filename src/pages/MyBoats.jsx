// src/pages/MyBoats.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { createBoat, deleteBoat, fetchMyBoats, updateBoat } from "../api/boats";
import { searchYachtClubs } from "../api/locations";

function Card({ children }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 14, background: "white" }}>{children}</div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        outline: "none",
        width: "100%",
      }}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        outline: "none",
        width: "100%",
        background: "white",
      }}
    />
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #0b2440",
        background: "#0b2440",
        color: "white",
        fontWeight: 800,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: "white",
        color: "#111827",
        fontWeight: 700,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 7, 18, 0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: "white",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid #eef2f7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 900, color: "#0b2440" }}>{title}</div>
          <GhostButton onClick={onClose}>✕</GhostButton>
        </div>
        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

function safeNum(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function YachtClubSelect({ value, onChange }) {
  const [q, setQ] = useState("");
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let mounted = true;
    const t = setTimeout(async () => {
      try {
        const list = await searchYachtClubs(q);
        if (mounted) setOptions(list);
      } catch {
        if (mounted) setOptions([]);
      }
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 12,
        padding: 10,
        background: "white",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 650 }}>{value || "None Selected"}</div>
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            padding: "6px 8px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <input
          value={q}
          onChange={(e) => {
            const next = e.target.value;
            setQ(next);
            const picked = options.find(
              (c) =>
                `${c.name}${c.state ? `, ${c.state}` : ""}`.toLowerCase() ===
                String(next || "").toLowerCase()
            );
            if (picked) {
              onChange(`${picked.name}${picked.state ? `, ${picked.state}` : ""}`);
            }
          }}
          onBlur={(e) => {
            const picked = options.find(
              (c) =>
                `${c.name}${c.state ? `, ${c.state}` : ""}`.toLowerCase() ===
                String(e.target.value || "").toLowerCase()
            );
            if (picked) {
              onChange(`${picked.name}${picked.state ? `, ${picked.state}` : ""}`);
            }
          }}
          placeholder="Search Clubs (e.g. Sandringham, RPYC, Blairgowrie)..."
          list="boat-home-clubs"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
        <datalist id="boat-home-clubs">
          {options.map((club) => {
            const label = `${club.name}${club.state ? `, ${club.state}` : ""}`;
            return <option key={club.id} value={label} />;
          })}
        </datalist>
      </div>
    </div>
  );
}

export default function MyBoats({ profileType }) {
  const { user } = useSession();
  const isOwner = profileType === "owner" || profileType === "both";

  const [boats, setBoats] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const [name, setName] = useState("");
  const [boatType, setBoatType] = useState("keelboat");
  const [klass, setKlass] = useState("");
  const [lengthM, setLengthM] = useState("");
  const [homePort, setHomePort] = useState("");
  const [offshore, setOffshore] = useState(false);

  async function load() {
    if (!user?.id) return;
    setErr(null);
    setLoading(true);
    try {
      const data = await fetchMyBoats();
      setBoats(data);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id && isOwner) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isOwner]);

  const isEditing = useMemo(() => !!editingId, [editingId]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setBoatType("keelboat");
    setKlass("");
    setLengthM("");
    setHomePort("");
    setOffshore(false);
  }

  function startEdit(b) {
    setEditingId(b.id);
    setName(b.name ?? "");
    setBoatType(b.boat_type ?? "keelboat");
    setKlass(b.class ?? "");
    setLengthM(b.length_m != null ? String(b.length_m) : "");
    setHomePort(b.home_port ?? "");
    setOffshore(!!b.is_offshore_capable);
    setFormOpen(true);
  }

  async function save() {
    setErr(null);

    if (!name.trim()) {
      setErr("Boat Name Is Required.");
      return;
    }

    const payload = {
      name: name.trim(),
      boat_type: boatType,
      class: klass.trim() || null,
      length_m: safeNum(lengthM),
      home_port: homePort.trim() || null,
      is_offshore_capable: !!offshore,
    };

    setBusy(true);
    try {
      if (editingId) {
        await updateBoat(editingId, payload);
      } else {
        await createBoat({ ...payload, owner_id: user.id });
      }
      await load();
      resetForm();
      setFormOpen(false);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete This Boat? If It Is Linked To Events, Deletion May Fail.")) return;
    setBusy(true);
    setErr(null);
    try {
      await deleteBoat(id);
      await load();
      if (editingId === id) resetForm();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  if (!isOwner) {
    return (
      <div style={{ marginTop: 12 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Boats</h3>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Boats Are Available For <b>Owner</b> Accounts.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Boats</h3>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Create Your Boat First. Events Will Require Selecting A Boat.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
            style={{ padding: "8px 12px", borderRadius: 10 }}
          >
            + Add Boat
          </button>
          <button onClick={load} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10 }}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>My Boats</div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {boats.map((b) => (
              <div
                key={b.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900 }}>{b.name ?? "Untitled"}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    {(b.boat_type ?? "—").toUpperCase()}
                    {b.class ? ` • ${b.class}` : ""}
                    {b.length_m != null ? ` • ${b.length_m}m` : ""}
                    {b.home_port ? ` • ${b.home_port}` : ""}
                    {b.is_offshore_capable ? ` • Offshore` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <GhostButton disabled={busy} onClick={() => startEdit(b)}>
                    Edit
                  </GhostButton>
                  <GhostButton disabled={busy} onClick={() => remove(b.id)}>
                    Delete
                  </GhostButton>
                </div>
              </div>
            ))}

            {!boats.length && (
              <div style={{ opacity: 0.75, padding: 12, border: "1px dashed #ddd", borderRadius: 12 }}>
                No Boats Yet. Add Your First Boat Above.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={formOpen}
        title={isEditing ? "Edit Boat" : "Add A Boat"}
        onClose={() => {
          if (busy) return;
          setFormOpen(false);
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Boat Name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wild Oats" />
          </Field>

          <Field label="Boat Type">
            <Select value={boatType} onChange={(e) => setBoatType(e.target.value)}>
              <option value="keelboat">Keelboat</option>
              <option value="dinghy">Dinghy</option>
              <option value="catamaran">Catamaran</option>
              <option value="yacht">Yacht</option>
              <option value="sportsboat">Sportsboat</option>
            </Select>
          </Field>

          <Field label="Class">
            <Input value={klass} onChange={(e) => setKlass(e.target.value)} placeholder="e.g. Farr 40 / J/70" />
          </Field>

          <Field label="Length (M)">
            <Input value={lengthM} onChange={(e) => setLengthM(e.target.value)} placeholder="e.g. 10.5" />
          </Field>

          <Field label="Home Club">
            <YachtClubSelect value={homePort} onChange={setHomePort} />
          </Field>

          <Field label="Offshore Capable">
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={offshore} onChange={(e) => setOffshore(e.target.checked)} />
              <span style={{ fontSize: 13, opacity: 0.85 }}>Yes</span>
            </label>
          </Field>
        </div>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <GhostButton disabled={busy} onClick={() => setFormOpen(false)}>
            Cancel
          </GhostButton>
          <PrimaryButton disabled={busy} onClick={save}>
            {busy ? "Saving…" : isEditing ? "Save Changes" : "Add Boat"}
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
