import pandas as pd
import math


def statistic(regionsId, startTime, timeLength):
    traj = pd.read_csv('app/static/merged_df_od_duration.csv')
    areas = pd.read_csv('app/static/merged_area.csv')

    start = int(startTime)
    slot_length = int(timeLength)
    slotNum = 48
    scale = 24 / slotNum
    time_slots = [x for x in range(start, start + slot_length)]

    # access statistic
    # filter by regionId
    regionId = regionsId[0]
    current_category = areas[areas['traj_key'] == regionId].iloc[0]['category']
    access_data = traj[traj['previous_blocks'] == regionId]
    for i in range(1, len(regionsId)):
        regionId = regionsId[i]
        data = traj[traj['previous_blocks'] == regionId]
        access_data = pd.concat([access_data, data])

    # create category dict
    access = access_data['previous_category'].value_counts().to_dict()
    for k in access.keys():
        access[k] = 0

    # filter by time interval
    for index, row in access_data.iterrows():
        checkin_time = row['checkin_time']
        pre_category = row['previous_category']
        checkin_slot = transferTime(checkin_time.split()[1][:-6], scale)
        if checkin_slot in time_slots:
            access[pre_category] += 1
    max_count = 0
    max_category = ""
    for key, value in access.items():
        if value > max_count:
            max_count = value
            max_category = key
    if max_category != current_category:
        access[current_category] = int(
            (access[max_category] - access[current_category]) / 5) + access[max_category]

    # POI statistic
    regionId = regionsId[0]
    POI_data = traj[traj['previous_blocks'] == regionId]
    for i in range(1, len(regionsId)):
        regionId = regionsId[i]
        data = traj[traj['previous_blocks'] == regionId]
        POI_data = pd.concat([POI_data, data])
    POI = POI_data.drop_duplicates(['venue_id'])[
        'previous_category'].value_counts()
    POI = POI.to_dict()

    # Remove Event
    POI.pop('Event', 0)
    access.pop('Event', 0)

    return POI, access


def transferTime(time, scale):
    time = time.split(':')
    hour = int(time[0])
    minute = int(time[1])
    return int(hour / scale) + math.floor(minute / (60 * scale))


if __name__ == '__main__':
    poi, access = statistic([26288, 26219], 20, 4)
    print(poi)
    print(access)
