import datetime
from copy import copy
from datetime import timezone
from typing import Any, Dict, List, Tuple, Union, Optional

from django.conf import settings
from django.utils.timezone import get_default_timezone

from opening_hours.decorators import datetime_args_to_default_timezone
from opening_hours.hours import Period
from opening_hours.hours import State as ResourceState
from opening_hours.hours import TimeElement, get_opening_hours, get_periods_for_resource


TIMEZONE = get_default_timezone()


class OpeningHours:
    start_time: datetime.datetime
    end_time: datetime.datetime
    resource_state: str
    periods: List[int]
    end_time_on_next_day: bool

    def __init__(
        self,
        start_time: datetime.datetime,
        end_time: datetime.datetime,
        resource_state: str,
        periods: List[int],
    ):
        self.start_time = start_time
        self.end_time = end_time
        self.resource_state = resource_state
        self.periods = periods

    def __copy__(self) -> "OpeningHours":
        return OpeningHours(
            start_time=self.start_time,
            end_time=self.end_time,
            resource_state=self.resource_state,
            periods=self.periods,
        )

    @property
    def end_time_on_next_day(self) -> bool:
        return self.end_time.date() > self.start_time.date()

    @classmethod
    def get_opening_hours_class_from_time_element(
        cls,
        time_element: TimeElement,
        date: datetime.date,
        timezone: Union[
            timezone,
            Any,
            Any,
        ],
    ):
        full_day = time_element.full_day or (
            time_element.start_time is None and time_element.end_time is None
        )
        end_time_on_next_day = time_element.end_time_on_next_day or full_day

        start = (
            datetime.time(0)
            if full_day or not time_element.start_time
            else time_element.start_time
        )
        end = (
            datetime.time(0)
            if full_day or not time_element.end_time
            else time_element.end_time
        )
        start_time = datetime.datetime(
            date.year, date.month, date.day, start.hour, start.minute, tzinfo=timezone
        )

        if end_time_on_next_day:
            date += datetime.timedelta(days=1)
        end_time = datetime.datetime(
            date.year, date.month, date.day, end.hour, end.minute, tzinfo=timezone
        )

        # If the length of opening is zero, return None for helping the UI.
        if not end_time_on_next_day and (end_time - start_time) == datetime.timedelta(
            seconds=0
        ):
            return None

        return OpeningHours(
            start_time=start_time.astimezone(TIMEZONE),
            end_time=end_time.astimezone(TIMEZONE),
            resource_state=time_element.resource_state,
            periods=time_element.periods,
        )


