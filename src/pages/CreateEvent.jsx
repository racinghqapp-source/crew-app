import { useEffect, useState } from "react";
import { createOwnerEvent } from "../api/createEvent";
import { fetchMyBoats } from "../api/boats";
import { useSession } from "../hooks/useSession";

export default function CreateEvent({ onCreated, onCancel }) {
  const { user } = useSession();
  const [boats, setBoats] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const [title, setTitle] = useState("");
  const [boatId, setBoatId] = useState("");
  const [locationText, setLocationText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [crewRequired, setCrewRequired] = useState(5);

  useEffect(() => {
    fetchMyBoats().then(setBoats).catch(e => setErr(e.message));
  }, []);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      if (!user?.id) throw new Error("Missing user session.");
      await createOwnerEvent({
        ownerId: user.id,
        title,
        boatId,
        startDate,
        endDate,
        locationText,
        crewRequired: Number(crewRequired),
      });
      onCreated?.();
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h3>Create event</h3>

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <input placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} />
      <br />

      <select value={boatId} onChange={e => setBoatId(e.target.value)}>
        <option value="">Select boat</option>
        {boats.map(b => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.class})
          </option>
        ))}
      </select>
      <br />

      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      <br />

      <input
        placeholder="Location"
        value={locationText}
        onChange={e => setLocationText(e.target.value)}
      />
      <br />

      <input
        type="number"
        min="1"
        value={crewRequired}
        onChange={e => setCrewRequired(e.target.value)}
      />
      <small> Crew required</small>

      <br /><br />

      <button disabled={busy} onClick={submit}>
        {busy ? "Creating…" : "Create event"}
      </button>
      <button onClick={onCancel} style={{ marginLeft: 8 }}>
        Cancel
      </button>
    </div>
  );
}
