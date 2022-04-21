# coding=gbk

import pandas as pd
import json
import math
import copy
from shapely.geometry import LineString
from shapely.geometry import Point
import matplotlib.pyplot as plt


def getHighOrder(start, length, region, type):
    start = int(start)
    slot_length = int(length)
    regionId = int(region)
    date = type
    slotNum = 48

    scale = 24 / slotNum
    time_slots = [x for x in range(start, start + slot_length)]

    if (date == 'Weekdays'):
        od_data = pd.read_csv("app/static/merged_df_od_duration.csv")
    else:
        od_data = pd.read_csv("app/static/merged_df_od_duration.csv")

    # count all regions Id
    # reset index
    pre_regions = od_data['previous_blocks'].unique().tolist()
    next_regions = od_data['next_hop_blocks'].unique().tolist()
    all_regions = list(set(pre_regions + next_regions))

    id_to_index = {}
    index_to_id = {}

    for i in range(len(all_regions)):
        id = all_regions[i]
        id_to_index[id] = i
        index_to_id[i] = id

    # 根据 checkin_time, (checkin_time + duration), next_hop_checkin_time 初步筛选轨迹
    trajectory = []
    for index, row in od_data.iterrows():
        user_id = row['user_id']
        checkin_time = row['checkin_time']
        next_hop_checkin_time = row['next_hop_checkin_time']
        duration = row['duration']
        pre_category = row['previous_category']
        next_category = row['next_hop_category']
        pickup_centroid = row['previous_blocks']
        dropoff_centroid = row['next_hop_blocks']

        checkin_slot = transferTime(checkin_time.split()[1][:-6], scale)
        next_hop_checkin_slot = transferTime(
            next_hop_checkin_time.split()[1][:-6], scale)
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
            pickup_centroid = row['previous_blocks']

            checkin_slot = transferTime(checkin_time.split()[1][:-6], scale)
            next_hop_checkin_slot = transferTime(
                next_hop_checkin_time.split()[1][:-6], scale)
            left_slot = computeLeftTime(checkin_time, duration, scale)

            region_traj.append(pickup_centroid)
            if(pickup_centroid == regionId) and (checkin_slot in time_slots or left_slot in time_slots):
                in_region.append(count)
            count += 1

            dropoff_centroid = row['next_hop_blocks']
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

    # print(len(abstract_data))

    # 统计一阶数据

    valid_order = {}    # 记录所有有效的路径（KLD < threshold）
    valid_kld = {}      # 记录所有有效的路径的KLD（KLD < threshold）
    region_number = len(all_regions)
    order_1 = {}
    threshold = 0.001    # KLD散度的阈值

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
            order_1[path][id_to_index[dest]] += 1

    # 筛选掉没有下一点的轨迹
    abstract_data = valid
    # print("---------------")
    # print(abstract_data)

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
            order_2[path][id_to_index[dest]] += 1

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
            order_3[path][id_to_index[dest]] += 1

    # print("order3 detect")
    # for k,v in order_3.items():
    #     for value in v:
    #         if(value > 1):
    #             print(k)

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
            order_4[path][id_to_index[dest]] += 1

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
    top = 4
    index = 0
    for k, v in sort_entropy.items():
        if(index >= top):
            break
        result[k] = valid_order[k]
        index += 1

    # check entropy
    result_entropy = {}
    for k, v in result.items():
        result_entropy[k] = valid_entropy[k]
    # print(result_entropy)

    # create id_to_coordinate
    regions = pd.read_csv("app/static/merged_area.csv")
    centroids = regions.set_index("traj_key")["centroid"].to_dict()

    for k, v in centroids.items():
        centroids[k] = [float(v[7:-1].split(" ")[1]),
                        float(v[7:-1].split(" ")[0])]

    # 整理数据格式
    count = 0
    highOrder = []
    circles = []
    lines = []
    for k, v in result.items():
        r = k.split("_")[:-1]
        coord = []
        for id in r:
            circle = {}
            circle['coordinate'] = centroids[int(id)]
            circle['radius'] = count
            circles.append(circle)

            coord.append(centroids[int(id)])
        for i in range(len(v)):
            if v[i]:
                c = copy.deepcopy(coord)
                c.append(centroids[index_to_id[i]])
                h = {}
                h['id'] = count
                h['order'] = len(c) - 1
                h['coordinate'] = c
                highOrder.append(h)

                circle = {}
                circle['coordinate'] = centroids[index_to_id[i]]
                circle['radius'] = count
                circles.append(circle)

        count += 1
    
    for h in highOrder:
        points = h['coordinate']
        for i in range(len(points) - 1):
            last = points[i]
            next = points[i+1]
            p = computeCurvePoint(last, next)
            coordinates = [last, p, next]
            line = {}
            line['coordinate'] = coordinates
            line['id'] = h['id']
            lines.append(line)

    # # 统计所有参与绘制的region，以及最大半径的级别
    # region_list = []
    # region_level = {}    # 记录每个region的最大半径level
    # level = 0    # level越小半径越大
    # for k, v in result.items():
    #     for region in k.split('_')[:-1]:
    #         region = int(region)
    #         if region not in region_list:
    #             region_list.append(region)
    #             region_level[region] = level
    #     for i in range(len(v)):
    #         id = index_to_id[i]
    #         if id not in region_list and v[i] != 0:
    #             region_list.append(id)
    #             region_level[id] = level
    #     level += 1

    # # 计算所有参与绘制的region间连线的最短距离
    # min = computeDistance(centroids[region_list[0]], centroids[region_list[1]])
    # for i in range(len(region_list) - 1):
    #     for j in range(i + 1, len(region_list)):
    #         x = centroids[region_list[i]]
    #         y = centroids[region_list[j]]
    #         distance = computeDistance(x, y)
    #         min = min < distance and min or distance

    # # 最大半径的确定，取最短直线距离的 1/4
    # maxRadius = min / 3
    # u = maxRadius / 4    # 偏移量
    # difference = maxRadius / 5
    # radius_level = []
    # for i in range(5):
    #     radius_level.append(maxRadius - i * difference)

    # # 建立字典，键为id，值为横坐标
    # xcoords = {}
    # for id in region_list:
    #     xcoords[id] = centroids[id][0]
    # sorted_coords = sorted(xcoords.items(), key=lambda kv: (kv[1], kv[0]))

    # # 遍历轨迹的所有点
    # for h in highOrder:
    #     pattern = h['coordinate']
    #     w = radius_level[h['id']] * 0.6    # line width
    #     newLine = []    # store new points include added offset point

    #     count = 1

    #     last = pattern[0]
    #     newLine.append(last)
    #     while(count < len(pattern)):
    #         next = pattern[count]
    #         direction = (last[0] < next[0]) and 1 or 0
    #         judge = False
    #         if direction:
    #             # 从前往后遍历
    #             for i in range(len(sorted_coords)):
    #                 id = sorted_coords[i][0]
    #                 c = centroids[id]
    #                 r = radius_level[region_level[id]]
    #                 x = last
    #                 y = next
    #                 # 如果遍历的点是起点或终点中的一个，则跳过
    #                 if(c[0] == x[0] and c[1] == x[1]) or (c[0] == y[0] and c[1] == y[1]):
    #                     continue
    #                 judge = checkIntersection(c, r, x, y, w)
    #                 if(judge):
    #                     offsetPoint = computeOffset(x, c, r, w, u)
    #                     newLine.append(offsetPoint)
    #                     last = offsetPoint
    #                     break
    #             if not judge:
    #                 newLine.append(next)
    #                 last = next
    #                 count += 1
    #         else:
    #             # 从后往前遍历
    #             for i in range(len(pattern) - 1, -1, -1):
    #                 id = sorted_coords[i][0]
    #                 c = centroids[id]
    #                 r = radius_level[region_level[id]]
    #                 x = last
    #                 y = next
    #                 # 如果遍历的点是起点或终点中的一个，则跳过
    #                 if(c[0] == x[0] and c[1] == x[1]) or (c[0] == y[0] and c[1] == y[1]):
    #                     continue
    #                 judge = checkIntersection(c, r, x, y, w)
    #                 if(judge):
    #                     offsetPoint = computeOffset(x, c, r, w, u)
    #                     newLine.append(offsetPoint)
    #                     last = offsetPoint
    #                     break
    #             if not judge:
    #                 newLine.append(next)
    #                 last = next
    #                 count += 1

    #     h['coordinate'] = newLine

    result = {}
    result['lines'] = lines
    result['circles'] = circles
    return result


