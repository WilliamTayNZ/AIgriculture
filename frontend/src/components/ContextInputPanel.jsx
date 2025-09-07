// ---------------------- Context input & AI ----------------------
export default function ContextInputPanel({ context, setContext }) {
  return (
    <div className="card h-100">
      <div className="card-header pb-2">
        <h5 className="card-title mb-0">Add Context</h5>
      </div>
      <div className="card-body">
        <label className="form-label small text-muted">Describe your field, crop, or situation:</label>
        <textarea
          className="form-control"
          rows={5}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="E.g. Wheat field, recent rain, signs of aphids..."
        />
        <div className="mt-2 text-muted small">This context helps AI generate more relevant suggestions.</div>
      </div>
    </div>
  );
}