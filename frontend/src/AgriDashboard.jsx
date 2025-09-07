// src/AgriDashboard.jsx
import React, { useState, useEffect } from "react";
import { AlertCircle, Bell, CheckCircle2, ChevronRight, MapPin, Activity } from "lucide-react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// If NOT using Bootstrap CDN in index.html, install & uncomment these lines:
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { fetchChatGPTResponse } from "./services/api.js";

// Chart.js + react-chartjs-2
import { Bar, Pie, Scatter } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/* Dummy data used to test the frontend when first building and no data was available
const seedData = (seed = 1) => {
  const rand = (m = 1) => {
    seed = (seed * 9301 + 49297) % 233280;
    return (seed / 233280) * m;
  };
  return {
    rainfall: Array.from({ length: 12 }, (_, i) => ({
      month: `M${i + 1}`,
      mm: Math.round(40 + rand(1) * 180),
      temp: Math.round(10 + rand(1) * 22),
    })),
    yieldPct: [
      { name: "Healthy", value: Math.round(50 + rand(1) * 30) },
      { name: "At Risk", value: Math.round(10 + rand(1) * 15) },
      { name: "Poor", value: Math.round(5 + rand(1) * 15) },
    ],
    pestPct: [
      { name: "Aphids", value: Math.round(30 + rand(1) * 20) },
      { name: "Leaf Miner", value: Math.round(20 + rand(1) * 20) },
      { name: "Other", value: Math.round(10 + rand(1) * 10) },
    ],
    tempVsMoisture: Array.from({ length: 20 }, () => ({
      temp: Math.round(10 + rand(1) * 22),
      moist: Math.round(20 + rand(1) * 70),
    })),
    health: Math.round(55 + rand(1) * 45),
    alerts: [
      { id: 1, level: "warning", title: "Fungal risk elevated", msg: "High humidity favors rust development." },
      { id: 2, level: "info", title: "Mild drought watch", msg: "Rainfall below seasonal average." },
    ],
    aiTips: [
      "Irrigate in early morning to reduce evaporation.",
      "Rotate crops to reduce soil-borne pests.",
      "Mulch to retain soil moisture and suppress weeds.",
    ],
    context: [
      "Soil type: Loam (pH 6.2–6.7)",
      "Prevailing wind: SW, avg 12 km/h",
      "Dominant vegetation: ryegrass/clover",
      "Common pests: leaf miner, aphids",
    ],
  };
};
*/

