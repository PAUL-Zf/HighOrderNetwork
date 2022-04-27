import pandas as pd

if __name__ == '__main__':
    regionsId = [26291, 26207]
    data = pd.read_csv("backend/app/static/merged_df_od_duration.csv")

    data['previous_blocks'] = data['previous_blocks'].apply(
        lambda x: x in regionsId and 1 or x)

    data['next_hop_blocks'] = data['next_hop_blocks'].apply(
        lambda x: x in regionsId and 1 or x)

    print(data.head())
