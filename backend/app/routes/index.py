'''
    The RESTful style api server
'''
from pprint import pprint

from app import app
from app import dataService

import json
import numpy as np
import os
import re
import logging
import mimetypes
import subprocess

from flask import send_file, request, jsonify, render_template, send_from_directory, Response

LOG = logging.getLogger(__name__)

MB = 1 << 20
BUFF_SIZE = 10 * MB

# x = dataService.fetchRoadDataPost('./app/data/graph.json', 'utf-8')

# def partial_response(path, start, end=None):
#     LOG.info('Requested: %s, %s', start, end)
#     file_size = os.path.getsize(path)
#
#     # Determine (end, length)
#     if end is None:
#         end = start + BUFF_SIZE - 1
#     end = min(end, file_size - 1)
#     end = min(end, start + BUFF_SIZE - 1)
#     length = end - start + 1
#
#     # Read file
#     with open(path, 'rb') as fd:
#         fd.seek(start)
#         bytes = fd.read(length)
#     assert len(bytes) == length
#
#     response = Response(
#         bytes,
#         206,
#         mimetype=mimetypes.guess_type(path)[0],
#         direct_passthrough=True,
#     )
#     response.headers.add(
#         'Content-Range', 'bytes {0}-{1}/{2}'.format(
#             start, end, file_size,
#         ),
#     )
#     response.headers.add(
#         'Accept-Ranges', 'bytes'
#     )
#     LOG.info('Response: %s', response)
#     LOG.info('Response: %s', response.headers)
#     return response
#
# def get_range(request):
#     range = request.headers.get('Range')
#     LOG.info('Requested: %s', range)
#     m = re.match('bytes=(?P<start>\d+)-(?P<end>\d+)?', range)
#     if m:
#         start = m.group('start')
#         end = m.group('end')
#         start = int(start)
#         if end is not None:
#             end = int(end)
#         return start, end
#     else:
#         return 0, None
#
# # ################################################################################ route
# @app.route('/')
# def index():
#     print('main url!')
#     return json.dumps('/')
#     # return render_template('index.html')
#
# @app.route('/test')
# def test():
#     return json.dumps('test')
#
# @app.route('/initialization/<video_id>')
# def _initialization(video_id):
#     result = dataService.initialization(video_id)
#     return json.dumps(result)
#
# # show image url
# @app.route('/image/<video_id>/<person_id>')
# def _getImage(video_id, person_id):
#     image_path = os.path.join(dataService.GV.DATA_FOLDER, '{}/{}.jpg'.format(video_id, person_id))
#     return send_file(image_path, mimetype='image/jpg')
#
# # show video url
# @app.route('/video/<video_id>')
# def _get_video(video_id):
#     video_id = str(video_id)
#     video_foler = dataService.GV.VIDEO_FOLDER
#     # print('video_foler: ', video_foler)
#     video_path = os.path.join(video_foler, '{}.mp4'.format(video_id))
#     start, end = get_range(request)
#     return partial_response(video_path, start, end)
#
# @app.route('/videoInfo/<video_id>')
# def _get_video_info(video_id):
#     result = dataService.get_video_info(video_id)
#     return json.dumps(result)
#
# @app.route('/pose/<video_id>')
# def _get_pose_data(video_id):
#     result = dataService.get_pose_data(video_id)
#     return json.dumps(result)
#

# 初始化获取所有userid
@app.route('/getAllUsers', methods = ['GET'])
def _getAllUsers():
     user_id = []
     with open(r"app/static/user_id.json", "r") as f:
          users = json.load(f)
     for id in users:
        user = {}
        user['value'] = id
        user['label'] = id
        user_id.append(user)
     return json.dumps(user_id)


# 根据userid 获取对应的有效 dates
@app.route('/getDatesByUser/<user_id>', methods = ['GET'])
def _getDatesByUser(user_id):
     dates = []
     with open(r"app/static/od_data.json", "r") as f:
          info = json.load(f)
     user = info[user_id]
     for date in user:
        date = date[0][0]
        tmp = {}
        tmp['value'] = date
        tmp['label'] = date
        dates.append(tmp)
     return json.dumps(dates)

# 根据userid和date获取对应的轨迹数据
@app.route('/display/<user_id>/<date>', methods = ['GET'])
def _display(user_id, date):
     result = []
     with open(r"app/static/od_data.json", "r") as f:
          info = json.load(f)
     user = info[user_id]
     for day in user:
        if(day[0][0] == date):
            result = day
     print(result)
     return json.dumps(result)


