import pandas as pd
import math


def statistic(regionsId, startTime, timeLength):
    traj = pd.read_csv('app/static/merged_df_od_duration.csv')

    start = int(startTime)
    slot_length = int(timeLength)
    slotNum = 48
    scale = 24 / slotNum
    time_slots = [x for x in range(start, start + slot_length)]

    # access statistic
    # filter by regionId
    regionId = regionsId[0]
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
    POI.pop('Event')
    access.pop("Event")

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
