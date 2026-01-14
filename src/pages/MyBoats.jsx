// src/pages/MyBoats.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "../hooks/useSession";
import { createBoat, deleteBoat, fetchMyBoats, updateBoat } from "../api/boats";

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

function safeNum(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function MyBoats({ profileType }) {
  const { user } = useSession();
  const isOwner = profileType === "owner" || profileType === "both";

  const [boats, setBoats] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);

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
  }

  async function save() {
    setErr(null);

    if (!name.trim()) {
      setErr("Boat name is required.");
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
        await createBoat(payload);
      }
      await load();
      resetForm();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this boat? If it is linked to events, deletion may fail.")) return;
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
            Boats are available for <b>owner</b> accounts.
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
            Create your boat first. Events will require selecting a boat.
          </div>
        </div>

        <button onClick={load} disabled={loading} style={{ padding: "8px 12px", borderRadius: 10 }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ fontWeight: 900, color: "#0b2440" }}>{isEditing ? "Edit boat" : "Add a boat"}</div>
            {isEditing && (
              <GhostButton disabled={busy} onClick={resetForm}>
                Cancel
              </GhostButton>
            )}
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Boat name *">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wild Oats" />
            </Field>

            <Field label="Boat type">
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

            <Field label="Length (m)">
              <Input value={lengthM} onChange={(e) => setLengthM(e.target.value)} placeholder="e.g. 10.5" />
            </Field>

            <Field label="Home port">
              <Input value={homePort} onChange={(e) => setHomePort(e.target.value)} placeholder="e.g. Melbourne" />
            </Field>

            <Field label="Offshore capable">
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="checkbox" checked={offshore} onChange={(e) => setOffshore(e.target.checked)} />
                <span style={{ fontSize: 13, opacity: 0.85 }}>Yes</span>
              </label>
            </Field>
          </div>

          <div style={{ marginTop: 12 }}>
            <PrimaryButton disabled={busy} onClick={save}>
              {busy ? "Saving…" : isEditing ? "Save changes" : "Add boat"}
            </PrimaryButton>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 900, color: "#0b2440" }}>My boats</div>

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
                No boats yet. Add your first boat above.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
