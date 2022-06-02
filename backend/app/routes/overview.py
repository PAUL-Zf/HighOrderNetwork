import pandas as pd
import json


def getSankey(date, number):
    # 赋值给全局变量
    global dateType
    dateType = date

    if (date == 'Weekdays'):
        filename = "backend/app/static/weekdays_overview.json"
        data = pd.read_csv(
            "backend/app/static/weekdays_threshold_1.0_clustering.csv")
    else:
        filename = "backend/app/static/holidays_overview.json"
        data = pd.read_csv(
            "backend/app/static/holidays_threshold_1.0_clustering.csv")

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
    id_pattern = {}
    id = 0
    patterns = []
    flowsCount = []
    for key, value in pattern_count.items():
        pattern_id[key] = id
        id_pattern[id] = key
        patterns.append(key)
        flowsCount.append(value)
        id += 1

    rect_record = [[{}] * pattern_number for i in range(3)]

    # 计算rects
    rects = []
    heatMap = []
    for i in range(1, 4):
        coord = 0
        for key, value in pattern_count.items():
            rect = {}
            rect['id'] = pattern_id[key]
            rect['order'] = i - 1
            rect['width'] = pattern_count[key]
            rect['x'] = coord
            rect['time'] = pattern_time[key]
            rect['length'] = (pattern_count[key] % 3 + 1) * 2

            if(len(key) > i):
                rects.append(rect)

                # Heat Map
                start = key[i - 1]
                end = key[i]
                flows = getHeatMapData(data, start, end)
                maxCount = max(flows)
                minCount = min(flows)

                for j in range(24):
                    h = {}
                    h['id'] = pattern_id[key]
                    h['order'] = i - 1
                    h['width'] = pattern_count[key]
                    h['x'] = coord
                    h['time'] = pattern_time[key]
                    h['length'] = (pattern_count[key] % 3 + 1) * 2
                    h['index'] = j
                    h['count'] = flows[j]
                    h['max'] = maxCount
                    h['min'] = minCount
                    heatMap.append(h)

                r = {}
                r['x'] = rect['x'] + rect['width']/2
                r['index'] = rect['id']
                rect_record[rect['order']][rect['id']] = r

            coord += pattern_count[key]

    # 计算 timeRects
    timeRects = []
    coord = 0
    for key, value in pattern_count.items():
        timeRect = {}
        timeRect['id'] = pattern_id[key]
        timeRect['time'] = pattern_time[key]
        timeRect['length'] = (pattern_count[key] % 3 + 1) * 2
        timeRect['width'] = pattern_count[key]
        timeRect['x'] = coord

        timeRects.append(timeRect)
        coord += pattern_count[key]

    # 计算flow_sum
    flow_sum = 0
    for value in pattern_count.values():
        flow_sum += value

    # 计算node位置，按community排列

    node_record = [[{}] * pattern_number for i in range(4)]
    nodes = []

    for i in range(4):
        node_count = [[] * community_number for _ in range(community_number)]
        for c in pattern_count.keys():
            if(len(c) > i):
                community = c[i]
                node_count[community].append(c)

        # 按community顺序添加node
        index = 0
        coord = 0
        for j in range(community_number):
            community = node_count[j]
            for c in community:
                node = {}
                node['id'] = pattern_id[c]
                node['order'] = i
                node['community'] = j
                node['width'] = pattern_count[c]
                node['x'] = coord
                node['index'] = index
                node['time'] = pattern_time[c]
                node['length'] = (pattern_count[c] % 3 + 1) * 2

                n = {}
                n['x'] = node['x'] + node['width']/2
                n['index'] = index
                node_record[node['order']][node['id']] = n

                nodes.append(node)
                coord += pattern_count[c]
            if community:
                index += 1

    # merge all nodes which belong to the same region
    regions = []
    last = nodes[0]
    width = last['width']
    x = last['x']
    index = last['index']
    order = last['order']
    community = last['community']
    for i in range(1, len(nodes)):
        now = nodes[i]

        if(now['index'] != last['index'] or now['order'] != last['order']):
            r = {}
            r['index'] = index
            r['width'] = width
            r['x'] = x
            r['order'] = order
            r['community'] = community
            regions.append(r)

            width = now['width']
            index = now['index']
            x = now['x']
            order = now['order']
            community = now['community']
        else:
            width += now['width']

        last = now
    finalRegion = {}
    finalRegion['index'] = index
    finalRegion['width'] = width
    finalRegion['x'] = x
    finalRegion['order'] = order
    finalRegion['community'] = community
    regions.append(finalRegion)

    # 计算links
    links = []
    id = 0
    for pattern in pattern_count.keys():
        for i in range(len(pattern) - 1):
            link = {}
            start = node_record[i][id]
            end = rect_record[i][id]
            link['id'] = id
            link['order'] = i
            link['type'] = 0
            link['startX'] = start['x']
            link['startIndex'] = start['index']
            link['endX'] = end['x']
            link['endIndex'] = end['index']
            links.append(link)

            link = {}
            start = rect_record[i][id]
            end = node_record[i+1][id]
            link['id'] = id
            link['order'] = i
            link['type'] = 1
            link['startX'] = start['x']
            link['startIndex'] = start['index']
            link['endX'] = end['x']
            link['endIndex'] = end['index']
            links.append(link)
        id += 1

    result = {}
    result['patterns'] = patterns
    result['flows'] = flowsCount
    result['regionsFlow'] = regionsFlow
    result['sum'] = flow_sum
    result['nodes'] = nodes
    result['regions'] = regions
    result['rects'] = rects
    result['timeRects'] = timeRects
    result['links'] = links
    result['heatMap'] = heatMap

    return result


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


def getHeatMapData(data, start, end):
    between = data[(data['previous_center'] == start)
                   & (data['next_hop_center'] == end)]
    between.checkin_time = pd.to_datetime(between.checkin_time)
    flows = [0 for x in range(24)]
    for i in range(24):
        count = len(between[(between.checkin_time.dt.hour >= i) & (
            between.checkin_time.dt.hour < i+1)])
        flows[i] = count
    return flows


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


def getData(date):
    if (date == 'Weekdays'):
        filename = "backend/app/static/overview_weekdays.json"
    else:
        filename = "backend/app/static/overview_weekends.json"

    with open(filename, 'r') as f:
        result = json.load(f)

    if (date == 'Weekdays'):
        filename = "backend/app/static/weekdays_overview_patterns.json"
    else:
        filename = "backend/app/static/holidays_overview_patterns.json"

    with open(filename, 'r') as f:
        info = json.load(f)

    patterns = result['patterns']
    stat = []
    heatmaps = []
    for pattern in patterns:
        heatmap = []
        if(len(pattern) == 3):
            stat = info['pattern2']
            for i in range(24):
                interval = stat[i]
                for p in interval:
                    if(p[0] == pattern[0] and p[1] == pattern[1] and p[2] == pattern[2]):
                        heatmap.append(p[3])
        else:
            stat = info['pattern3']
            for i in range(24):
                interval = stat[i]
                for p in interval:
                    if(p[0] == pattern[0] and p[1] == pattern[1] and p[2] == pattern[2] and p[3] == pattern[3]):
                        heatmap.append(p[4])
        heatmaps.append(heatmap)

    result['distribution'] = heatmaps
    print(heatmaps)

    return result


if __name__ == '__main__':
    result = getData('Holidays')

    with open("backend/app/static/overview_holidays.json", "w") as f:
        json.dump(result, f)
