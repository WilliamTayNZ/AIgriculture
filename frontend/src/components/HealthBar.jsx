import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function HealthBar({ value, hbPos, setHbPos }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct > 70 ? "bg-success" : pct > 40 ? "bg-warning" : "bg-danger";

  // Make it draggable
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function onMouseMove(e) {
      if (dragging) {
        setHbPos({
          x: e.clientX - 130, // center offset
          y: e.clientY - 30,
        });
      }
    }
    function onMouseUp() {
      setDragging(false);
    }
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, setHbPos]);

  return (
    <div
      className={`healthbar-wrapper ${dragging ? "dragging" : ""}`}
      style={{ left: hbPos.x, top: hbPos.y }}
      onMouseDown={() => setDragging(true)}
    >
      <div className="rounded-3 shadow bg-white bg-opacity-75 p-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <Activity className="me-2" size={18} />
          <span className="fw-semibold text-muted">Field Health</span>
        </div>
        <div className="progress healthbar-progress">
          <div
            className={`progress-bar ${color}`}
            role="progressbar"
            style={{ width: `${pct}%` }}
            aria-valuenow={pct}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
        <div className="mt-1 text-end text-muted small">{pct}%</div>
      </div>
    </div>
  );
}