import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import numpy as np

def get_copernicus_ssta_cmap():
    # Colors sampled from the provided ESOTC 2023 image scale
    # -2, -1.5, -1, -0.7, -0.5, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 1.5, 2
    colors = [
        '#08306b', # -2
        '#08519c', # -1.5
        '#2171b5', # -1
        '#4292c6', # -0.7
        '#6baed6', # -0.5
        '#9ecae1', # -0.3
        '#c6dbef', # -0.2
        '#deebf7', # -0.1
        '#ffffff', # 0
        '#fee0d2', # 0.1
        '#fcbba1', # 0.2
        '#fc9272', # 0.3
        '#fb6a4a', # 0.5
        '#ef3b2c', # 0.7
        '#cb181d', # 1
        '#a50f15', # 1.5
        '#67000d'  # 2
    ]
    return mcolors.LinearSegmentedColormap.from_list('copernicus_ssta', colors)

# Test plot
data = np.linspace(-2.5, 2.5, 100).reshape(10, 10)
cmap = get_copernicus_ssta_cmap()

plt.figure(figsize=(6, 4))
plt.imshow(data, cmap=cmap, vmin=-2, vmax=2)
plt.colorbar(label='Anomaly (°C)')
plt.title('Copernicus Style SSTA Scale')
plt.savefig('test_ssta_palette.png')
plt.close()
print("Palette test saved to test_ssta_palette.png")
