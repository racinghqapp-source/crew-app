// src/components/Input.jsx
export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  style = {},
  ...props
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      className="input"
      style={style}
      {...props}
    />
  );
}
