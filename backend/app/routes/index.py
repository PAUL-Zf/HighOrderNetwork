'''
    The RESTful style api server
'''
from glob import glob
from pprint import pprint
from time import time

from matplotlib import artist

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

import app.routes.Self_Organization as SO
import app.routes.city_grid as cg
import app.routes.statistic as st
import app.routes.getHighOrder as gho

from flask import send_file, request, jsonify, render_template, send_from_directory, Response

LOG = logging.getLogger(__name__)

MB = 1 << 20
BUFF_SIZE = 10 * MB


# 全局变量
category_map = {'Food': 0,
                'Shop & Service': 1,
                'Outdoors & Recreation': 2,
                'Professional & Other Places': 3,
                'Travel & Transport': 4,
                'Nightlife Spot': 5,
                'Arts & Entertainment': 6,
                'College & University': 7,
                'Residence': 8,
                'Event': 9,
                }

# 日期类型
dateType = ''

# 记录所有挖掘出的regions的category分布
# generate作为数组index
regionsCategory = []

slotNum = 48
merged_df_od_duration = {}
merged_area = {}
id_pattern = {}

participates = []    # 记录HighOrder中所有参与的regions
groupId = 0
group = []

# compute offset point
# 向量逆时针旋转公式
# (x*cosA - y*sinA, x*sinA + y*cosA)


def computeCurvePoint(x, y, index):
    x0 = (y[0] - x[0]) / 2
    y0 = (y[1] - x[1]) / 2
    if index == 0:
        angle = math.pi / 6
    else:
        angle = math.pi / 4
    x1 = math.cos(angle) * x0 - y0 * math.sin(angle)
    y1 = math.cos(angle) * y0 + x0 * math.sin(angle)
    return [x[0] + x1, x[1] + y1]


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


def sort_and_filter(pattern_count, pattern_time, K):
    sorted_data = sorted(pattern_count.items(),
                         key=lambda kv: (kv[1], kv[0]), reverse=True)
    time_temp = {}
    count_temp = {}
    for i in range(K):
        k = sorted_data[i][0]
        count_temp[k] = pattern_count[k]
        time_temp[k] = pattern_time[k]

    return count_temp, time_temp


def computeLeftTime(checkin_time, duration, scale):
    # check checkin_time + duration to add to out_data
    time = checkin_time.split()[1][:-6]
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
    # 筛选出非零
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

@app.route('/initialization', methods=['GET'])
def _initialization():
    global regionsCategory
    regionsCategory = []

    return json.dumps(regionsCategory)


@app.route('/getRegionCategory/<index>/<regionId>', methods=['GET'])
def _getRegionCategory(index, regionId):
    global regionsCategory
    poi = regionsCategory[int(index)][int(regionId)][0]
    access = regionsCategory[int(index)][int(regionId)][1]

    poi_data = []
    access_data = []
    poi_order_poi = []
    poi_order_access = []
    access_order_poi = []
    access_order_access = []

    # Order in category_map
    # Order in count
    poi_order = sorted(poi.items(), key=lambda x: x[1], reverse=True)
    access_order = sorted(access.items(), key=lambda x: x[1], reverse=True)

    for value in poi_order:
        p = {'category': value[0], 'count': value[1]}
        q = {'category': value[0], 'count': access[value[0]]}
        poi_order_poi.append(p)
        poi_order_access.append(q)

    for value in access_order:
        p = {'category': value[0], 'count': value[1]}
        q = {'category': value[0], 'count': poi[value[0]]}
        access_order_access.append(p)
        access_order_poi.append(q)

    global category_map

    for k in category_map.keys():
        if k in poi:
            p = {'category': k, 'count': poi[k]}
            poi_data.append(p)

    for k in category_map.keys():
        if k in access:
            p = {'category': k, 'count': access[k]}
            access_data.append(p)

    return json.dumps([poi_order_poi, poi_order_access, access_order_poi, access_order_access])

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


@app.route('/display/<user_id>/<date>', methods=['GET'])
def _display(user_id, date):
    result = []
    with open("app/static/od_data.json", "r") as f:
        info = json.load(f)
    user = info[user_id]
    for day in user:
        if(day[0][0] == date):
            result = day
    return json.dumps(result)


# 根据patternId获取对应的Pattern HighOrder数据


