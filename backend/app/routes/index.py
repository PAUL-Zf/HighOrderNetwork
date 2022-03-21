'''
    The RESTful style api server
'''
from pprint import pprint

from app import app
from app import dataService

import pandas as pd
import json
import math
import numpy as np
import os
import re
import logging
import mimetypes
import subprocess
import heapq

from flask import send_file, request, jsonify, render_template, send_from_directory, Response

LOG = logging.getLogger(__name__)

MB = 1 << 20
BUFF_SIZE = 10 * MB

category_map = {'Food': 0,
                'Shop & Service': 1,
                'Outdoors & Recreation': 2,
                'Professional & Other Places': 3,
                'Travel & Transport': 4,
                'Nightlife Spot': 5,
                'Arts & Entertainment': 6,
                'College & University': 7,
                'Residence': 8,
                'Event': 9}


def sum_of_list(flow):
    sum = 0
    for v in flow:
        sum += v
    return sum


def add_to_matrix(region_category, matrix, x, y, c1, c2):
    matrix[x][y] += 1
    region_category[x][category_map[c1]] += 1
    region_category[y][category_map[c2]] += 1
    return x


def transferTime(time, scale):
    time = time.split(':')
    hour = int(time[0])
    minute = int(time[1])
    return int(hour / scale) + math.floor(minute / (60 * scale))


def computeLeftTime(checkin_time, duration, scale):
    # check checkin_time + duration to add to out_data
    time = checkin_time.split()[1]
    seconds = int(time.split(':')[0]) * 3600 + \
        int(time.split(':')[1]) * 60 + int(time.split(':')[2])

    # time + duration 可能是第二天，超过24小时，所以要取余
    total = int(seconds + duration) % (24 * 3600)
    hour = math.floor(total / 3600)
    minute = math.floor(total % 3600 / 60)
    left_time = int(hour / scale) + math.floor(minute / (60 * scale))
    return left_time


def mergePOI(data):
    for flow in data:
        extra = 0
        sorted_id = sorted(
            range(len(flow)), key=lambda k: flow[k], reverse=True)
        top = sorted_id[:3]
        for i in range(len(flow)):
            if i not in top:
                extra += flow[i]
                flow[i] = 0
        flow.insert(0, extra)
    return data

# 计算KL散度


def computeKLD(high, low):
    # 选取high非零的region，并取low对应的部分
    KLD = 0
    nonzero_high = []
    nonzero_low = []
    sum_high = 0
    sum_low = 0
    for i in range(len(high)):
        if(high[i] == 0):
            continue
        nonzero_high.append(high[i])
        nonzero_low.append(low[i])
        sum_high += high[i]
        sum_low += low[i]

    # 计算KL散度
    if(sum_high == 0):
        return KLD

    # 对于最后只有一个目的地的类型
    if(len(nonzero_high) == 1):
        if(nonzero_high[0] > 2):
            return 1

    for i in range(len(nonzero_high)):
        p_high = nonzero_high[i] / sum_high
        p_low = nonzero_low[i] / sum_low
        KLD += p_high * math.log(p_high) - p_high * math.log(p_low)
    return KLD


def computeEntropy(data):
    # 筛选出非零值
    sum = 0
    nonzero_data = []
    entropy = 0
    for d in data:
        if(d == 0):
            continue
        sum += d
        nonzero_data.append(d)

    # 计算entropy
    if sum == 0:
        return 0
    for d in nonzero_data:
        entropy += (-1) * (d / sum) * math.log(d / sum, 2)
    return entropy


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
@app.route('/getAllUsers', methods=['GET'])
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
@app.route('/getDatesByUser/<user_id>', methods=['GET'])
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


@app.route('/display/<user_id>/<date>', methods=['GET'])
def _display(user_id, date):
    result = []
    with open(r"app/static/od_data.json", "r") as f:
        info = json.load(f)
    user = info[user_id]
    for day in user:
        if(day[0][0] == date):
            result = day
    return json.dumps(result)

# 根据startTime和timeLength获取对应的HighOrder数据


