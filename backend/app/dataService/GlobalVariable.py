# Global variables
# ##############################
import os

test = os.getcwd()

_current_dir = os.path.dirname(os.path.abspath(__file__))

# data folder
DATA_FOLDER = os.path.join(_current_dir, '../data/')  
# image folder
IMAGE_FOLDER = DATA_FOLDER

# video folder
VIDEO_FOLDER = '{}/Test/video'.format(DATA_FOLDER)

# video folder
POSE_FOLDER = '{}/Test/kpts'.format(DATA_FOLDER)