@app.route('/getPattern/<patternId>', methods=['GET'])
def _getPattern(patternId):
    pattern = id_pattern[int(patternId)]
    centroids = []

    with open("app/static/overview_centroids.json", "r") as f:
        centroids = json.load(f)

    # 添加圆的信息
    center_list = []
    circles = []

    for center in pattern:
        if center not in center_list:
            center_list.append(center)

    cnt = 0
    for id in center_list:
        circle = {}
        circle['coordinate'] = centroids[id]
        circle['id'] = id
        if cnt == 0:
            circle['type'] = 0
        else:
            circle['type'] = 1
        circles.append(circle)
        cnt += 1

    # 添加曲线信息
    lines = []
    startRegion = []
    for i in range(len(pattern) - 1):
        last = centroids[pattern[i]]
        next = centroids[pattern[i+1]]
        if last in startRegion:
            p = computeCurvePoint(last, next, 1)
        else:
            p = computeCurvePoint(last, next, 0)
        coordinates = [last, p, next]
        startRegion.append(last)
        line = {}
        line['coordinate'] = coordinates
        line['id'] = pattern[i]
        lines.append(line)

    result = {}
    result['circles'] = circles
    result['lines'] = lines

    return json.dumps(result)

# 根据startTime和timeLength获取对应的HighOrder数据


# @app.route('/getHighOrder/<start>/<length>/<region>/<type>', methods=['GET'])
# def _getHighOrder(start, length, region, type):
#     result = gho.getHighOrder(start, length, region)
#     global participates
#     participates = result['regions']

#     return json.dumps(result)


@app.route('/getHighOrderByRegions', methods=['POST'])
def _getHighOrderByRegions():
    regionsId = request.json.get("regionsId")
    startTime = request.json.get("startTime")
    timeLength = request.json.get("timeLength")
    global groupId
    groupId = request.json.get("groupId")

    global group
    group = regionsId

    result = gho.getHighOrder(startTime, timeLength, regionsId, groupId)
    global participates
    participates = result['regions']

    # record all regionsCategory
    global regionsCategory
    regionCategory = {}
    for r in participates:
        arr = []
        arr.append(r)
        if(r >= 100000):
            poi, access = st.statistic(regionsId, startTime, timeLength)
        else:
            poi, access = st.statistic(arr, startTime, timeLength)
        regionCategory[r] = [poi, access]
    regionsCategory.append(regionCategory)

    return json.dumps(result)


# 取overview数据


@app.route('/getOverview/<type>', methods=['GET'])
def _getOverview(type):
    if (type == 'Weekdays'):
        od_data = pd.read_csv("app/static/weekdays.csv")
    else:
        od_data = pd.read_csv("app/static/holidays.csv")

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


@app.route('/getVanAreasMap/<entropy>', methods=['GET'])
def _getVanAreasMap(entropy):
    path = "app/static/nyc_area_threshold_"
    if(entropy == '1'):
        path += "1.8.geojson"
    elif(entropy == '2'):
        path += "2.2.geojson"
    else:
        path += "2.5.geojson"
    # path = "app/static/merged_area_threshold_1.0.geojson"
    with open(path, "r") as f:
        info = json.load(f)
    return json.dumps(info)

# 获取boundary信息


@app.route('/getBoundary', methods=['GET'])
def _getBoundary():
    result = {}

    path = "app/static/merged_area_threshold_1.0_clustering.geojson"
    with open(path, "r") as f:
        info = json.load(f)
    with open('app/static/block_to_community.json', "r") as f:
        belong = json.load(f)

    result['info'] = info
    result['belong'] = belong

    return json.dumps(result)


@app.route('/getMap', methods=['GET'])
def _getMap():
    with open("app/static/map.geojson", "r") as f:
        info = json.load(f)
    return json.dumps(info)

# 根据date获取对应的region flow数据


@app.route('/getRegionFlow', methods=['GET'])
def _getRegionFlow():

    od_data = pd.read_csv("app/static/merged_df_od_duration.csv")

    regionsFlow = {}

    global groupId
    global group

    # compute region flow

    category_map = {'Food': 0,
                    'Shop & Service': 1,
                    'Outdoors & Recreation': 2,
                    'Professional & Other Places': 3,
                    'Travel & Transport': 4,
                    'Nightlife Spot': 5,
                    'Arts & Entertainment': 6,
                    'College & University': 7,
                    'Residence': 8,
                    }

    for p in participates:
        regionsFlow[p] = [0 for x in range(len(category_map))]

    last_time = 0

    for index, row in od_data.iterrows():
        user_id = row['user_id']
        checkin_time = row['checkin_time']
        next_hop_checkin_time = row['next_hop_checkin_time']
        pre_category = row['previous_category']
        next_category = row['next_hop_category']
        pickup_centroid = row['previous_blocks']
        dropoff_centroid = row['next_hop_blocks']

        # 判断当前点的 checkin_time 是否与前一个点的next_hop_checkin_time相同
        # 相同则不重复计算
        if pickup_centroid in participates:
            if (checkin_time != last_time and pre_category != "Event"):
                regionsFlow[pickup_centroid][category_map[pre_category]] += 1
        if dropoff_centroid in participates and next_category != "Event":
            regionsFlow[dropoff_centroid][category_map[next_category]] += 1
        # 考虑group
        if pickup_centroid in group and len(group) > 1:
            if (checkin_time != last_time and pre_category != "Event"):
                regionsFlow[groupId][category_map[pre_category]] += 1
        if dropoff_centroid in group and len(group) > 1:
            if next_category != "Event":
                regionsFlow[groupId][category_map[next_category]] += 1

        last_time = next_hop_checkin_time
    return json.dumps(regionsFlow)


