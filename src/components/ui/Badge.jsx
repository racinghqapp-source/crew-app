import "./badge.css";

export default function Badge({ tone = "muted", children }) {
  return <span className={`badge badge_${tone}`}>{children}</span>;
}
