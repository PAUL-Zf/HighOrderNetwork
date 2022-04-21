# coding=gbk
import numpy as np
import math
from typing import List, Dict, Tuple

import pyhaversine

import logging

# Notations
# G : un Grid
# C une cellule de G
# g : un groupe de C
# c : un centroid de g

"""
Définition des objets
"""

CoordCentroid = Tuple[float, float]

class Group:

    def __init__(self, p=None, c: CoordCentroid=None):
        if p is None:
            self.group_of_point = []
        else:
            self.group_of_point = [p]
        self.__centroid = c
        
    def test_centroid(self, c) -> bool:
        if self.__centroid == c:
            return True
        else:
            return False

    @property
    def centroid(self):
        return self.__centroid

    @centroid.setter
    def centroid(self, new_c: CoordCentroid):
        self.__centroid = new_c

    def update_centroid(self):
        self.__centroid = tuple(np.mean(self.group_of_point, axis=0))

GrpDictType = Dict[CoordCentroid, Group]
ListDictType = Dict[CoordCentroid, List]

class Cell(GrpDictType):
    ...
    
    def findGroup(self, c: CoordCentroid) -> Group:
        if c in self:
            return self[c]
        return None

    def cleanAllGroupOfPoint(self):
        for cell in self.values():
            cell.group_of_point = []
        
class DictCoordCentroidToListOfPoint(ListDictType):
    ...

vCell = np.vectorize(Cell)

class Grid:
    
    def __init__(self, x_min, x_max, y_min, y_max, max_radius):
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        logging.debug(f"grid min max : {self.x_min}, {self.x_max}, {self.y_min}, {self.y_max}")
        coords_east = (self.x_max, (self.y_max + self.y_min)/2)
        coords_west = (self.x_min, (self.y_max + self.y_min)/2)
        coords_north = ((self.x_max + self.x_min)/2, self.y_max)
        coords_south = ((self.x_max + self.x_min)/2, self.y_min)
        logging.debug(f"grid coord extreme : {coords_east}, {coords_west}, {coords_north}, {coords_south}")
        self.dist_latitude = pyhaversine.haversine(coords_west, coords_east)/1000
        self.dist_longitude = pyhaversine.haversine(coords_north, coords_south)/1000
        self.max_radius = max_radius
        # self.matrice_of_cells = np.empty((self.n_rows, self.n_columns), dtype=object)
        # self.matrice_of_cells[:] = vCell()
        # self.matrice_of_cells = np.full((self.n_rows, self.n_columns), vCell())
        self.matrice_of_cells = np.array([[vCell() for _ in range(self.n_columns)] 
                                            for _ in range(self.n_rows)
                                          ],
                                         dtype=object)
        logging.debug(f"grid col row : {self.n_columns}, {self.n_rows}")
        
    @property
    def n_rows(self) -> int:
        return int(self.dist_latitude / self.max_radius + 1)
        
    @property
    def n_columns(self) -> int:
        return int(self.dist_longitude / self.max_radius + 1)
    
    def findCell(self, c: CoordCentroid) -> Cell:
        """
        c: le centroid
        return: la Cell
        """
        for row_cell in self.matrice_of_cells:
            for cell in row_cell:
                if cell.findGroup(c):
                    return cell
    
    def findGroup(self, c: CoordCentroid) -> Group:
        """
        c: le centroid
        return: le Group
        """
        for row_cell in self.matrice_of_cells:
            for cell in row_cell:
                tmp_grp = cell.findGroup(c)
                if tmp_grp:
                    return tmp_grp

    def get_grid_position(self, p) -> Tuple[int, int]:
        """
        Retrouve les coordonnées de l'objet `p` sur la matrice_of_cells
        """
        p_tuple = (p[0], p[1])
        i = math.floor(pyhaversine.haversine(p_tuple, (self.x_min, p[1])) / (1000*self.max_radius))
        j = math.floor(pyhaversine.haversine(p_tuple, (p[0], self.y_min)) / (1000*self.max_radius))
        return i, j

    def getAllPoints(self) -> np.array:
        # centroids_list = []
        points_list = []
        for row_cell in self.matrice_of_cells:
            for cell in row_cell:
                for _, groups in cell.items():
                    # centroids_list.append(centroid)
                    for point in groups.group_of_point:
                        points_list.append(point)
        # return np.array(centroids_list), 
        return np.array(points_list)

    def getAllCentroids(self) -> np.array:
        centroids_list = []
        for cdict in [c for c in self.matrice_of_cells.flatten() if c]:
            for ctuple in cdict:
                centroids_list.append(list(ctuple))
        return np.array(centroids_list)

    def getCentroidsAndPoints(self) -> DictCoordCentroidToListOfPoint:
        centroids_points_dict = DictCoordCentroidToListOfPoint()
        for cdict in [c for c in self.matrice_of_cells.flatten() if c]:
            for ctuple, group in cdict.items():
                centroids_points_dict[ctuple] = np.array(group.group_of_point)
        return centroids_points_dict