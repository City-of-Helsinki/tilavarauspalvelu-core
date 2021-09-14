import datetime
from typing import Dict, List

from django.conf import settings

from opening_hours.hours import (
    Period,
    TimeElement,
    get_opening_hours,
    get_periods_for_resource,
)


class OpeningHoursClient:
    def __init__(
        self,
        resources: [str],
        start: datetime.date,
        end: datetime.date,
        single=False,
        init_periods=False,
        init_opening_hours=True,
        hauki_origin_id=None,
    ):
        if single:
            resources = [str(resources)]
        self.start = start
        self.end = end

        if hauki_origin_id:
            self.hauki_origin_id = hauki_origin_id
        else:
            self.hauki_origin_id = settings.HAUKI_ORIGIN_ID

        self.resources = {}

        self.resources = resources
        self.opening_hours = {}
        if init_opening_hours:
            self._init_opening_hours_structure()
            self._fetch_opening_hours(start, end)

        self.periods = {}
        for resource in resources:
            self.periods[resource] = []
        if init_periods:
            for resource in resources:
                periods = get_periods_for_resource(resource)
                for period in periods:
                    self.periods[resource].append(period)

    def _init_opening_hours_structure(self):
        """Opening hours structure is:
        opening_hours = {
            resource_id: {
                            datetime.date: [TimeElement, TimeElement, ...],
                            ....
                        },
            resource_id: { datetime.date: [TimeElement, ...
            ...
        }
        """
        self.opening_hours = {res_id: {} for res_id in self.resources}
        running_date = self.start
        while running_date <= self.end:
            for res_id in self.resources:
                self.opening_hours[res_id].update({running_date: []})
            running_date += datetime.timedelta(days=1)

    def _fetch_opening_hours(self, start: datetime.date, end: datetime.date):
        for hour in get_opening_hours(self.resources, start, end, self.hauki_origin_id):
            res_id = hour["origin_id"]
            self.opening_hours[res_id][hour["date"]].extend(hour["times"])

    def refresh_opening_hours(self):
        self._init_opening_hours_structure()
        self._fetch_opening_hours(self.start, self.end)

    def get_opening_hours_for_resource(self, resource, date) -> [TimeElement]:
        resource = self.opening_hours.get(resource, {})
        times = resource.get(date, [])
        return times

    def get_opening_hours_for_date_range(
        self, resource: str, date_start: datetime.date, date_end: datetime.date
    ) -> Dict[datetime.date, List[TimeElement]]:
        opening_hours = {
            date: times
            for date, times in self.opening_hours.get(resource, {}).items()
            if date >= date_start and date <= date_end and times
        }
        return opening_hours

    def get_resource_periods(self, resource) -> List[Period]:
        return self.periods.get(resource)

    def is_resource_open(
        self, resource: str, start_time: datetime.datetime, end_time: datetime.datetime
    ) -> bool:
        times = self.get_opening_hours_for_resource(resource, start_time.date())
        for time in times:
            if (
                time.start_time <= start_time.time()
                and time.end_time >= end_time.time()
                and (time.end_time_on_next_day or end_time.date() == start_time.date())
            ):
                return True
        return False

    def next_opening_times(
        self, resource: str, date: datetime.date
    ) -> (datetime.date, [TimeElement]):
        times_for_resource = self.opening_hours.get(resource, {})
        times = times_for_resource.get(date)

        running_date = date
        while not times:
            dates = [dt for dt in times_for_resource.keys() if dt > running_date]
            running_date = min(dates) if dates else None
            if not running_date:
                break
            times = times_for_resource.get(running_date)

        return running_date, times
