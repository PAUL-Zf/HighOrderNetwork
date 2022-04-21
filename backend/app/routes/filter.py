import pandas as pd
import holidays
import datetime
import os


def filter(date_and_time):
    date = date_and_time.split()[0]
    us_holidays = holidays.US()
    christmas = ['2012-12-26', '2012-12-27', '2012-12-28', '2012-12-29', '2012-12-30', '2012-12-31',
                 '2013-12-26', '2013-12-27', '2013-12-28', '2013-12-29', '2013-12-30', '2013-12-31',
                 '2014-12-26', '2014-12-27', '2014-12-28', '2014-12-29', '2014-12-30', '2014-12-31']

    weekno = datetime.datetime.strptime(date, '%Y-%m-%d').weekday()
    if date in us_holidays or date in christmas:
        return False
    elif weekno >= 5:
        return False
    else:
        return True


if __name__ == '__main__':
    print(os.getcwd())
    od_data = pd.read_csv('backend/app/static/df_od_duration_large_nyc.csv')
    print(len(od_data))

    weekday = od_data[od_data['checkin_time'].apply(lambda x: filter(x))]
    holiday = od_data[~(od_data['checkin_time'].apply(lambda x: filter(x)))]

    weekday.to_csv(
        'backend/app/static/df_od_duration_large_nyc_weekdays.csv', index=False)
    holiday.to_csv(
        'backend/app/static/df_od_duration_large_nyc_holidays.csv', index=False)

    print("Finish filtering!")