@app.route('/getCheckin/<date>', methods=['GET'])
def _getCheckin(date):
    # 赋值给全局变量
    global dateType
    dateType = date

    if (date == 'Weekdays'):
        filename = "app/static/weekdays_checkin_statistic.json"
    else:
        filename = "app/static/holidays_checkin_statistic.json"

    with open(filename, 'r') as f:
        result = json.load(f)

    return json.dumps(result)


@app.route('/getSankey/<date>/<number>', methods=['GET'])
def _getSankey(date, number):
    def getRegionFlows(data, community_number):
        category_map = {'Food': 0,
                        'Shop & Service': 1,
                        'Outdoors & Recreation': 2,
                        'Professional & Other Places': 3,
                        'Travel & Transport': 4,
                        'Nightlife Spot': 5,
                        'Arts & Entertainment': 6,
                        'College & University': 7,
                        'Residence': 8,
                        }
        regionsFlow = [[0 for _ in range(len(category_map))]
                       for x in range(community_number)]

        last_time = 0

        for index, row in data.iterrows():
            user_id = row['user_id']
            checkin_time = row['checkin_time']
            next_hop_checkin_time = row['next_hop_checkin_time']
            pre_category = row['previous_category']
            next_category = row['next_hop_category']
            pickup_centroid = row['previous_center']
            dropoff_centroid = row['next_hop_center']

            # 判断当前点的 checkin_time 是否与前一个点的next_hop_checkin_time相同
            # 相同则不重复计算

            if (checkin_time != last_time and pre_category != 'Event'):
                regionsFlow[pickup_centroid][category_map[pre_category]] += 1
            if next_category != 'Event':
                regionsFlow[dropoff_centroid][category_map[next_category]] += 1

            last_time = next_hop_checkin_time
        return regionsFlow

    # 赋值给全局变量
    global dateType
    dateType = date

    if (date == 'Weekdays'):
        filename = "app/static/weekdays_overview.json"
        data = pd.read_csv(
            "app/static/weekdays_threshold_1.0_clustering.csv")
    else:
        filename = "app/static/holidays_overview.json"
        data = pd.read_csv(
            "app/static/holidays_threshold_1.0_clustering.csv")

    with open(filename, 'r') as f:
        patterns = json.load(f)

    # 前端传来的参数
    pattern_number = int(number)
    community_number = 19

    # get regions flow
    regionsFlow = getRegionFlows(data, community_number)

    # 确定二阶轨迹和三阶轨迹的数量
    order3_num = int(pattern_number / 3)
    order2_num = pattern_number - order3_num

    order_3 = patterns['order3']
    order_2 = patterns['order2']

    # 排序并取top k的数量
    pattern_time = {}
    pattern_count = {}
    order3_time = {}
    order3_count = {}

    # 排序并选取三阶pattern
    order_time = {}
    order_count = {}
    for i in range(len(order_3)):
        patterns = order_3[i]
        for p in patterns:
            pattern = (p[0], p[1], p[2], p[3])
            count = p[4]
            if pattern not in order_count:
                order_count[pattern] = count
                order_time[pattern] = i + 4
            else:
                if count > order_count[pattern]:
                    order_count[pattern] = count
                    order_time[pattern] = i + 4

    order3_count, order3_time = sort_and_filter(
        order_count, order_time, order3_num)

    # 排序并选取二阶pattern
    order_time = {}
    order_count = {}
    for i in range(len(order_2)):
        patterns = order_2[i]
        for p in patterns:
            pattern = (p[0], p[1], p[2])
            count = p[3]
            if pattern not in order_count:
                order_count[pattern] = count
                order_time[pattern] = i + 4
            else:
                if count > order_count[pattern]:
                    order_count[pattern] = count
                    order_time[pattern] = i + 4

    pattern_count, pattern_time = sort_and_filter(
        order_count, order_time, order2_num)

    # 合并字典并排序
    pattern_count.update(order3_count)
    pattern_time.update(order3_time)
    pattern_count, pattern_time = sort_and_filter(
        pattern_count, pattern_time, pattern_number)

    # 赋予pattern id
    pattern_id = {}
    id = 0
    patterns = []
    flowsCount = []
    for key, value in pattern_count.items():
        pattern_id[key] = id
        id_pattern[id] = key
        patterns.append(key)
        flowsCount.append(value)
        id += 1

    if (date == 'Weekdays'):
        filename = "app/static/overview_weekdays.json"
    else:
        filename = "app/static/overview_holidays.json"

    with open(filename, 'r') as f:
        result = json.load(f)

    return json.dumps(result)


