'''
# Utils to speed up LLM processing 
# Not used as it damages the quality of AI suggestions

from statistics import mean
from typing import Iterable, Mapping, Any

# Allow both schemas
SUMMARY_SOURCES = {
    "NDVI": ["NDVI"],
    "total_precipitation": ["total_precipitation", "rain"],             # m/day OR mm
    "mean_2m_air_temperature": ["mean_2m_air_temperature", "temp"],     # K OR °C
    "volumetric_soil_water_layer_1": ["volumetric_soil_water_layer_1", "soil_moisture_1"],
    "volumetric_soil_water_layer_2": ["volumetric_soil_water_layer_2", "soil_moisture_2"],
    "cropland": ["cropland"],
}

def _first_present_num(d: Mapping[str, Any], keys: list[str]) -> float | None:
    for k in keys:
        v = d.get(k)
        if isinstance(v, (int, float)):
            return float(v)
    return None

def summarize_area_list(area_list: Iterable[Mapping[str, Any]]) -> dict:
    cells = [c for c in area_list if isinstance(c, dict)]
    out = {"n_cells": len(cells), "metrics": {}}
    if not cells:
        return out

    for canonical, choices in SUMMARY_SOURCES.items():
        vals: list[float] = []
        for c in cells:
            v = _first_present_num(c, choices)
            if v is None:
                continue
            # Normalise units to canonical where needed:
            if canonical == "mean_2m_air_temperature" and "temp" in choices and "temp" in c:
                # value is °C; convert to K so stats are comparable
                v = v + 273.15
            if canonical == "total_precipitation" and "rain" in choices and "rain" in c:
                # value is mm; convert to meters/day to match ERA5 canonical
                v = v / 1000.0
            vals.append(v)

        if vals:
            out["metrics"][canonical] = {
                "mean": float(mean(vals)),
                "min": float(min(vals)),
                "max": float(max(vals)),
                "count": len(vals),
            }
    return out


# Shrinks gridData so GPT can process faster
def compact_grid(grid: dict) -> dict:
    """Accepts either ERA5-like keys or your derived keys and normalises to compact form."""
    def fnum(v):
        return None if v is None else (float(v) if isinstance(v, (int, float)) else None)

    # Temperature: prefer already-in-°C 'temp', else convert from Kelvin
    temp_c = fnum(grid.get("temp"))
    if temp_c is None:
        K = fnum(grid.get("mean_2m_air_temperature"))
        if K is not None:
            temp_c = K - 273.15

    # Precip: prefer already-in-mm 'rain', else convert from meters/day
    precip_mm = fnum(grid.get("rain"))
    if precip_mm is None:
        m_per_day = fnum(grid.get("total_precipitation"))
        if m_per_day is not None:
            precip_mm = m_per_day * 1000.0

    # Soil moisture: accept either volumetric_* or soil_moisture_*
    w1 = fnum(grid.get("volumetric_soil_water_layer_1"))
    if w1 is None:
        w1 = fnum(grid.get("soil_moisture_1"))
    w2 = fnum(grid.get("volumetric_soil_water_layer_2"))
    if w2 is None:
        w2 = fnum(grid.get("soil_moisture_2"))

    # Cropland fraction (0..1) or already % somewhere else
    cropland = fnum(grid.get("cropland"))

    return {
        "NDVI": fnum(grid.get("NDVI")),
        "temp_C": None if temp_c is None else round(temp_c, 2),
        "precip_mm_day": None if precip_mm is None else round(precip_mm, 2),
        "soil_w1_pct": None if w1 is None else round(w1 * 100.0, 1),
        "soil_w2_pct": None if w2 is None else round(w2 * 100.0, 1),
        "cropland_pct": None if cropland is None else round(cropland * 100.0, 1),
        "landcover": grid.get("landcover"),
    }

'''