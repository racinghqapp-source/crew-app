import { useState } from "react";
import { signUpWithPassword } from "../api/auth";

export default function SignUp({ onDone }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await signUpWithPassword(email.trim(), pw);
      // Depending on your Supabase settings, user may need email confirm.
      onDone?.();
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h2>Create Account</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            autoComplete="new-password"
          />
        </label>

        <button disabled={loading} style={{ padding: 10 }}>
          {loading ? "Creating…" : "Create"}
        </button>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </form>
    </div>
  );
}