@app.route('/getHighOrder/<start>/<length>/<region>/<type>', methods=['GET'])
def _getHighOrder(start, length, region, type):
    start = int(start)
    slot_length = int(length)
    regionId = int(region)
    date = type
    slotNum = 24

    scale = 24 / slotNum
    time_slots = [x for x in range(start, start + slot_length)]

    if (date == 'Weekdays'):
        od_data = pd.read_csv(r"app/static/weekdays.csv")
    else:
        od_data = pd.read_csv(r"app/static/holidays.csv")

    # 根据 checkin_time, (checkin_time + duration), next_hop_checkin_time 初步筛选轨迹
    trajectory = []
    for index, row in od_data.iterrows():
        user_id = row['user_id']
        checkin_time = row['checkin_time']
        next_hop_checkin_time = row['next_hop_checkin_time']
        duration = row['duration']
        pre_category = row['pre_level_0_category']
        next_category = row['next_hop_level_0_category']
        pickup_centroid = row['pickup_centroid']
        dropoff_centroid = row['dropoff_centroid']

        checkin_slot = transferTime(checkin_time.split()[1], scale)
        next_hop_checkin_slot = transferTime(
            next_hop_checkin_time.split()[1], scale)
        left_slot = computeLeftTime(checkin_time, duration, scale)

        if(pickup_centroid == regionId) and (checkin_slot in time_slots or left_slot in time_slots):
            trajectory.append(user_id)
        elif(dropoff_centroid == regionId) and (next_hop_checkin_slot in time_slots):
            trajectory.append(user_id)

    # 去重
    temp = []
    for x in trajectory:
        if x not in temp:
            temp.append(x)
    trajectory = temp

    abstract_data = {}
    max_order = 4
    for traj in trajectory:
        data = od_data[od_data['user_id'] == traj]

        region_traj = []
        in_region = []
        count = 0

        high_order = [-1 for x in range(max_order+1)]
        high_order[max_order - 1] = regionId

        # 抽象出轨迹数据
        for index, row in data.iterrows():
            checkin_time = row['checkin_time']
            duration = row['duration']
            pickup_centroid = row['pickup_centroid']

            checkin_slot = transferTime(checkin_time.split()[1], scale)
            next_hop_checkin_slot = transferTime(
                next_hop_checkin_time.split()[1], scale)
            left_slot = computeLeftTime(checkin_time, duration, scale)

            region_traj.append(pickup_centroid)
            if(pickup_centroid == regionId) and (checkin_slot in time_slots or left_slot in time_slots):
                in_region.append(count)
            count += 1

            dropoff_centroid = row['dropoff_centroid']
            next_hop_checkin_time = row['next_hop_checkin_time']
            region_traj.append(dropoff_centroid)
            if(dropoff_centroid == regionId) and (next_hop_checkin_slot in time_slots):
                in_region.append(count)
            count += 1

        if not in_region:
            continue

        # 数据清洗
        start_index = in_region[0]
        end_index = in_region[-1]

        # 第一个符合条件的数据和最后一个符合条件的数据之间的数据清除(不包括第一个数据，包括最后一个数据)
        del region_traj[start_index+1:end_index+1]

        # 从 start_index 往后找一个，往前找个
        for i in range(start_index+1, len(region_traj)):
            if(region_traj[i] != regionId):
                high_order[max_order] = region_traj[i]
                break

        last = regionId
        current_order = max_order - 2
        for i in range(start_index-1, -1, -1):
            if (current_order < 0):
                break
            if(region_traj[i] != last):
                high_order[current_order] = region_traj[i]
                last = region_traj[i]
                current_order -= 1

        abstract_data[traj] = high_order

        # 统计一阶数据

        valid_order = {}    # 记录所有有效的路径（KLD < threshold）
        valid_kld = {}      # 记录所有有效的路径的KLD（KLD < threshold）
        region_number = 13
        order_1 = {}
        threshold = 0.01    # KLD散度的阈值

        # 用于筛选掉没有下一点的轨迹
        valid = {}
        for k, v in abstract_data.items():
            dest = v[max_order]
            current = v[max_order - 1]
            path = str(current) + '_'
            if (dest != -1):
                valid[k] = v
                if path not in order_1:
                    order_1[path] = [0 for x in range(region_number)]
                order_1[path][dest] += 1

        # 筛选掉没有下一点的轨迹
        abstract_data = valid

        # 一阶数据默认有效
        for k, v in order_1.items():
            valid_order[k] = v

        # 统计二阶数据
        order_2 = {}
        for k, v in abstract_data.items():
            dest = v[max_order]
            path = ''
            for i in range(max_order-2, max_order):
                if(v[i] == -1):
                    break
                path += str(v[i]) + '_'
            if path:
                if path not in order_2:
                    order_2[path] = [0 for x in range(region_number)]
                order_2[path][dest] += 1

        # 计算二阶KLD
        KLD = {}    # 存储所有路径KLD（未经过阈值筛选）
        for k, v in order_2.items():
            pre = k.split('_', 1)[1]
            if pre in valid_order:
                KLD[k] = computeKLD(v, valid_order[pre])
                # 根据KLD更新数据
                if(KLD[k] > threshold):
                    valid_order[k] = v
                    valid_kld[k] = KLD[k]

        # 统计三阶数据
        order_3 = {}
        for k, v in abstract_data.items():
            dest = v[max_order]
            path = ''
            for i in range(max_order-3, max_order):
                if(v[i] == -1):
                    break
                path += str(v[i]) + '_'
            if path:
                if path not in order_3:
                    order_3[path] = [0 for x in range(region_number)]
                order_3[path][dest] += 1

        # 计算三阶KLD
        for k, v in order_3.items():
            pre = k.split('_', 1)[1]
            if pre in valid_order:
                KLD[k] = computeKLD(v, valid_order[pre])
                # 根据KLD更新数据
                if(KLD[k] > threshold):
                    valid_order[k] = v
                    valid_kld[k] = KLD[k]

        # 统计四阶数据
        order_4 = {}
        for k, v in abstract_data.items():
            dest = v[max_order]
            path = ''
            for i in range(max_order-4, max_order):
                if(v[i] == -1):
                    break
                path += str(v[i]) + '_'
            if path:
                if path not in order_4:
                    order_4[path] = [0 for x in range(region_number)]
                order_4[path][dest] += 1

        # 计算四阶KLD
        for k, v in order_4.items():
            pre = k.split('_', 1)[1]
            if pre in valid_order:
                KLD[k] = computeKLD(v, valid_order[pre])
                # 根据KLD更新数据
                if(KLD[k] > threshold):
                    valid_order[k] = v
                    valid_kld[k] = KLD[k]

        # 遍历 valid_order，计算所有entropy
        valid_entropy = {}
        for k, v in valid_order.items():
            valid_entropy[k] = computeEntropy(v)

        sort_entropy = dict(sorted(valid_entropy.items(), key=lambda e: e[1]))

        result = {}
        top = 5
        index = 0
        for k, v in sort_entropy.items():
            if(index >= top):
                break
            result[k] = valid_order[k]
            index += 1
    return json.dumps(result)

