import { Bell } from "lucide-react";

export default function AlertBanner({ alert, onDismiss }) {
  if (!alert) return null;
  const levelStyles = { warning: "alert-warning", danger: "alert-danger", info: "alert-info" };
  return (
    <div className={`alert ${levelStyles[alert.level] || "alert-secondary"} d-flex align-items-center mb-0 rounded-0 border-bottom`} role="alert">
      <Bell className="me-2" size={20} />
      <strong className="me-2">ALERT:</strong>
      <span className="me-auto">
        <span className="fw-medium">{alert.title} – </span>
        <span className="opacity-75">{alert.msg}</span>
      </span>
      <button type="button" className="btn btn-outline-secondary btn-sm ms-3" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}