import { AlertCircle } from "lucide-react";

export default function AlertsPanel({ items = [] }) {
  return (
    <div className="card h-100">
      <div className="card-header pb-2">
        <h5 className="card-title d-flex align-items-center gap-2 mb-0">
          <AlertCircle size={18} className="me-2" /> Alerts
        </h5>
      </div>
      <div className="card-body">
        {items.map((a) => (
          <div key={a.id} className="d-flex align-items-start gap-3 p-3 rounded border mb-2 bg-light">
            <span className={`badge ${a.level === "warning" ? "bg-warning text-dark" : a.level === "danger" ? "bg-danger" : "bg-secondary"}`}>
              {a.level}
            </span>
            <div className="small">
              <div className="fw-medium">{a.title}</div>
              <div className="text-muted">{a.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}