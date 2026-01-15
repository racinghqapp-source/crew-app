import { useEffect, useState } from "react";
import { searchYachtClubs } from "../api/locations";

export default function YachtClubPicker({
  value,
  onChangeText,
  onSelectLocation,
  placeholder,
}) {
  const [q, setQ] = useState("");
  const [options, setOptions] = useState([]);
  const [showOther, setShowOther] = useState(false);

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
          onClick={() => {
            onSelectLocation?.(null);
            onChangeText?.("");
          }}
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
            onChangeText?.(next);
            const picked = options.find(
              (c) =>
                `${c.name}${c.state ? `, ${c.state}` : ""}`.toLowerCase() ===
                String(next || "").toLowerCase()
            );
            if (picked) {
              onSelectLocation?.(picked);
              onChangeText?.(picked.name ?? "");
            }
          }}
          onBlur={(e) => {
            const picked = options.find(
              (c) =>
                `${c.name}${c.state ? `, ${c.state}` : ""}`.toLowerCase() ===
                String(e.target.value || "").toLowerCase()
            );
            if (picked) {
              onSelectLocation?.(picked);
              onChangeText?.(picked.name ?? "");
            }
          }}
          placeholder={placeholder || "Search Clubs (e.g. Sandringham, RPYC, Blairgowrie)..."}
          list="yacht-club-options"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
        <datalist id="yacht-club-options">
          {options.map((club) => {
            const label = `${club.name}${club.state ? `, ${club.state}` : ""}`;
            return <option key={club.id} value={label} />;
          })}
        </datalist>
      </div>

      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setShowOther((v) => !v)}
          style={{
            padding: 0,
            border: "none",
            background: "transparent",
            color: "#1a4fff",
            cursor: "pointer",
          }}
        >
          Can’t Find Your Club?
        </button>

        {showOther && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
              Other Location (Optional)
            </div>
            <input
              value={value ?? ""}
              onChange={(e) => {
                const next = e.target.value;
                onSelectLocation?.(null);
                onChangeText?.(next);
              }}
              placeholder="Type A Location..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