@app.route('/getStatistic', methods=['POST'])
def _getStatistic():
    regionsId = request.json.get("selects")
    startTime = request.json.get("startTime")
    timeLength = request.json.get("timeLength")
    poi, access = st.statistic(regionsId, startTime, timeLength)

    poi_data = []
    access_data = []
    poi_order_poi = []
    poi_order_access = []
    access_order_poi = []
    access_order_access = []

    # Order in category_map
    # Order in count
    poi_order = sorted(poi.items(), key=lambda x: x[1], reverse=True)
    access_order = sorted(access.items(), key=lambda x: x[1], reverse=True)

    for value in poi_order:
        p = {'category': value[0], 'count': value[1]}
        q = {'category': value[0], 'count': access[value[0]]}
        poi_order_poi.append(p)
        poi_order_access.append(q)

    for value in access_order:
        p = {'category': value[0], 'count': value[1]}
        q = {'category': value[0], 'count': poi[value[0]]}
        access_order_access.append(p)
        access_order_poi.append(q)

    global category_map

    for k in category_map.keys():
        if k in poi:
            p = {'category': k, 'count': poi[k]}
            poi_data.append(p)

    for k in category_map.keys():
        if k in access:
            p = {'category': k, 'count': access[k]}
            access_data.append(p)

    return json.dumps([poi_order_poi, poi_order_access, access_order_poi, access_order_access])


# 根据 date和region 获取对应region in and out流量数据


@app.route('/getRegionInOut', methods=['POST'])
def _getRegionInOut():
    def filterByRegion(od_data, region_id):
        id = region_id[0]
        result = od_data[((od_data['previous_blocks'] == id)
                          | (od_data['next_hop_blocks'] == id))
                         & (od_data['previous_blocks'] != od_data['next_hop_blocks'])]
        for i in range(1, len(region_id)):
            id = region_id[i]
            data = od_data[((od_data['previous_blocks'] == id)
                            | (od_data['next_hop_blocks'] == id))
                           & (od_data['previous_blocks'] != od_data['next_hop_blocks'])]
            result = pd.concat([result, data])
        return result

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
            pre_category = row['previous_category']
            next_category = row['next_hop_category']
            pickup_centroid = row['previous_blocks']
            dropoff_centroid = row['next_hop_blocks']

            # check first point of each user to add to in_data
            if (checkin_time != last_time) and (pickup_centroid in regionId):
                in_data[transferTime(checkin_time.split()[
                                     1][:-6], scale)][category_map[pre_category]] += 1

            last_time = next_hop_checkin_time

            # check next_hop_checkin_time to add to in_data
            if dropoff_centroid in regionId:
                in_data[transferTime(next_hop_checkin_time.split()[
                                     1][:-6], scale)][category_map[next_category]] += 1

            # check checkin_time + duration to add to out_data
            time = checkin_time.split()[1][:7]
            seconds = int(time.split(
                ':')[0]) * 3600 + int(time.split(':')[1]) * 60 + int(time.split(':')[2])

            # time + duration 可能是第二天，超过24小时，所以要取余
            total = int(seconds + duration) % (24 * 3600)
            hour = math.floor(total / 3600)
            minute = math.floor(total % 3600 / 60)
            left_time = int(hour / scale) + math.floor(minute / (60 * scale))

            if pickup_centroid in regionId:
                out_data[left_time][category_map[next_category]] += 1

        return [in_data, out_data]

    # main part
    regionsId = request.json.get("selects")
    od_data = pd.read_csv("app/static/merged_df_od_duration.csv")

    # compute region flow
    regionId = regionsId
    region_data = filterByRegion(od_data, regionId)
    result = computeFlow(region_data, category_map, regionId, 48)
    return json.dumps(result)


@app.route('/getSelfOrganization/<start>/<end>/<entropy>', methods=['GET'])
def _getSelfOrganization(start, end, entropy):
    start = int(start)
    end = int(end)
    entropy = float(entropy)
    global dateType

    merged_df_od_duration, merged_area = SO.Self_Organization(
        start, end, entropy_threshold=entropy, dateType=dateType)

    merged_df_od_duration.to_csv("app/static/merged_df_od_duration.csv")
    merged_area.to_csv("app/static/merged_area.csv")

    with open("app/static/merged_area.geojson", "r") as f:
        area = json.load(f)

    regions = pd.read_csv("app/static/merged_area.csv")

    centroids = regions.set_index("traj_key")["centroid"].to_dict()

    for k, v in centroids.items():
        centroids[k] = v[7:-1]

    result = {}
    result['area'] = area
    result['centroids'] = centroids

    return json.dumps(result)


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