def computeCurvePoint(x, y):
    x0 = (y[0] - x[0]) / 2
    y0 = (y[1] - x[1]) / 2
    x1 = 3 ** 0.5 / 2 * x0 - y0 / 2
    y1 = 3 ** 0.5 / 2 * y0 + x0 / 2
    return [x[0] + x1, x[1] + y1]


# compute offset point
def computeOffset(x, y, r, w, u):
    # x0,y0是终点到起点的向量绕终点顺时针旋转90度的坐标
    x0 = x[1] - y[1]
    y0 = y[0] - x[0]
    scale = (r + w + u) / computeDistance(x, y)
    x1 = x0 * scale + y[0]
    y1 = y0 * scale + y[1]
    return [x1, y1]

# 判断直线和圆是否相交


def checkIntersection(c, r, x, y, width):
    c = Point(c[0], c[1]).buffer(r)
    l = LineString([(x[0], x[1]), (y[0], y[1])]).buffer(width)
    return c.intersects(l)


def computeDistance(x, y):
    return math.sqrt(math.pow((x[0] - y[0]), 2) + math.pow((x[1] - y[1]), 2))


def transferTime(time, scale):
    time = time.split(':')
    hour = int(time[0])
    minute = int(time[1])
    return int(hour / scale) + math.floor(minute / (60 * scale))


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

    # compute KLD
    if(sum_high == 0):
        return KLD

    # For the destination is only one place
    if(len(nonzero_high) == 1):
        if(nonzero_high[0] > 1):
            return 1

    for i in range(len(nonzero_high)):
        p_high = nonzero_high[i] / sum_high
        p_low = nonzero_low[i] / sum_low
        KLD += p_high * math.log(p_high) - p_high * math.log(p_low)
    return KLD


