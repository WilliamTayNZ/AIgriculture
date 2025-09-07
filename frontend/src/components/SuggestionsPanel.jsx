import { ChevronRight } from "lucide-react";

export default function SuggestionsPanel({ tips = [], onGenerate }) {
  return (
    <div className="card h-100">
      <div className="card-header pb-2">
        <h5 className="card-title mb-0">AI Suggestions</h5>
      </div>
      <div className="card-body">
        {tips.map((tip, i) => (
          <div key={i} className="p-3 rounded bg-success bg-opacity-10 border mb-2 text-dark small">
            {tip}
          </div>
        ))}
        <button className="btn btn-outline-success mt-2" onClick={onGenerate}>
          Generate <ChevronRight className="ms-1" size={16} />
        </button>
      </div>
    </div>
  );
}