class OpeningHoursClient:
    def __init__(
        self,
        resources: List[str],
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
                            datetime.date: [OpeningHours, OpeningHours, ...],
                            ....
                        },
            resource_id: { datetime.date: [OpeningHours, ...
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
            timezone = hour["timezone"]
            date = hour["date"]
            opening_hours = []
            for time in hour["times"]:
                opening_times = OpeningHours.get_opening_hours_class_from_time_element(
                    time, date, timezone
                )
                if opening_times:
                    opening_hours.append(opening_times)

            opening_hours = self._split_opening_hours_based_on_closed_states(
                opening_hours
            )

            self.opening_hours[res_id][date].extend(opening_hours)

    def _split_opening_hours_based_on_closed_states(
        self,
        opening_hours: list[OpeningHours],
    ) -> list[OpeningHours]:
        # TODO: Periods?
        hours: list[OpeningHours] = []

        chronological_opening_hours = sorted(opening_hours, key=lambda x: x.start_time)

        tracked_reservable_hours: Optional[OpeningHours] = None
        tracked_closed_hours: Optional[OpeningHours] = None

        # Go through all given open and closed hours in chronological order.
        # Keep track of open and closed hours, and slice them appropriately
        # to form a continuous timeline.
        for opening_hour in chronological_opening_hours:
            reservable_state = ResourceState(opening_hour.resource_state)
            start_time = opening_hour.start_time
            end_time = opening_hour.end_time

            # If the tracked reservable or closed hours end before this
            # opening hour starts, the tracked hours can be moved to the
            # finished hours.
            # ----------
            #  oooo
            #       ****  Reservable hours end before next reservable/closed hours start
            # ----------
            #  xxxx
            #       ****  Closed hours end before next reservable/closed hours start
            # ----------
            if tracked_reservable_hours and tracked_reservable_hours.end_time < start_time:
                hours.append(tracked_reservable_hours)
                tracked_reservable_hours = None
            if tracked_closed_hours and tracked_closed_hours.end_time < start_time:
                hours.append(tracked_closed_hours)
                tracked_closed_hours = None

            if reservable_state.is_open:
                if tracked_closed_hours is not None:
                    # If the tracked closed hours end after the current reservable
                    # opening hours start, the current opening hours should be
                    # shortened so that they start when the tracked closed hours end.
                    # ---------------------------
                    #  xxxx       -> xxxx
                    #     ooooo   ->     oooo     Shortened
                    # ---------------------------
                    #  xxxx       -> xxxx
                    #      oooo   ->     oooo     Special case also handled
                    # ---------------------------
                    #
                    # If the current opening hours would be zero or negative
                    # in length afterward, the current opening hours are skipped.
                    # ---------------------------
                    #  xxxxxxxxx  -> xxxxxxxxx
                    #     ooooo   ->              Skipped
                    # ---------------------------
                    start_time = opening_hour.start_time = tracked_closed_hours.end_time
                    if start_time >= end_time:
                        continue

                # If there aren't tracked reservable hours yet,
                # start tracking the current one
                if tracked_reservable_hours is None:
                    tracked_reservable_hours = opening_hour
                    continue

                # If the tracked reservable hours end before the current
                # reservable hours, extend the tracked reservable hours.
                # ---------------------------
                #  oooooo     -> ooooooooo
                #      ooooo  ->              Combined
                # ---------------------------
                #  oooo       -> ooooooooo
                #      ooooo  ->              Continued
                # ---------------------------
                elif tracked_reservable_hours.end_time < end_time:
                    tracked_reservable_hours.end_time = end_time

            elif reservable_state.is_closed:
                if tracked_reservable_hours is not None:
                    # If the tracked reservable hours end after the current
                    # closed hours start, the current reservable hours should
                    # be shortened so that they end when the closed hours start.
                    # The tracked opening hours should then be closed, since
                    # subsequent opening times cannot overlap with it.
                    # ---------------------------
                    #  ooooo      -> ooo
                    #     xxxxx   ->    xxxxx     Shortened
                    # ---------------------------
                    #
                    # If the tracked reservable hours end after the current
                    # closed hours end, new tracked opening should be created
                    # starting from the end time of the current closed hours.
                    # The tracked opening hours should then be closed, since
                    # subsequent opening times cannot overlap with it, and the
                    # newly created opening hours set as the tracked ones.
                    # ---------------------------
                    #  ooooooooo  -> ooo     o
                    #     xxxxx   ->    xxxxx      Sliced
                    # ---------------------------
                    new_reservable_hours: Optional[OpeningHours] = None
                    if tracked_reservable_hours.end_time > end_time:
                        new_reservable_hours = copy(tracked_reservable_hours)
                        new_reservable_hours.start_time = end_time

                    tracked_reservable_hours.end_time = start_time
                    hours.append(tracked_reservable_hours)
                    tracked_reservable_hours = new_reservable_hours

                # If there aren't tracked closed hours yet,
                # start tracking the current one
                if tracked_closed_hours is None:
                    tracked_closed_hours = opening_hour
                    continue

                # If the tracked closed hours end before the current
                # closed hours, extend the tracked closed hours.
                # ---------------------------
                #  xxxxxx     -> xxxxxxxxx
                #      xxxxx  ->              Combined
                # ---------------------------
                #  xxxx       -> xxxxxxxxx
                #      xxxxx  ->              Continued
                # ---------------------------
                elif tracked_closed_hours.end_time < end_time:
                    tracked_closed_hours.end_time = end_time

            else:
                # Not open or closed, add as is
                hours.append(opening_hour)

        if tracked_reservable_hours:
            hours.append(tracked_reservable_hours)
        if tracked_closed_hours:
            hours.append(tracked_closed_hours)

        # Sort the hours once more to ensure they are in correct order.
        hours = sorted(hours, key=lambda x: x.start_time)

        return hours

    def refresh_opening_hours(self):
        self._init_opening_hours_structure()
        self._fetch_opening_hours(self.start, self.end)

    def get_opening_hours_for_resource(self, resource, date) -> List[OpeningHours]:
        resource = self.opening_hours.get(resource, {})
        times = resource.get(date, [])
        return times

    def get_opening_hours_for_date_range(
        self, resource: str, date_start: datetime.date, date_end: datetime.date
    ) -> Dict[datetime.date, List[OpeningHours]]:
        opening_hours = {
            date: times
            for date, times in self.opening_hours.get(resource, {}).items()
            if date >= date_start and date <= date_end and times
        }
        return opening_hours

    def get_resource_periods(self, resource) -> List[Period]:
        return self.periods.get(resource)

    @datetime_args_to_default_timezone
    def is_resource_open_for_reservations(
        self, resource: str, start_time: datetime.datetime, end_time: datetime.datetime
    ) -> bool:
        times = self.get_opening_hours_for_resource(resource, start_time.date())
        for time in times:
            if ResourceState(time.resource_state).is_closed:
                continue

            open_full_day = not time.start_time and not time.end_time
            if (
                open_full_day
                or time.start_time <= start_time
                and (time.end_time >= end_time or time.end_time_on_next_day)
            ):
                return True
        return False

    def next_opening_times(
        self, resource: str, date: datetime.date
    ) -> Tuple[datetime.date, List[OpeningHours]]:
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
