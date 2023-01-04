import json
from operator import index
from importlib_metadata import entry_points
import requests
import pandas as pd
from shapely.ops import cascaded_union
from descartes import PolygonPatch
import pickle as pk
import alphashape
import numpy as np
import shapely
from shapely.geometry import Point
from shapely.ops import unary_union
from shapely.strtree import STRtree
from tqdm import tqdm
import rtree
import geopandas as gpd
import osmnx as ox
# import contextily as cx
import matplotlib.pyplot as plt
import scipy
import warnings
from tkinter import _flatten
warnings.filterwarnings('ignore')


def Self_Organization(start_time, end_time, entropy_threshold, dateType):

    def matching_point_to_region(df, lng, lat, ST_tree):
        blocks = {}
        for i, (x, y) in enumerate(tqdm(zip(df[lng], df[lat]), total=df.shape[0])):
            pt = Point(x, y)
            query_list = ST_tree.query(pt.buffer(0.0001))
            if len(query_list) > 0:
                tmp_tree = STRtree(query_list)
                loc = tmp_tree.nearest(pt)
                blocks[i] = index_by_id[id(loc)]
            else:
                blocks[i] = index_by_id[id(ST_tree.nearest(pt))]
        return blocks

    def haversine_np(x, y):
        """
        Calculate the great circle distance between two points
        on the earth (specified in decimal degrees)

        All args must be of equal length.

        """
        lon1, lat1, lon2, lat2 = x[0], x[1], y[0], y[1]
        lon1, lat1, lon2, lat2 = map(np.radians, [lon1, lat1, lon2, lat2])

        dlon = lon2 - lon1
        dlat = lat2 - lat1

        a = np.sin(dlat / 2.0) ** 2 + np.cos(lat1) * \
            np.cos(lat2) * np.sin(dlon / 2.0) ** 2

        c = 2 * np.arcsin(np.sqrt(a))
        km = 6367 * c
        return km

    def neast_blocks(x):
        if x['category'] == -1:
            query_list = ST_tree.query(x['geometry'].buffer(0.001))
            #         idx=np.argsort([x['geometry'].buffer(0.001).intersection(y).area for y in query_list])[::-1]
            #         query_idx=[index_by_id[id(x)]for x in query_list]
            #         for i in np.array(query_idx)[idx]:
            #             if area1.iloc[i]['class']!=-1:
            #                 return area1.iloc[i]['class']
            query_idx = [index_by_id[id(x)] for x in query_list]
            class_list = [area1.iloc[i]['category']
                          for i in query_idx if area1.iloc[i]['category'] != -1]
            if len(class_list) != 0:
                return pd.DataFrame(class_list).value_counts().index[0][0]
            for i in np.argsort(scipy.spatial.distance.cdist(np.array(list(x['centroid'].coords)), centroid_np)[0]):
                if area1.iloc[i]['category'] != -1:
                    return area1.iloc[i]['category']
            print('False')
        else:
            return x['category']

    def search_union(aggregate_node, node, new_visit, deepth=0):
        #     if deepth<dynamic_deep[node]:
        new_visit.add(node)
        union = [aggregate_node[node]]
        # print(union)
        for i in aggregate_node[node]:
            # print(new_visit)
            if i not in new_visit:
                res = search_union(aggregate_node, i, new_visit, deepth + 1)
                if res:
                    union += res
        return union

    # G=ox.load_graphml('network_graph.hml')
    # gdf_nodes,gdf_edges=ox.graph_to_gdfs(G)
    # gdf_edges=gdf_edges.reset_index()
    # gdf_nodes=gdf_nodes.reset_index()
    # gdf_edges=gdf_edges[~gdf_edges.highway.isin(['primary'])]
    # total_decomposition=[]
    # for x in tqdm(['Manhattan','Bronx','Queens','Brooklyn']):
    #     boundary=ox.geocode_to_gdf(x).geometry
    #     Boundarys_tree=STRtree(boundary)
    #     sub_gdf_edges=gdf_edges[gdf_edges.geometry.intersects(boundary.unary_union)]
    #     lines = list(sub_gdf_edges['geometry'])#+list(ox.geocode_to_gdf('manhattan').boundary[0])
    #     merged_lines = shapely.ops.linemerge(lines)
    #     border_lines = shapely.ops.unary_union(merged_lines)
    #     decomposition = shapely.ops.polygonize_full(border_lines)
    #     total_decomposition.extend(list(decomposition[0]))
    #area = gpd.GeoDataFrame({'geometry':total_decomposition})
    area = gpd.read_file('app/static/area.shp')
    area1 = area.buffer(-0.00015)
    area1 = area1[-area1.is_empty]
    area1 = gpd.GeoDataFrame({'geometry': area1})
    area1.index = np.arange(len(area1))
    area1['centroid'] = area1.centroid
    neighbors = pk.load(open('app/static/large_nyc_neighbors.pk', 'rb'))
    df_filter = pd.read_csv('app/static/Large_NYC_high_order.csv')
    df_filter.Time = pd.to_datetime(df_filter.Time)
    df_stop = df_filter[['Latitude', 'Longitude',
                         'pre_level_0_category', 'Time', 'User', 'venue_id']]
    df_stop.columns = ['LATITUDE', 'LONGITUDE',
                       'category', 'checkin_time', 'user', 'venue_id']
    df_stop = df_stop[(df_stop.checkin_time.dt.hour >= start_time) & (
        df_stop.checkin_time.dt.hour <= end_time)]
    index_by_id = dict((id(pt), i) for i, pt in enumerate(area1.geometry))
    id_by_index = dict((i, id(pt)) for i, pt in enumerate(area1.geometry))
    ST_tree = STRtree(area1.geometry)
    blocks = matching_point_to_region(
        df_stop, 'LONGITUDE', 'LATITUDE', ST_tree)
    df_stop['blocks'] = blocks.values()

    if(dateType == 'Weekdays'):
        df_od_duration = pd.read_csv(
            'app/static/df_od_duration_large_nyc_weekdays.csv')
        print('Here is weekdays!')
    else:
        df_od_duration = pd.read_csv(
            'app/static/df_od_duration_large_nyc_holidays.csv')
        print('Here is holidays!')

    # Set the scales array according to the entropy threshold
    if entropy_threshold == 2.5:
        scales = [2.5]
    elif entropy_threshold == 2.2:
        scales = [2.5, 2.2]
    elif entropy_threshold == 1.9:
        scales = [2.5, 2.2, 1.9]
    else:
        scales = [2.5, 2.2, 1.9, 1.6]

    # Match each point to the corresponding region
    blocks = matching_point_to_region(
        df_od_duration, 'longitude', 'latitude', ST_tree)
    df_od_duration['previous_blocks'] = blocks.values()
    blocks = matching_point_to_region(
        df_od_duration, 'next_hop_longitude', 'next_hop_latitude', ST_tree)
    df_od_duration['next_hop_blocks'] = blocks.values()
    venue_to_category = dict(
        zip(df_filter['venue_id'], df_filter['pre_level_0_category']))
    df_od_duration['previous_category'] = df_od_duration.venue_id.apply(
        lambda x: venue_to_category[x])
    df_od_duration['next_hop_category'] = df_od_duration.next_hop_venue_id.apply(
        lambda x: venue_to_category[x])

    #  Calculate and count entropy information
    entropy = {}
    for _, tdf in df_stop.groupby('blocks'):
        counts = tdf.category.value_counts().values
        counts = counts/counts.sum()
        entropy[_] = (-counts*np.log(counts)).sum()
    for i in range(area1.shape[0]):
        if i not in entropy.keys():
            entropy[i] = max(list(entropy.values()))
    area1['entropy'] = [entropy[x] for x in sorted(entropy)]

    # Calculate and count category information
    category = []
    for _, cdf in tqdm(area1.iterrows(), total=area1.shape[0]):
        tdf = df_stop[df_stop.blocks.isin([_])]
        if len(tdf) > 0:
            category.append(tdf.category.value_counts().index[0])
        else:
            category.append(-1)

    # Reset index and recode
    area1['category'] = category
    centroid_np = np.array([list(x.centroid.coords)
                           for x in area1.centroid]).reshape(-1, 2)
    tqdm.pandas()
    area1['category'] = area1.reset_index().progress_apply(
        lambda x: neast_blocks(x), axis=1)
    dynamic_deep = dict(zip(np.argsort(area1.geometry.area.values)[
                        ::-1].tolist(), np.linspace(3, 9, len(area1))))

    # Function for depth-first search
    def dfs(visited, graph, node, deepth=0, pre=-1, factor=1):
        if node not in visited:
            if deepth < dynamic_deep[node]:
                if pre != -1:
                    tdf = df_copy[df_copy.blocks.isin([node, pre])]
                    counts = tdf.category.value_counts().values
                    counts = counts/counts.sum()
                    entropy_values = (-counts*np.log(counts)).sum()
                    if entropy_values*factor < entropy[node]+entropy[pre]:
                        df_copy.blocks = df_copy.blocks.replace(
                            [node, pre], node)
                        graph[node] = list(set(graph[pre]+graph[node]))
                        visited.add(node)
                        aggregate_node[pre] += [node]
                        for neighbour in graph[node]:
                            dfs(visited, graph, neighbour,
                                deepth+1, node, factor)
                else:
                    for neighbour in graph[node]:
                        dfs(visited, graph, neighbour, deepth+1, node, factor)

    def search_union(aggregate_node, node, new_visit, visited, deepth=0):
        if node not in visited:
            union = [node]
            new_visit.add(node)

            for i in aggregate_node[node]:
                if (i not in new_visit) and (i not in visited):
                    res = search_union(aggregate_node, i,
                                       new_visit, visited, deepth+1)
                    if res:
                        union += res
            return union
        else:
            return None

    df_stop.index = np.arange((len(df_stop)))
    df_copy = df_stop.copy()
    neighbors_copy = neighbors.copy()
    area2 = area1.copy()
    pre_max_id = 0
    dynamic_deep = dict(zip(np.argsort(area1.geometry.area.values)[
                        ::-1].tolist(), np.linspace(3, 9, len(area1))))
    print("Following is the Depth-First Search")

    # The process of deep search
    for k, factor in enumerate(scales):
        # Driver Code
        visited = set()  # Set to keep track of visited nodes of graph.
        aggregate_node = dict((i, [])for i in list(neighbors_copy.keys()))
        for i in tqdm(list(neighbors_copy.keys())):
            dfs(visited, neighbors_copy, i, factor)
        total_union, visited = [], []
        max_id = max(neighbors_copy)+1
        for i in list(neighbors_copy.keys()):
            if i not in visited:
                new_visit = set()
                res = list(_flatten(search_union(
                    aggregate_node, i, new_visit, visited)))
                if res:
                    total_union.append(res)
                visited += res
        visited = list(set(visited))
        new_id = np.zeros((len(df_copy)))
        for i, x in enumerate(tqdm(total_union)):
            # The process of reorganization
            geometry = unary_union(area2.iloc[x].geometry)
            tdf = df_copy[df_copy.blocks.isin(x)]
            new_id[list(df_copy[df_copy.blocks.isin(x)].index)] = max_id+i
            counts = tdf.category.value_counts().values
            counts = counts/counts.sum()
            entropy[max_id+i] = (-counts*np.log(counts)).sum()
            if len(tdf) > 0:
                counts = tdf.category.value_counts().values
                counts = counts/counts.sum()
                entropy_values = (-counts*np.log(counts)).sum()
                category = tdf.category.value_counts().index[0]

            # Update information in area data and track data
            category = area2.iloc[x].category.value_counts().index[0]
            df_od_duration.loc[df_od_duration.previous_blocks ==
                               max_id+i, 'previous_category'] = category
            df_od_duration.loc[df_od_duration.next_hop_blocks ==
                               max_id+i, 'next_hop_category'] = category
            area2 = area2.append({'geometry': geometry, 'centroid': geometry.centroid, 'category': category, 'index': [
                                 max_id+i], 'entropy': entropy_values, 'iteration': k}, ignore_index=True)
            neighbors_copy[max_id+i] = _flatten([neighbors_copy[i] for i in x])
            df_od_duration.previous_blocks = df_od_duration.previous_blocks.replace(
                x, max_id+i)
            df_od_duration.next_hop_blocks = df_od_duration.next_hop_blocks.replace(
                x, max_id+i)
        df_copy['blocks'] = new_id.astype(int)
        dynamic_deep = dict(zip(np.argsort(area2.geometry.area.values)[
                            ::-1].tolist(), np.linspace(3, 9, len(area2))))
        # multi-level nesting
        if k != len(scales)-1:
            neighbors_flatten = np.array(
                _flatten([x for x in neighbors_copy.values()]))
            for i, x in enumerate(tqdm(total_union)):
                neighbors_flatten[np.isin(neighbors_flatten, x)] = max_id+i
            cumsum_idx = np.cumsum([0]+[len(x)
                                   for x in neighbors_copy.values()])
            for n, (i, j) in enumerate(zip(cumsum_idx[:-1], cumsum_idx[1:])):
                neighbors_copy[pre_max_id +
                               n] = list(set(neighbors_flatten[i:j].tolist()))
            for i in range(max_id):
                if i in neighbors_copy.keys():
                    del neighbors_copy[i]
            pre_max_id = max_id
    merged_area = area2[area2['iteration'] == len(scales)-1]
    for idx, tdf in tqdm(merged_area[merged_area['index'].isna()].iterrows(), total=merged_area[merged_area['index'].isna()].shape[0]):
        merged_area['index'].loc[idx] = [idx]
    merged_geometry = []
    for x in tqdm(merged_area.geometry):
        merged_geometry.append(cascaded_union(
            x.buffer(0.0005)).buffer(-0.0005))

    # Update information in merged_area
    merged_area['geometry'] = merged_geometry
    merged_area['traj_key'] = merged_area.index
    for _, tdf in tqdm(merged_area.groupby('traj_key')):
        cdf = df_copy[df_copy.blocks.isin(tdf['index'].values.tolist()[0])]
        if len(cdf) != 0:
            df_copy.loc[cdf.index]['traj_key'] = _
    merged_df_od_duration = df_od_duration.copy()
    for _, tdf in tqdm(merged_area.groupby('traj_key')):
        merged_index = tdf['index'].values.tolist()[0]
        if len(merged_index) > 1:
            merged_df_od_duration.previous_blocks = merged_df_od_duration.previous_blocks.replace(
                merged_index, [tdf['traj_key']]*len(merged_index))
            merged_df_od_duration.next_hop_blocks = merged_df_od_duration.next_hop_blocks.replace(
                merged_index, [tdf['traj_key']]*len(merged_index))
    # to geojson
    merged_area.drop(['centroid', 'entropy', 'index'], axis=1).to_file(
        'app/static/merged_area.geojson', driver="GeoJSON")

    return merged_df_od_duration, merged_area


if __name__ == '__main__':
    entropy_threshold = 1.0

    merged_df_od_duration, merged_area = Self_Organization(
        start_time=9, end_time=10, entropy_threshold=entropy_threshold)

    # to csv
    pathname1 = './merged_df_od_duration_' + str(entropy_threshold) + '.csv'
    pathname2 = './merged_area_' + str(entropy_threshold) + '.csv'

    merged_df_od_duration.to_csv(pathname1, index=0)
    merged_area.to_csv(pathname2, index=0)

    print('finish !!')
