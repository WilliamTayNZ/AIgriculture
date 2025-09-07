import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { fetchChatGPTResponse } from "../services/api.js";
import "../utils/chartSetup";
import { getAreaGridData, getDataForLocation } from "../utils/dataHelpers";
import {
  HealthBar,
  AlertBanner,
  MapPanel,
  ChartsPanel,
  ContextInputPanel,
  SuggestionsPanel,
  AlertsPanel,
} from "../components";

import "./AgriDashboard.css";

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

  // HealthBar position
  const [hbPos, setHbPos] = useState({ x: 450, y: 20 });

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

  }, [selected, dataset, hbPos]);

  // Ensures HealthBar does not block Alert banner when it first appears
  useEffect(() => {
  if (!selected) return; // only when it flips to truthy
  setHbPos(pos => {
    const inZone = pos.x > 0 && pos.x < 770 && pos.y > -100 && pos.y < 82;
    return inZone ? { ...pos, y: 82 } : pos;
  });
}, [selected]); // ← no hbPos here

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
  };

  return (
    <div className="bg-light min-vh-100 position-relative" style={{ width: "100vw", minHeight: "100vh", overflowX: "hidden" }}>
      <AlertBanner alert={banner} onDismiss={() => setBanner(null)} />
      <HealthBar value={data.health || 0 } hbPos={hbPos} setHbPos={setHbPos} />

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
            <MapPanel onPick={setSelected} />
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

