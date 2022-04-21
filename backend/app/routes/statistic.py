import pandas as pd


def statistic(regionId):
    traj = pd.read_csv('app/static/merged_df_od_duration.csv')

    # access statistic
    # filter by regionId
    access = traj[traj['previous_blocks'] ==
                  regionId]['previous_category'].value_counts()

    # filter by time interval

    access = access.to_dict()

    # POI statistic
    POI = traj[traj['previous_blocks'] == regionId].drop_duplicates(
        ['venue_id'])['previous_category'].value_counts()
    POI = POI.to_dict()

    return POI, access


if __name__ == '__main__':
    poi, access = statistic(26226)
    print(poi)