# 取overview数据


@app.route('/getOverview/<type>', methods=['GET'])
def _getOverview(type):
    if (type == 'Weekdays'):
        od_data = pd.read_csv(r"app/static/weekdays.csv")
    else:
        od_data = pd.read_csv(r"app/static/holidays.csv")
    region_number = 13
    category_number = 10
    matrix = [[] for x in range(region_number)]
    region_category = [[] for x in range(region_number)]
    for i in range(region_number):
        matrix[i] = [0 for x in range(region_number)]
        region_category[i] = [0 for x in range(category_number)]

    od_data.apply(lambda x: add_to_matrix(region_category,
                                          matrix, x.pickup_centroid, x.dropoff_centroid, x.pre_level_0_category, x.next_hop_level_0_category), axis=1)

    for i in range(region_number):
        matrix[i][i] = 0

    # compute total flow and category variance for each region
    max_flow = 0
    totalFlow = [0 for x in range(region_number)]
    variance = []
    for i in range(region_number):
        r = matrix[i]
        v = region_category[i]
        totalFlow[i] = sum_of_list(r)
        variance.append(np.std(v, ddof=1))
        max_flow = max_flow > sum_of_list(r) and max_flow or sum_of_list(r)

    # find top 3 out flow for each region
    for i in range(region_number):
        r = matrix[i]
        tmp = zip(range(len(r)), r)
        top = heapq.nlargest(3, tmp, key=lambda x: x[1])
        index = []
        for v in top:
            index.append(v[0])
        for j in range(len(r)):
            if j not in index:
                r[j] = 0

    # find top 3 categories for each region
    for i in range(region_number):
        r = region_category[i]
        tmp = zip(range(len(r)), r)
        top = heapq.nlargest(3, tmp, key=lambda x: x[1])
        index = []
        for v in top:
            index.append(v[0])
        for j in range(len(r)):
            if j not in index:
                r[j] = 0

    # compute proportion
    for i in range(region_number):
        r = region_category[i]
        sum = sum_of_list(r)
        scale = 1000 / sum
        for j in range(len(r)):
            r[j] /= sum

    # given scale 1000
    for i in range(region_number):
        r = matrix[i]
        sum = sum_of_list(r)
        scale = 1000 / sum
        for j in range(len(r)):
            r[j] *= scale

    result = [matrix, region_category, totalFlow, variance, max_flow]

    return json.dumps(result)

# 取 VanAreasMap geoJson数据


@app.route('/getVanAreasMap/<entropy>', methods=['GET'])
def _getVanAreasMap(entropy):
    path = "app/static/nyc_area_threshold_"
    if(entropy == '1'):
        path += "1.8.geojson"
    elif(entropy == '2'):
        path += "2.2.geojson"
    else:
        path += "2.5.geojson"
    path = "app/static/merged_area_threshold_1.0.geojson"
    with open(path, "r") as f:
        info = json.load(f)
    return json.dumps(info)