// ---------------------- UI Pieces ----------------------
function HealthBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct > 70 ? "bg-success" : pct > 40 ? "bg-warning" : "bg-danger";

  // Make it draggable
  const [pos, setPos] = useState({ x: 450, y: 42 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function onMouseMove(e) {
      if (dragging) {
        setPos({
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
  }, [dragging]);

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: 260,
        zIndex: 1000,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
      onMouseDown={() => setDragging(true)}
    >
      <div className="rounded-3 shadow bg-white bg-opacity-75 p-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <Activity className="me-2" size={18} />
          <span className="fw-semibold text-muted">Field Health</span>
        </div>
        <div className="progress" style={{ height: "12px" }}>
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

function AlertBanner({ alert, onDismiss }) {
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

function NZMapPanel({ onPick }) {
  const center = [-41.3, 174.7]; // NZ
  const zoom = 5;

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  return (
    <div className="card h-100">
      <div className="card-header pb-2">
        <h5 className="card-title d-flex align-items-center gap-2 mb-0">
          <MapPin size={18} className="me-2" />
          World Map (click to select)
        </h5>
      </div>
      <div className="card-body" style={{ height: 520, position: "relative", padding: 0 }}>
        <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%", borderRadius: "0.5rem", zIndex: 1 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
          <MapClickHandler />
        </MapContainer>

        {/* light grid overlay, optional */}
        <svg className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: "none", zIndex: 2 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dbe5f1" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-secondary small" style={{ pointerEvents: "none", zIndex: 3 }}>
          (Click anywhere to get latitude/longitude)
        </div>
      </div>
    </div>
  );
}

// ---------------------- Data helpers ----------------------
function seededNoise(seed, pct = 0.12) {
  let s = Math.abs(Math.floor(seed * 100000));
  s = (s * 9301 + 49297) % 233280;
  const r = s / 233280;
  return 1 + (r * 2 - 1) * pct; // [1-pct, 1+pct]
}

function getClosestGrid(lat, lon, dataset) {
  const keys = Object.keys(dataset).filter((k) => k !== "lat_step" && k !== "lon_step");
  let minDist = Infinity;
  let closestKey = null;
  let closestLat = null;
  let closestLon = null;
  for (const key of keys) {
    const [gridLon, gridLat] = key.split(",").map(Number);
    const dist = Math.sqrt((lat - gridLat) ** 2 + (lon - gridLon) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closestKey = key;
      closestLat = gridLat;
      closestLon = gridLon;
    }
  }
  return { key: closestKey, lat: closestLat, lon: closestLon };
}

function getAreaGridData(gridLat, gridLon, dataset) {
  const latStep = dataset.lat_step || 20;
  const lonStep = dataset.lon_step || 30;
  const points = [];
  for (let dLat of [-latStep, 0, latStep]) {
    for (let dLon of [-lonStep, 0, lonStep]) {
      const lat = gridLat + dLat;
      const lon = gridLon + dLon;
      const key = `${lon},${lat}`;
      if (dataset[key]) {
        points.push({ ...dataset[key], gridLat: lat, gridLon: lon });
      }
    }
  }
  return points;
}

function getDataForLocation(lat, lon, dataset) {
  const { key, lat: gridLat, lon: gridLon } = getClosestGrid(lat, lon, dataset);
  const entry = dataset[key];
  console.log(`Entry: ${JSON.stringify(entry)}`);
  if (!entry) return null;

  // Seed noise on click for slight variation
  const noiseSeed = lat * 1000 + lon;
  const rainNoise = seededNoise(noiseSeed + 1);
  const tempNoise = seededNoise(noiseSeed + 2);
  const ndviNoise = seededNoise(noiseSeed + 3);
  const pestNoise = seededNoise(noiseSeed + 4);

  let health = 70;
  if (entry.NDVI !== null && entry.NDVI !== undefined) {
    const scaled = Math.max(0, Math.min(1, (entry.NDVI * ndviNoise + 1) / 2));
    health = Math.round(20 + scaled * 80);
  }

  const rain =
    entry.total_precipitation !== null && entry.total_precipitation !== undefined
      ? entry.total_precipitation * 1000 * rainNoise
      : undefined;
  const temp =
    entry.mean_2m_air_temperature !== null && entry.mean_2m_air_temperature !== undefined
      ? (entry.mean_2m_air_temperature - 273.15) * tempNoise
      : undefined;
  const ndvi = entry.NDVI !== null && entry.NDVI !== undefined ? entry.NDVI * ndviNoise : undefined;
  const cropSupport = entry.cropland !== null && entry.cropland !== undefined ? entry.cropland * pestNoise : undefined;
  const gridLabel = `(${gridLon},${gridLat})`;

  return {
    rainfall: [],
    ndvi,
    cropSupport,
    temp,
    rain,
    gridLabel,
    gridLat,
    gridLon,
    tempVsMoisture: [],
    health,
    alerts: [
      {
        id: 1,
        level: "info",
        title: "Grid Data",
        msg: `Closest grid: ${gridLabel} | Temp: ${temp !== undefined ? temp.toFixed(2) : "N/A"}°C | Rain: ${
          rain !== undefined ? rain.toFixed(2) : "N/A"
        } mm | NDVI: ${ndvi !== undefined ? ndvi.toFixed(3) : "N/A"} | Cropland: ${
          cropSupport !== undefined ? cropSupport.toFixed(2) : "N/A"
        }`,
      },
    ],
    aiTips: [
      "Tip: Data is based on closest grid point with slight random variation.",
      "Click nearby locations for slightly different results.",
    ],
    context: [],
  };
}

// ---------------------- Charts Panel ----------------------
function ChartsPanel({
  rainfall,
  ndvi,
  cropSupport,
  temp,
  rain,
  noData,
  gridLabel,
  gridLat,
  gridLon,
  dataset,
}) {
  // Aggregate area values around selected grid
  let barLabels = [];
  let rainVals = [];
  let tempVals = [];
  let soil0_10Vals = [];
  let soil10_40Vals = [];
  if (gridLat !== undefined && gridLon !== undefined && dataset) {
    const points = getAreaGridData(gridLat, gridLon, dataset);
    barLabels = points.map((p) => `(${p.gridLon},${p.gridLat})`);
    rainVals = points.map((p) =>
      p.total_precipitation !== null && p.total_precipitation !== undefined ? p.total_precipitation * 1000 : 0
    );
    tempVals = points.map((p) =>
      p.mean_2m_air_temperature !== null && p.mean_2m_air_temperature !== undefined
        ? p.mean_2m_air_temperature - 273.15
        : 0
    );
    soil0_10Vals = points.map((p) =>
      p.volumetric_soil_water_layer_1 !== null && p.volumetric_soil_water_layer_1 !== undefined
        ? p.volumetric_soil_water_layer_1
        : 0
    );
    soil10_40Vals = points.map((p) =>
      p.volumetric_soil_water_layer_2 !== null && p.volumetric_soil_water_layer_2 !== undefined
        ? p.volumetric_soil_water_layer_2
        : 0
    );
  }

  const barData = {
    labels: barLabels,
    datasets: [
      { label: "Rain (mm)", data: rainVals, backgroundColor: "rgba(54, 162, 235, 0.7)", borderRadius: 6 },
      { label: "Temperature (°C)", data: tempVals, backgroundColor: "rgba(255, 99, 132, 0.5)", borderRadius: 6 },
      { label: "Soil Moisture 0-10cm", data: soil0_10Vals, backgroundColor: "rgba(34,197,94,0.5)", borderRadius: 6 },
      { label: "Soil Moisture 10-40cm", data: soil10_40Vals, backgroundColor: "rgba(59,130,246,0.5)", borderRadius: 6 },
    ],
  };

  const showNDVI = ndvi !== undefined && ndvi !== null;
  const ndviPct = showNDVI ? Math.round((Math.max(-1, Math.min(1, ndvi)) + 1) * 50) : 0;
  const ndviColor = ndviPct > 60 ? "#22c55e" : ndviPct > 40 ? "#fbbf24" : "#ef4444";

  const showSupport = cropSupport !== undefined && cropSupport !== null;
  const supportPct = showSupport ? Math.round(Math.max(0, Math.min(1, cropSupport)) * 100) : 0;
  const supportColor = supportPct > 60 ? "#6366f1" : supportPct > 40 ? "#fbbf24" : "#a3e635";

  // Pie for NDVI healthy/unhealthy
  let healthy = 0,
    unhealthy = 0;
  if (showNDVI) {
    healthy = ndvi > 0 ? Math.round(ndvi * 100) : 0;
    unhealthy = ndvi <= 0 ? Math.round(Math.abs(ndvi) * 100) : 100 - healthy;
  }
  const pieDataNDVI = {
    labels: ["Healthy", "Unhealthy"],
    datasets: [{ data: showNDVI ? [healthy, unhealthy] : [], backgroundColor: ["#22c55e", "#ef4444"] }],
  };

  // Soil moisture pie for selected grid (just show a sample index if present)
  const showSoilPie = soil0_10Vals.length > 0 && soil10_40Vals.length > 0;
  const soilPieData = {
    labels: ["0-10cm", "10-40cm"],
    datasets: [
      { data: showSoilPie ? [soil0_10Vals[4] || 0, soil10_40Vals[4] || 0] : [], backgroundColor: ["#34d399", "#3b82f6"] },
    ],
  };

  // Scatter: Temp vs Rain for nearby area
  let scatterPoints = [];
  if (gridLat !== undefined && gridLon !== undefined && dataset) {
    const points = getAreaGridData(gridLat, gridLon, dataset);
    scatterPoints = points.map((p) => ({
      x:
        p.mean_2m_air_temperature !== null && p.mean_2m_air_temperature !== undefined
          ? p.mean_2m_air_temperature - 273.15
          : 0,
      y: p.total_precipitation !== null && p.total_precipitation !== undefined ? p.total_precipitation * 1000 : 0,
      label: `(${p.gridLon},${p.gridLat})`,
    }));
  }
  const scatterData = {
    datasets: [{ label: "Temp vs Rain (Area)", data: scatterPoints, backgroundColor: "#0ea5e9" }],
  };

  return (
    <div className="card mb-3" style={{ height: 420 }}>
      <div className="card-header pb-2">
        <ul className="nav nav-tabs card-header-tabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button className="nav-link active" id="bar-tab" data-bs-toggle="tab" data-bs-target="#bar" type="button" role="tab">
              Area: Rain, Temp, Soil Moisture
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="ndvi-tab" data-bs-toggle="tab" data-bs-target="#ndvi" type="button" role="tab">
              NDVI & Support
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="scatter-tab" data-bs-toggle="tab" data-bs-target="#scatter" type="button" role="tab">
              Area: Temp vs Rain
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="soil-tab" data-bs-toggle="tab" data-bs-target="#soil" type="button" role="tab">
              Soil Moisture (Selected)
            </button>
          </li>
        </ul>
      </div>
      <div className="card-body tab-content" style={{ height: 340, overflowY: "auto", overflowX: "hidden" }}>
        {noData && <div className="alert alert-warning text-center">No data found for this location. Try another point.</div>}

        <div className="tab-pane fade show active" id="bar" role="tabpanel">
          <div style={{ height: 220, width: "100%", maxWidth: 500, margin: "0 auto" }}>
            <Bar
              data={barData}
              options={{
                responsive: true,
                plugins: { legend: { display: true } },
                scales: { x: { title: { display: true, text: "Grid" } }, y: { title: { display: true, text: "Value" } } },
              }}
            />
            <div className="text-center small mt-2 text-muted">Rainfall, temperature, and soil moisture for the area.</div>
          </div>
        </div>

        <div className="tab-pane fade" id="ndvi" role="tabpanel">
          <div className="d-flex flex-column gap-4 align-items-center justify-content-center" style={{ height: 220 }}>
            {showNDVI && (
              <div style={{ width: 220 }}>
                <div className="mb-1 text-center small text-muted">Vegetation Health (NDVI)</div>
                <div className="progress" style={{ height: "22px", background: "#eee" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${ndviPct}%`,
                      backgroundColor: ndviColor,
                      color: "#222",
                      fontWeight: 500,
                      fontSize: "1rem",
                    }}
                    aria-valuenow={ndviPct}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {ndviPct}%
                  </div>
                </div>
                <div className="text-center small mt-1 text-muted">NDVI value: {ndvi?.toFixed(3)}</div>
              </div>
            )}
            {showSupport && (
              <div style={{ width: 220 }}>
                <div className="mb-1 text-center small text-muted">Crop Support</div>
                <div className="progress" style={{ height: "22px", background: "#eee" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${supportPct}%`,
                      backgroundColor: supportColor,
                      color: "#222",
                      fontWeight: 500,
                      fontSize: "1rem",
                    }}
                    aria-valuenow={supportPct}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {supportPct}%
                  </div>
                </div>
                <div className="text-center small mt-1 text-muted">Support value: {cropSupport?.toFixed(2)}</div>
              </div>
            )}
            {!showNDVI && !showSupport && <div className="text-muted text-center small">No NDVI or support data for this grid.</div>}
          </div>
        </div>

        <div className="tab-pane fade" id="scatter" role="tabpanel">
          <div style={{ height: 220, width: "100%", maxWidth: 500, margin: "0 auto" }}>
            <Scatter
              data={scatterData}
              options={{
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const d = context.raw;
                        return `${d.label}: Temp ${d.x.toFixed(2)}°C, Rain ${d.y.toFixed(2)}mm`;
                      },
                    },
                  },
                },
                scales: {
                  x: { title: { display: true, text: "Temperature (°C)" } },
                  y: { title: { display: true, text: "Rain (mm)" } },
                },
              }}
            />
            <div className="text-center small mt-2 text-muted">Temperature vs Rainfall for the area.</div>
          </div>
        </div>

        <div className="tab-pane fade" id="soil" role="tabpanel">
          <div style={{ height: 220, width: "100%", maxWidth: 300, margin: "0 auto" }}>
            <Pie data={soilPieData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
            <div className="text-center small mt-2 text-muted">Soil moisture (volumetric): 0–10cm vs 10–40cm.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------- Context input & AI ----------------------
function ContextInputPanel({ context, setContext }) {
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

function SuggestionsPanel({ tips = [], onGenerate }) {
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

function AlertsPanel({ items = [] }) {
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

// ---------------------- Main component ----------------------
export default function AgriDashboard() {
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState({});
  const [banner, setBanner] = useState(null);
  const [context, setContext] = useState("");
  const [dataset, setDataset] = useState(null);
  const [noData, setNoData] = useState(false);
  const [aiTips, setAiTips] = useState([]);

  // Load dataset (test.json in public/dataset/test.json)
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("dataset/test.json");
        const json = await res.json();
        setDataset(json);
      } catch {
        setDataset(null);
      }
    }
    fetchData();
  }, []);

  // Update data on map pick
  useEffect(() => {
    if (selected && dataset) {
      console.log("Calling getDataForLocation");
      const d = getDataForLocation(selected.lat, selected.lng, dataset);
      console.log(`d: ${JSON.stringify(d)}`);
      if (d) {
        setData(d);
        setBanner(d.alerts[0] || null);
        setNoData(false);
      } else {
        setData({});
        setBanner(null);
        setNoData(true);
      }
    } else {
      setData({});
      setBanner(null);
      setNoData(false);
    }

    if ((pos.x > 400 && pos.x < 500) && (pos.y > 20 && pos.y < 30)) {
      setPos({ x: 450, y: 42 });
    }

  }, [selected, dataset]);

  // Helper to get area data for suggestions
  function getAreaDataForSuggestions(gridLat, gridLon, dataset) {
    if (!gridLat || !gridLon || !dataset) return [];
    const points = getAreaGridData(gridLat, gridLon, dataset);
    // Only include relevant fields for prompt brevity
    return points.map(p => ({
      gridLat: p.gridLat,
      gridLon: p.gridLon,
      NDVI: p.NDVI,
      rain: p.total_precipitation,
      temp: p.mean_2m_air_temperature,
      soil_moisture_1: p.volumetric_soil_water_layer_1,
      soil_moisture_2: p.volumetric_soil_water_layer_2,
      cropland: p.cropland,
      landcover: p.landcover
    }));
  }

  /*
  // Auto-fetch AI tips when context + grid data available
  useEffect(() => {
    async function getTips() {
      if (context && data && Object.keys(data).length > 0 && dataset) {
        setAiTips(["Loading..."]);
        const areaData = getAreaDataForSuggestions(data.gridLat, data.gridLon, dataset);
        console.log("In AgriDashboard:");
        console.log(`Context: ${context}`);
        console.log(`data: ${data}`);
        console.log(`areaData: ${context}`);
        const tips = await fetchChatGPTResponse(context, data, areaData);
        setAiTips(tips);
      } else {
        setAiTips([]);
      }
    }
    getTips();
  }, [context, data, dataset]);
  */

  // The tips generator
  const handleGenerate = async () => {
    if (data?.gridLat == null || data?.gridLon == null || !dataset) {
    setAiTips([]);
    return;
  }
    setAiTips(["Loading..."]);
    const areaData = getAreaDataForSuggestions(data.gridLat, data.gridLon, dataset);
    const tips = await fetchChatGPTResponse(context, data, areaData);
    setAiTips(tips);
  };``

  return (
    <div className="bg-light min-vh-100 position-relative" style={{ width: "100vw", minHeight: "100vh", overflowX: "hidden" }}>
      <AlertBanner alert={banner} onDismiss={() => setBanner(null)} />
      <HealthBar value={data.health || 0} />

      {/* Header */}
      <header className="d-flex align-items-center gap-3 px-4 py-4" style={{ width: "100vw" }}>
        <div className="rounded bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36 }}>
          AG
        </div>
        <div>
          <h1 className="h5 fw-semibold mb-1">AIgriculture</h1>
          <p className="small text-muted mb-0">Data-driven insights for every paddock</p>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          {selected && (
            <span className="badge bg-white border text-dark">
              Picked: {selected.lat?.toFixed(4)}, {selected.lng?.toFixed(4)}
            </span>
          )}
        </div>
      </header>

      {/* Main grid */}
      <main className="pb-5 px-4" style={{ width: "100vw" }}>
        <div className="row g-4">
          {/* Map (col 1-6) */}
          <div className="col-12 col-lg-6">
            <NZMapPanel onPick={setSelected} />
          </div>

          {/* Middle stack (charts + context) */}
          <div className="col-12 col-md-7 col-lg-4 d-flex flex-column gap-4">
            <ChartsPanel
              rainfall={data.rainfall}
              ndvi={data.ndvi}
              cropSupport={data.cropSupport}
              temp={data.temp}
              rain={data.rain}
              gridLabel={data.gridLabel}
              gridLat={data.gridLat}
              gridLon={data.gridLon}
              dataset={dataset}
              noData={noData}
            />
            <ContextInputPanel context={context} setContext={setContext} />
          </div>

          {/* Right stack (suggestions + alerts) */}
          <div className="col-12 col-lg-2 d-flex flex-column gap-4">
            <SuggestionsPanel tips={aiTips} onGenerate={handleGenerate} />
            <AlertsPanel items={data.alerts || []} />
          </div>
        </div>
      </main>
    </div>
  );
}

