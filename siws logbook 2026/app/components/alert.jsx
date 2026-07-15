export default function Alert({ type = "info", children }) {
  const icons = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌" };
  return <div className={`alert ${type}`}><span>{icons[type]}</span><span>{children}</span></div>;
}
