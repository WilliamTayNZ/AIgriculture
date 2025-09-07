# pyright:basic

from json import dump
import ssl
import ee
import multiprocessing
from functools import partial

# Boilerplate to handle SSL certificate issues
ssl._create_default_https_context = ssl._create_stdlib_context

# --- Authenticate and Initialize the Earth Engine API ---
print("Step 1: Authenticating and Initializing Earth Engine...")
ee.Authenticate()
ee.Initialize(project="THE-PROJECT-ID")
print("Earth Engine initialized successfully.")

# --- Dataset Configuration ---
dataset_names = {
    "Temp": "ECMWF/ERA5/DAILY",
    "Rain": "ECMWF/ERA5/DAILY",
    "DrainedSoil": "FAO/GHG/1/DROSA_A",
    "NDVI": "MODIS/MOD09GA_006_NDVI",
    "Crop&GlobalSupport": "USGS/GFSAD1000_V1",
    "SoilMoisture0to10cm": "NASA/GLDAS/V20/NOAH/G025/T3H",
    "SoilMoisture10to40cm": "NASA/GLDAS/V20/NOAH/G025/T3H",
    "SoilTemp0to10cm": "NASA/GLDAS/V20/NOAH/G025/T3H",
    "SoilTemp10to40cm": "NASA/GLDAS/V20/NOAH/G025/T3H",
    "Transpiration": "NASA/GLDAS/V20/NOAH/G025/T3H",
    "SoilWaterVol0to7cm": "ECMWF/ERA5_LAND/DAILY_AGGR",
    "SoilWaterVol7to28cm": "ECMWF/ERA5_LAND/DAILY_AGGR",
}

bands = [
    "mean_2m_air_temperature",
    "total_precipitation",
    "cropland",
    "NDVI",
    "landcover",
    "SoilMoi0_10cm_inst",
    "SoilMoi10_40cm_inst",
    "SoilTMP0_10cm_inst",
    "SoilTMP10_40cm_inst",
    "Tveg_tavg",
    "volumetric_soil_water_layer_1",
    "volumetric_soil_water_layer_2",
]


def retrieve_ee_data(key):
    """
    Retrieves an EE asset and ensures it is returned as an ImageCollection.
    """
    asset_id = dataset_names[key]
    if key in ["Crop&GlobalSupport"]:
        image = ee.Image(asset_id)
        return ee.ImageCollection(image)
    else:
        return ee.ImageCollection(asset_id)


def retrieve_datasets():
    """
    Retrieves and prepares all datasets by selecting the appropriate band for each.
    Returns a dictionary of prepared ee.ImageCollection objects.
    """
    datasets = {key: retrieve_ee_data(key) for key in dataset_names.keys()}
    for key, band in zip(datasets.keys(), bands):
        datasets[key] = datasets[key].select(band)
    return datasets


def worker_fetch_data_efficient(coords_chunk, datasets):
    """
    Processes a chunk of coordinates, builds a single EE computation,
    and returns the results.
    """
    print(f"Worker processing a chunk of {len(coords_chunk)} coordinates...")

    # 2. Convert coordinates into an EE FeatureCollection.
    points_collection = ee.FeatureCollection(
        [ee.Geometry.Point(lon, lat) for lon, lat in coords_chunk]
    )
    print("   ...Converted coordinates to EE FeatureCollection.")

    # 3. Create a single, merged EE Image with all required bands.
    merged_image = None
    for key, image_collection in datasets.items():
        latest_image = image_collection.sort("system:time_start", False).first()
        if merged_image is None:
            merged_image = latest_image
        else:
            merged_image = merged_image.addBands(latest_image)
    print("   ...Built a single, merged image with all bands.")

    # 4. Use reduceRegions to get all data for all points in one server-side request.
    print("   ...Sending a single reduceRegions request to Earth Engine...")
    reduced_data = merged_image.reduceRegions(
        collection=points_collection, reducer=ee.Reducer.first(), scale=30
    )

    # 5. Fetch all the results from the server in one go. This is the only getInfo() call.
    all_data = reduced_data.getInfo()
    print("   ...Received data from Earth Engine.")

    # 6. Parse the results and return them to the main process.
    results_dict = {}
    for feature in all_data["features"]:
        coords = feature["geometry"]["coordinates"]
        lon, lat = coords
        data = feature["properties"]
        results_dict[f"{lon},{lat}"] = data
    print(f"Worker finished processing and is returning {len(results_dict)} results.")
    return results_dict


# --- NEW MULTIPROCESSING FUNCTION ---
def get_location_data_blocks_efficient(block_sizes, all_datasets):
    """
    Divides the globe into a grid and fetches data for each block concurrently
    using an efficient, single-request-per-worker strategy.
    """
    lat_step, lon_step = block_sizes

    # Generate a list of all top-left coordinates to process
    lat_coords = [lat for lat in range(-90, 90, lat_step)]
    lon_coords = [lon for lon in range(-180, 180, lon_step)]
    coords_to_process = [[lon, lat] for lat in lat_coords for lon in lon_coords]

    print(f"Step 2: Generated {len(coords_to_process)} coordinates to process.")
    print(f"Using a block size of {lat_step}° latitude by {lon_step}° longitude.")

    cpu_count = multiprocessing.cpu_count()
    print(f"Starting multiprocessing pool with {cpu_count} workers...")

    # We use chunks to distribute the workload evenly among workers
    chunk_size = len(coords_to_process) // cpu_count + 1
    chunks = [
        coords_to_process[i : i + chunk_size]
        for i in range(0, len(coords_to_process), chunk_size)
    ]
    print(f"Dividing coordinates into {len(chunks)} chunks for parallel processing.")

    task_func = partial(worker_fetch_data_efficient, datasets=all_datasets)

    with multiprocessing.Pool(processes=cpu_count) as pool:
        results = pool.map(task_func, chunks)

    print("Step 3: All tasks completed. Compiling final dictionary...")
    final_dict = {}
    for result_chunk in results:
        final_dict.update(result_chunk)

    final_dict.update({"lat_step": lat_step, "lon_step": lon_step})
    return final_dict


if __name__ == "__main__":
    print("\n--- Starting Data Retrieval Process ---")
    print("Step 1.1: Initializing Earth Engine and retrieving dataset schemas...")
    datasets = retrieve_datasets()
    print("Dataset schemas retrieved and prepared.")

    block_definition = [20, 30]
    lat_step, lon_step = block_definition
    lat_coords = [lat for lat in range(-90, 90, lat_step)]
    lon_coords = [lon for lon in range(-180, 180, lon_step)]
    coords_to_process = [[lon, lat] for lat in lat_coords for lon in lon_coords]

    print(f"Step 2: Generated {len(coords_to_process)} coordinates to process.")
    print(f"Using a block size of {lat_step}° latitude by {lon_step}° longitude.")
    print("Step 3: Consolidating all coordinates into a single request for efficiency.")

    # Pass all coordinates as a single "chunk"
    final_data = worker_fetch_data_efficient(coords_to_process, datasets)

    print("\n--- Processing Complete ---")
    print(f"Successfully retrieved data for {len(final_data)} blocks.")

    # Add metadata to the final dictionary
    final_data.update({"lat_step": lat_step, "lon_step": lon_step})

    print("Saving results to test.json...")
    with open("test.json", "w") as file:
        dump(final_data, file, indent=4)
    print("Results saved.")
