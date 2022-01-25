# -*- coding: utf-8 -*-
import json
import os


try:
    import GlobalVariable as GV
except ImportError:
    import app.dataService.GlobalVariable as GV


class DataService(object):
    def __init__(self):
        self.GV = GV
        print('=================================================')
        return

    # def initialization(self, video_id):
    #     self.video_id = video_id
    #     result = {'test': 'test'}
    #     return result
    #
    # def test(self):
    #     print(self.GV.test)
    #
    # def get_video_info(self, video_id):
    #     video_path = os.path.join(GV.VIDEO_FOLDER, '{}.mp4'.format(video_id))
    #     try:
    #         capture = cv2.VideoCapture(video_path)
    #     except:
    #         print('something wrong with video_path')
    #         return {}
    #     if not capture.isOpened():
    #         print("could not open :", video_path)
    #         return {}
    #     else:
    #         total_frame = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    #         video_width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    #         video_height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    #         fps = capture.get(cv2.CAP_PROP_FPS)
    #
    #         video_info = {
    #             'totalFrmNum': total_frame,
    #             'videoWidth': video_width,
    #             'videoHeight': video_height,
    #             'fps': fps,
    #             'videoId': video_id,
    #             'videoPath': video_path,
    #             'type': 'mp4'
    #         }
    #     return video_info
    #
    # def get_pose_data(self, video_id):
    #     with open('{}/{}.json'.format(GV.POSE_FOLDER, video_id), 'r') as rf:
    #         result = json.load(rf)
    #     return result
    #
    # def fetchLassoedDataPost(self, post_data):
    #     length = len(post_data)
    #     sourcewater = random() * length * 600
    #     drainwater = sourcewater - random() * 100 * length
    #     souceleakage = sourcewater * (0.05 + 0.05 * random())
    #     drainleakage = drainwater * (0.06 + 0.06 * random())
    #     indus = 80 + 5 * (random() - 0.5)
    #     home = 10 + 2 * (random() - 0.5)
    #     publ = 7 + 1 * (random() - 0.5)
    #     spec = 100 - indus - home - publ
    #     utilize_type = [
    #         {"model": "居民家庭用水", "acc": home / 100},
    #         {"model": "公共服务用水", "acc": publ / 100},
    #         {"model": "生产运营用水", "acc": indus / 100},
    #         {"model": "消防及其他特殊用水", "acc": spec / 100}]
    #     citizen = 65 + (random() - 0.5) * 7
    #     people = {'城市人口': citizen, '农村人口': 100 - citizen}
    #     an = {'bar': [{'name': '供水量', 'value': sourcewater},
    #                   {'name': '污水量', 'value': drainwater},
    #                   {'name': '供水管泄露', 'value': souceleakage},
    #                       {'name': '污水管泄露', 'value': drainleakage}], 'utilize_type': utilize_type, 'people': people}
    #     return an
    def fetchRoadDataPost(self,filename,encode) -> dict:
        print(os.getcwd())
        with open(filename, 'r', encoding=encode) as f:
            a = json.load(f)
        return a


def calculate(pipes, nodes):
    '''
    :param pipes: [{axis:[x,y],through:volume,leakage:volume, direction:0/1/2,type:source/drainage},{},{},...]
    pipes leakage is calculated by the two side difference.
    direction:
        0: flow in
        1: flow out
        2: inside the circle
    :param nodes: [{axis:[x,y],through:},}]
    :return:
    result:amount leakage:volume
    '''
    pass



if __name__ == '__main__':
    print('start')
    dataService = DataService()