# 取 map.geoJson数据


@app.route('/getMap', methods=['GET'])
def _getMap():
    with open(r"app/static/map.geojson", "r") as f:
        info = json.load(f)
    return json.dumps(info)

# 根据date获取对应的region flow数据


@app.route('/getRegionFlow/<date>', methods=['GET'])
def _getRegionFlow(date):
    if (date == 'Weekdays'):
        od_data = pd.read_csv(r"app/static/weekdays.csv")
    else:
        od_data = pd.read_csv(r"app/static/holidays.csv")
    # compute region flow
    region_number = 13
    regions = [[] for x in range(region_number)]
    for i in range(region_number):
        regions[i] = [0 for x in range(len(category_map))]

    last_time = 0

    for index, row in od_data.iterrows():
        user_id = row['user_id']
        checkin_time = row['checkin_time']
        next_hop_checkin_time = row['next_hop_checkin_time']
        pre_category = row['pre_level_0_category']
        next_category = row['next_hop_level_0_category']
        pickup_centroid = row['pickup_centroid']
        dropoff_centroid = row['dropoff_centroid']

        # 判断当前点的 checkin_time 是否与前一个点的 next_hop_checkin_time相同
        # 相同则不重复计算
        if (checkin_time != last_time):
            regions[pickup_centroid][category_map[pre_category]] += 1

        regions[dropoff_centroid][category_map[next_category]] += 1
        last_time = next_hop_checkin_time
    return json.dumps(regions)

# 根据 date和region 获取对应region的 in and out流量数据


@app.route('/getRegionInOut/<date>/<region>', methods=['GET'])
def _getRegionInOut(date, region):
    def filterByRegion(od_data, region_id):
        data = od_data[((od_data['pickup_centroid'] == region_id)
                        | (od_data['dropoff_centroid'] == region_id))
                       & (od_data['pickup_centroid'] != od_data['dropoff_centroid'])]
        return data

    def computeFlow(region_data, category_map, regionId, slotNum):
        # initial data
        in_data = [[] for x in range(slotNum)]
        out_data = [[] for x in range(slotNum)]
        for i in range(slotNum):
            in_data[i] = [0 for x in range(10)]
            out_data[i] = [0 for x in range(10)]

        scale = 24 / slotNum
        last_time = ''

        # compute in and out flow
        for index, row in region_data.iterrows():
            user_id = row['user_id']
            checkin_time = row['checkin_time']
            next_hop_checkin_time = row['next_hop_checkin_time']
            duration = row['duration']
            pre_category = row['pre_level_0_category']
            next_category = row['next_hop_level_0_category']
            pickup_centroid = row['pickup_centroid']
            dropoff_centroid = row['dropoff_centroid']

            # check first point of each user to add to in_data
            if (checkin_time != last_time) and (pickup_centroid == regionId):
                in_data[transferTime(checkin_time.split()[
                                     1], scale)][category_map[pre_category]] += 1

            last_time = next_hop_checkin_time

            # check next_hop_checkin_time to add to in_data
            if dropoff_centroid == regionId:
                in_data[transferTime(next_hop_checkin_time.split()[
                                     1], scale)][category_map[next_category]] += 1

            # check checkin_time + duration to add to out_data
            time = checkin_time.split()[1]
            seconds = int(time.split(
                ':')[0]) * 3600 + int(time.split(':')[1]) * 60 + int(time.split(':')[2])

            # time + duration 可能是第二天，超过24小时，所以要取余
            total = int(seconds + duration) % (24 * 3600)
            hour = math.floor(total / 3600)
            minute = math.floor(total % 3600 / 60)
            left_time = int(hour / scale) + math.floor(minute / (60 * scale))

            if pickup_centroid == regionId:
                out_data[left_time][category_map[next_category]] += 1

        in_data = mergePOI(in_data)
        out_data = mergePOI(out_data)

        return [in_data, out_data]

    # main part
    if (date == 'Weekdays'):
        od_data = pd.read_csv(r"app/static/weekdays.csv")
    else:
        od_data = pd.read_csv(r"app/static/holidays.csv")

    # compute region flow
    regionId = int(region)
    region_data = filterByRegion(od_data, regionId)
    result = computeFlow(region_data, category_map, regionId, 24)
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
        f.write(json.dumps(p, ensure_ascii=False))
    return json.dumps(p, ensure_ascii=False)


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
    arr = []
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

    return json.dumps(p, ensure_ascii=False)


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
        elif i['geometry']['type'] == 'MultiLineString':
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
        elif i['geometry']['type'] == 'LineString':

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
