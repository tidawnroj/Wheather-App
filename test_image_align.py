import xarray as xr
from PIL import Image

print("Loading Data...")
# We can't easily see the image, but we can check if it was flipped.
try:
    img = Image.open('tmd-weather-app/public/copernicus_live_heatmap.png')
    print("Image size:", img.size)
except Exception as e:
    print("Error:", e)

