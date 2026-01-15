import "./button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}) {
  const cls = ["btn", `btn_${variant}`, `btn_${size}`].join(" ");
  return (
    <button className={cls} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