# @app.route('/fetchLassoedDataPost', methods = ['POST'])
# def _fetchLassoedDataPost():
#     # print('backend: run function fetchOverviewData2()')
#     post_data = json.loads(request.data.decode())
#     # print('backend: post_data:', post_data)
#
#     data = post_data['lassoedData']
#     # request_data = request.get_json()
#     # print('backend: request_data:', request_data)
#     result = dataService.fetchLassoedDataPost(data)
#     return json.dumps(result)

@app.route('/fetchroaddata1', methods=['POST'])
def _fetchRoadDataPost1():
    p = dataService.fetchRoadDataPost('./app/data/data1.json', 'utf-8')

    post_data = json.loads(request.data.decode())
    # print(post_data)
    ne = post_data['ne']
    sw = post_data['sw']
    arr = []
    for i in p['features']:
        # print(i)
        # print(i['geometry']['coordinates'])
        coords = i['geometry']['coordinates']

        print(coords)
        print(1111111111111111111111)
        if ne['lng'] > coords[0] > sw['lng'] and ne['lat'] > coords[1] > sw['lat']:
            arr.append(i)

        # flag  = False
        # for j in coords:
        #     if ne['lng'] > j[0] > sw['lng'] and ne['lat'] > j[1] > sw['lat']:
        #         flag = True
        #         break
        # if flag:
        #     print(i)
        #     arr.append(i)

    p['features'] = arr
    print("ne:", ne['lng'], ne['lat'])
    print("sw:", sw['lng'], sw['lat'])
    with(open('test.geojson', 'w', encoding='utf-8')) as f:
        f.write(json.dumps(p,ensure_ascii=False))
    return json.dumps(p,ensure_ascii=False)


@app.route('/fetchroaddata2', methods=['POST'])
def _fetchRoadDataPost2():
    p = dataService.fetchRoadDataPost('./app/data/data2.json', 'utf-8')
    # print('backend: run function fetchOverviewData2()')
    # print('backend: post_data:', post_data)
    # request_data = request.get_json()
    # print('backend: request_data:', request_data)
    post_data = json.loads(request.data.decode())
    # print(post_data)
    ne = post_data['ne']
    sw = post_data['sw']
    arr=[]
    for i in p['features']:
        # print(i)
        # print(i['geometry']['coordinates'])
        coords = i['geometry']['coordinates']
        flag = False
        for j in coords:
            if ne['lng'] > j[0] > sw['lng'] and ne['lat'] > j[1] > sw['lat']:
                arr.append(i)
                break

    print("ne:", ne['lng'], ne['lat'])
    print("sw:", sw['lng'], sw['lat'])

    return json.dumps(p,ensure_ascii=False)



@app.route('/fetchroaddata3', methods=['POST'])
def _fetchRoadDataPost3():
    # print("===============================")
    p = x.copy()
    # print('backend: run function fetchOverviewData2()')
    # print('backend: post_data:', post_data)
    # request_data = request.get_json()
    # print('backend: request_data:', request_data)
    post_data = json.loads(request.data.decode())
    # print(post_data)
    arr = []
    ne = post_data['ne']
    sw = post_data['sw']

    for i in p['features']:
        # print(i)
        # print(i['geometry']['coordinates'])
        # print(i['geometry'])
        if i['geometry'] is None:
            pass
        elif i['geometry']['type'] =='MultiLineString':
            coords = i['geometry']['coordinates']
            flag = False
            for k in coords:
                for j in k:
                    # print(j[0])
                    # print('j: ',j)
                    if ne['lng'] > j[0] > sw['lng'] and ne['lat'] > j[1] > sw['lat']:
                        flag = True
                        break
            if flag:
                # print(i)
                arr.append(i)
        elif i['geometry']['type'] =='LineString':

            coords = i['geometry']['coordinates']
            for j in coords:
                if ne['lng'] > j[0] > sw['lng'] and ne['lat'] > j[1] > sw['lat']:
                    arr.append(i)
                    break
    p['features'] = arr
    # print("ne:", ne['lng'], ne['lat'])
    # print("sw:", sw['lng'], sw['lat'])

    return json.dumps(p)


if __name__ == '__main__':
    pass