def computeEntropy(data):
    # filter nonzero value
    sum = 0
    nonzero_data = []
    entropy = 0
    for d in data:
        if(d == 0):
            continue
        sum += d
        nonzero_data.append(d)

    # compute entropy
    if sum == 0:
        return 0
    for d in nonzero_data:
        entropy += (-1) * (d / sum) * math.log(d / sum, 2)
    return entropy


if __name__ == '__main__':
    result = getHighOrder(6, 10, 26242, 'Weekdays')
    print(result)

    # # create id_to_coordinate
    # regions = pd.read_csv("backend/app/static/merged_area.csv")
    # centroids = regions.set_index("traj_key")["centroid"].to_dict()

    # for k, v in centroids.items():
    #     centroids[k] = [float(v[7:-1].split(" ")[0]),
    #                     float(v[7:-1].split(" ")[0])]

    # # count all regions Id
    # # reset index
    # od_data = pd.read_csv("backend/app/static/merged_df_od_duration.csv")
    # pre_regions = od_data['previous_blocks'].unique().tolist()
    # next_regions = od_data['next_hop_blocks'].unique().tolist()
    # all_regions = list(set(pre_regions + next_regions))

    # id_to_index = {}
    # index_to_id = {}

    # for i in range(len(all_regions)):
    #     id = all_regions[i]
    #     id_to_index[id] = i
    #     index_to_id[i] = id

    # # merged area traj_key should contain all blocks in df_od
    # for k, v in id_to_index.items():
    #     if k not in centroids.keys():
    #         print(k)

    # print("Finish!")
    # print(id_to_index[827])
