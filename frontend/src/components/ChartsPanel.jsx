import { Bar, Pie, Scatter } from "react-chartjs-2";
import "../utils/chartSetup"; // ensure ChartJS is registered
import { getAreaGridData } from "../utils/dataHelpers";


export default function ChartsPanel({
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
    barLabels = points.map((p) => `(${p.gridLat},${p.gridLon})`);
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
  const ndviLevel = ndviPct > 60 ? "high" : ndviPct > 40 ? "mid" : "low";

  const showSupport = cropSupport !== undefined && cropSupport !== null;
  const supportPct = showSupport ? Math.round(Math.max(0, Math.min(1, cropSupport)) * 100) : 0;
  const supportLevel = supportPct > 60 ? "high" : supportPct > 40 ? "mid" : "low";

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
    <div className="card mb-3 charts-card">
      <div className="card-header pb-2">
        <ul className="nav nav-tabs card-header-tabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button className="nav-link active" id="bar-tab" data-bs-toggle="tab" data-bs-target="#bar" type="button" role="tab">
             Rain, Temp, Soil Moisture <b>(Area)</b>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="ndvi-tab" data-bs-toggle="tab" data-bs-target="#ndvi" type="button" role="tab">
              NDVI & Crop Support
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="scatter-tab" data-bs-toggle="tab" data-bs-target="#scatter" type="button" role="tab">
              Temp vs Rain <b>(Area)</b>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="soil-tab" data-bs-toggle="tab" data-bs-target="#soil" type="button" role="tab">
              Soil Moisture
            </button>
          </li>
        </ul>
      </div>
      <div className="card-body tab-content charts-tabcontent">
        {noData && <div className="alert alert-warning text-center">No data found for this location. Try another point.</div>}

        <div className="tab-pane fade show active" id="bar" role="tabpanel">
          <div className="chart-box">
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
          <div className="d-flex flex-column gap-4 align-items-center justify-content-center ndvi-support-wrap">
            {showNDVI && (
              <div className="metric-box">
                <div className="mb-1 text-center small text-muted">Vegetation Health (NDVI)</div>
                <div className="progress metric-progress">
                  <div
                    className={`progress-bar metric-bar ndvi-${ndviLevel}`}
                    role="progressbar"
                    style={{ width: `${ndviPct}%` }}
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
              <div className="metric-box">
                <div className="mb-1 text-center small text-muted">Crop Support</div>
                <div className="progress metric-progress">
                  <div
                    className={`progress-bar metric-bar support-${supportLevel}`}
                    role="progressbar"
                    style={{ width: `${supportPct}%` }}
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
            {!showNDVI && !showSupport && <div className="text-muted text-center small">No NDVI or crop support data for this location.</div>}
          </div>
        </div>

        <div className="tab-pane fade" id="scatter" role="tabpanel">
          <div className="chart-box">
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
          <div className="chart-box soil-chart-box">
            <Pie data={soilPieData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
            <div className="text-center small mt-2 text-muted">Soil moisture (volumetric): 0–10cm vs 10–40cm.</div>
          </div>
        </div>
      </div>
    </div>
  );
}