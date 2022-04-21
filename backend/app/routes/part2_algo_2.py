# coding=gbk

import logging

import pyhaversine
from grid import Grid, Group, CoordCentroid

import numpy as np
import pandas as pd

"""
Définition des fonctions
"""

def algo_2(P: np.ndarray, max_radius: float, redistribute_point: bool=True) -> Grid:
    """
    Clustering algorithm 2 from
    Spatial Generalization and Aggregation of Massive Movement Data, 
    Adrienko & Adrienko, IEEE TVCG, 2011

    :param P: Geographical coordinates, should be in order `LATITUDE`, `LONGITUDE`
    :type P: np.ndarray
    :param max_radius: the max radius
    :type max_radius: float
    :param redistribute_point: to attribute a centroid to each point, not necessary if you want apply algo 3 after this one, defaults to True
    :type redistribute_point: bool, optional
    :return: the grid containing the centroids
    :rtype: Grid
    """

    # cherche les limites de la grille
    x_min, x_max = min(P[:,0]), max(P[:,0])
    y_min, y_max = min(P[:,1]), max(P[:,1])
    
    # on init la grid
    G = Grid(x_min, x_max, y_min, y_max, max_radius)

    logging.debug(f"size grid : {G.n_rows}, {G.n_columns}")
    
    for p in P:
        logging.debug(f"put p = {p}")
        put_in_proper_group(p, G)
    logging.debug("call redistribute points")
    if redistribute_point:
        redistribute_points(G)
        # TODO retourner la liste des groupes plut?t que la grille de cellule ?
    return G

def put_in_proper_group(p, G):
    """
    pour un objet `p`, cherche le groupe le plus pertinent dans `G`
    """
    c = get_closer_centroid(p, G)
    if not c:
        g = Group(p, tuple(p))
        # R[p] = g, pas besoin ici
    else:
        g = G.findGroup(c)
        g.group_of_point.append(p)
        # on supprime le groupe de la cellule
        old_cell = G.findCell(g.centroid)
        del old_cell[g.centroid]
        g.update_centroid()
    # on positionne le groupe dans la bonne cellule selon ses coordonnées `i,j`
    i, j = G.get_grid_position(g.centroid)
    logging.debug(f"\t in {i}, {j} cell")
    G.matrice_of_cells[i, j][tuple(g.centroid)] = g

def get_closer_centroid(p, G, cell_gap: int = 1) -> CoordCentroid:
    """
    pour un objet `p`, cherche le centroid le plus proche dans `G`
    """
    # TODO fonction de class Grid
    i, j = G.get_grid_position(p)
    logging.debug(f"\t\t search around {i}, {j}")
    C = []
    # 比较包含“p”的单元格中所有质心的距离
    # 在所有邻近的细胞中也是如此
    for k_row in range(max(i-cell_gap, 0), min(i+1+cell_gap, G.n_rows)):
        for k_col in range(max(j-cell_gap, 0), min(j+1+cell_gap, G.n_columns)):
            # logging.info(f"\t\t\t\t {k_row}, {k_col}")
            for g in G.matrice_of_cells[k_row, k_col].values():
                # logging.info(f"\t\t\t\t\t {g}")
                p_tuple = (p[0], p[1])
                dist_p_and_centroid = pyhaversine.haversine(p_tuple, g.centroid)/1000
                # logging.info(f"\t\t\t\t\t {dist_p_and_centroid}")
                if dist_p_and_centroid <= G.max_radius*cell_gap:
                    C.append((dist_p_and_centroid, g))
    if not C:
        return None
    # retourne le centroid ayant la distance la plus proche à p
    return min(C, key=lambda x: x[0])[1].centroid

def redistribute_points(G: Grid):
    """
    récupère juste les centroids et tous les points 
    et redistribue les points au centroid le plus proche
    """
    # TODO fonction de class Grid
    # on récupère tous les objets
    P = G.getAllPoints()
    # for row_cell in G.matrice_of_cells:
    #     logging.debug(f"\tfor row cell")
    #     for cell in row_cell:
    #         logging.debug(f"\t\tfor cell")
    #         for centroid in cell.keys():
    #             logging.debug(f"\t\tfor {centroid}")
    # puis on les supprime de la grille
    for row_cell in G.matrice_of_cells:
        for cell in row_cell:
            cell.cleanAllGroupOfPoint()
    # pour les réindexer ensuite vers le plus proche centroid
    for point in P:
        # logging.debug(f"\tfor {point}")
        try:
            c = get_closer_centroid(point, G)
            cell_gap = 2
            while not c:
                # nb : this loop not in original paper
                c = get_closer_centroid(point, G, cell_gap=cell_gap)
                cell_gap += 1
            # logging.debug(f"\tin {c}")
            g = G.findGroup(tuple(c))
            # on ajoute le point au groupe mais on ne met plus à jour le centroid
            g.group_of_point.append(point)
        except:
            print(f"Error {point}")

def assign_centroid_to_each_point(df_points: pd.DataFrame, centroids: np.array) -> pd.DataFrame:
    """Assign the nearest centroid number for each point

    :param df_points: Should contains columns `LATITUDE` and `LONGITUDE`
    :type df_points: pd.DataFrame
    :param centroids: Geographical coordinates of the centroids
    :type centroids: np.array
    :return: Points with centroid numbers
    :rtype: pd.DataFrame
    """

    points_tuple = [tuple(x) for x in df_points[['LATITUDE', 'LONGITUDE']].to_numpy()]
    centroids_tuple = [tuple(x) for x in centroids]
    points_centroid_tuple = []
    for stop in points_tuple:
        for centroid in centroids_tuple:
            points_centroid_tuple.append((stop, centroid))
    distancesToCentroids = pyhaversine.bulk_haversine(points_centroid_tuple)
    logging.info('Fin du cdist entre STOPS et centroids')
    
    distancesToCentroids = np.array(distancesToCentroids).reshape((len(points_tuple), 
                                                                   len(centroids_tuple)))

    df_place_with_results = df_points.copy()

    df_place_with_results['CENTROID_NUMBER'] = pd.Series(np.argmin(distancesToCentroids, axis=1), 
        index=df_points.index)
    
    return df_place_with_results


