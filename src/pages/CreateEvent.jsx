import { useEffect, useMemo, useState } from "react";
import { createOwnerEvent } from "../api/createEvent";
import { fetchMyBoats } from "../api/boats";
import { useSession } from "../hooks/useSession";
import YachtClubPicker from "../components/YachtClubPicker";

export default function CreateEvent({ onCreated, onCancel }) {
  const { user } = useSession();
  const [boats, setBoats] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const [title, setTitle] = useState("");
  const [boatId, setBoatId] = useState("");
  const [locationText, setLocationText] = useState("");
  const [locationId, setLocationId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [crewRequired, setCrewRequired] = useState(5);

  useEffect(() => {
    fetchMyBoats().then(setBoats).catch((e) => setErr(e.message ?? String(e)));
  }, []);

  const canCreate = useMemo(() => {
    const t = title?.trim();
    const loc = locationText?.trim();
    return Boolean(user?.id) && Boolean(t) && Boolean(boatId) && Boolean(startDate) && Boolean(loc);
  }, [user?.id, title, boatId, startDate, locationText]);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const t = title.trim();
      const loc = (locationText ?? "").trim();

      if (!user?.id) return setErr("Missing User Session.");
      if (!t) return setErr("Please Enter An Event Title.");
      if (!boatId) return setErr("Please Select A Boat.");
      if (!startDate) return setErr("Please Choose A Start Date.");
      if (!loc) return setErr("Please Select A Yacht Club / Location.");

      if (endDate && new Date(endDate) < new Date(startDate)) {
        return setErr("End Date Cannot Be Before Start Date.");
      }

      await createOwnerEvent({
        ownerId: user.id,
        title: t,
        boatId,
        startDate,
        endDate: endDate || null,
        locationText: loc,
        locationId: locationId,
        crewRequired: Number(crewRequired) || 1,
      });
      onCreated?.();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>Create Event</h3>
        <button className="btn btnGhost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>

      {err ? (
        <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>{err}</div>
      ) : null}

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <div>
          <div className="subtle" style={{ fontWeight: 700, marginBottom: 6 }}>
            Event Title
          </div>
          <input
            className="input"
            placeholder="e.g. Saturday Bay Race"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <div className="subtle" style={{ fontWeight: 700, marginBottom: 6 }}>
            Boat
          </div>
          <select
            value={boatId}
            onChange={(e) => setBoatId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
            }}
          >
            <option value="">Select Boat</option>
            {boats.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div className="subtle" style={{ fontWeight: 700, marginBottom: 6 }}>
              Start Date
            </div>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <div className="subtle" style={{ fontWeight: 700, marginBottom: 6 }}>
              End Date (Optional)
            </div>
            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="subtle" style={{ fontWeight: 700, marginBottom: 6 }}>
            Location
          </div>
          <YachtClubPicker
            value={locationText}
            onChangeText={setLocationText}
            onSelectLocation={(loc) => {
              setLocationId(loc?.id ?? null);
              setLocationText(loc?.name ?? "");
            }}
            placeholder="Search Clubs Or Locations..."
          />
          {locationText ? (
            <div className="subtle" style={{ marginTop: 6 }}>
              Selected Location: <b>{locationText}</b>
            </div>
          ) : null}
        </div>

        <div>
          <div className="subtle" style={{ fontWeight: 700, marginBottom: 6 }}>
            Crew Required
          </div>
          <input
            className="input"
            type="number"
            min="1"
            value={crewRequired}
            onChange={(e) => setCrewRequired(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btnPrimary" disabled={busy || !canCreate} onClick={submit}>
            {busy ? "Creating…" : "Create Event"}
          </button>
          <button className="btn btnGhost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
