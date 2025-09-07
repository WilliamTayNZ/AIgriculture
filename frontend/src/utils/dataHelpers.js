// ---------------------- Data helpers ----------------------
export function seededNoise(seed, pct = 0.12) {
  let s = Math.abs(Math.floor(seed * 100000));
  s = (s * 9301 + 49297) % 233280;
  const r = s / 233280;
  return 1 + (r * 2 - 1) * pct; // [1-pct, 1+pct]
}

export function getClosestGrid(lat, lon, dataset) {
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

export function getAreaGridData(gridLat, gridLon, dataset) {
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

export function getDataForLocation(lat, lon, dataset) {
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
        msg: `Closest grid: ${`(${gridLat},${gridLon})`} | Temp: ${temp !== undefined ? temp.toFixed(2) : "N/A"}°C | Rain: ${
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