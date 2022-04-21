from part2_algo_2 import algo_2, assign_centroid_to_each_point
from shapely.strtree import STRtree
import pickle as pk
import matplotlib.pyplot as plt
import shapely
import geopandas as gpd
import fiona
import requests
import pandas as pd
import folium
import numpy as np
import sys
import os
import json
module_path = os.path.abspath(os.path.join('../..'))
if module_path not in sys.path:
    sys.path.append(module_path)
maxRadius = 5

merged_df_od_duration = pd.read_csv(
    'backend/app/static/merged_df_od_duration_1.0.csv')
merged_area = gpd.read_file(
    'backend/app/static/merged_area_threshold_1.0.geojson').set_crs(epsg=4326)
area_centroid = pd.DataFrame(
    [list(x.coords)[0] for x in merged_area.centroid], columns=['LONGITUDE', 'LATITUDE'])
grille = algo_2(area_centroid[['LATITUDE', 'LONGITUDE']].to_numpy(
), maxRadius, redistribute_point=False)
centroids = grille.getAllCentroids()
with open("backend/app/static/overview_centroids.json", "w") as f:
    json.dump(centroids.tolist(), f)

# centroid = area_centroid.mean()
# area_centroid = assign_centroid_to_each_point(area_centroid, centroids)
# merged_area['class_center'] = area_centroid.CENTROID_NUMBER.values
# area_to_center = dict(
#     zip(merged_area['traj_key'], merged_area['class_center']))
# merged_df_od_duration['previous_center'] = merged_df_od_duration['previous_blocks'].apply(
#     lambda x: area_to_center[x])
# merged_df_od_duration['next_hop_center'] = merged_df_od_duration['next_hop_blocks'].apply(
#     lambda x: area_to_center[x])
# with fiona.Env(OSR_WKT_FORMAT="WKT2_2018"):
#     with fiona.drivers():
#         merged_area.to_file(
#             'backend/app/static/merged_area_threshold_1.0_clustering.geojson', driver="GeoJSON")
# merged_df_od_duration.to_csv(
#     'backend/app/static/merged_area_nyc_threshold_1.0_corresponding_trajectory_clustering.csv', index=None)
