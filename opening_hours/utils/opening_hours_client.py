import datetime
from copy import copy
from typing import Any, Optional

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
    periods: Optional[list[int]]
    end_time_on_next_day: bool

    def __init__(
        self,
        start_time: datetime.datetime,
        end_time: datetime.datetime,
        resource_state: str,
        periods: list[int],
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

    def extend(self, other: "OpeningHours") -> None:
        self.end_time = other.end_time
        if other.periods:
            if self.periods is None:
                self.periods = other.periods
            else:
                self.periods += other.periods

    @classmethod
    def get_opening_hours_class_from_time_element(
        cls,
        time_element: TimeElement,
        date: datetime.date,
        timezone: datetime.timezone | Any,
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
        resources: list[str],
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
        hours: list[OpeningHours] = []

        chronological_opening_hours = sorted(opening_hours, key=lambda x: x.start_time)

        tracked_reservable_hours: dict[ResourceState, Optional[OpeningHours]] = {}
        tracked_closed_hours: dict[ResourceState, Optional[OpeningHours]] = {}

        # Go through all given open and closed hours in chronological order.
        # Keep track of open and closed hours, and slice them appropriately
        # to form a continuous timeline.
        for opening_hour in chronological_opening_hours:
            reservable_state = ResourceState(opening_hour.resource_state)

            # If tracked reservable or closed hours end before this
            # opening hour starts, the tracked hours can be moved to the
            # finished hours.
            # ----------
            #  oooo
            #       ****  Reservable hours end before next reservable/closed hours start
            # ----------
            #  xxxx
            #       ****  Closed hours end before next reservable/closed hours start
            # ----------
            hours += self._prune_tracked_hours(
                tracked_reservable_hours,
                opening_hour.start_time,
            )
            hours += self._prune_tracked_hours(
                tracked_closed_hours,
                opening_hour.start_time,
            )

            if reservable_state.is_open:
                self._handle_reservable_hours_split(
                    opening_hour,
                    reservable_state,
                    tracked_closed_hours,
                    tracked_reservable_hours,
                )

            elif reservable_state.is_closed:
                self._handle_closed_hours_split(
                    hours,
                    opening_hour,
                    reservable_state,
                    tracked_closed_hours,
                    tracked_reservable_hours,
                )

            else:
                # Not open or closed, add as is.
                hours.append(opening_hour)

        # Add remaining tracked hours to the finished hours.
        for tracked_hours in tracked_reservable_hours.values():
            if tracked_hours is None:
                continue
            hours.append(tracked_hours)
        for tracked_hours in tracked_closed_hours.values():
            if tracked_hours is None:
                continue
            hours.append(tracked_hours)

        # Sort the hours once more to ensure they are in correct order.
        hours = sorted(hours, key=lambda x: x.start_time)

        return hours

    @staticmethod
    def _handle_reservable_hours_split(
        opening_hour: OpeningHours,
        reservable_state: ResourceState,
        tracked_closed_hours: dict[ResourceState, Optional[OpeningHours]],
        tracked_reservable_hours: dict[ResourceState, Optional[OpeningHours]],
    ) -> None:
        reservable_hours = tracked_reservable_hours.get(reservable_state)

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
        #
        # If there are multiple tracked closed hours,
        # we can simplify the logic by looking at the one
        # which ends the latest.
        # ---------------------------
        #     xxx      ->    xxx
        #  xxxxx       -> xxxxx
        #    xxxxx     ->   xxxxx     Only this is compared
        #     ooooo    ->        o
        # ---------------------------
        opening_hour.start_time = max(
            (hour.end_time for hour in tracked_closed_hours.values()),
            default=opening_hour.start_time,
        )
        if opening_hour.start_time >= opening_hour.end_time:
            return

        # If there aren't tracked reservable hours
        # of this state yet, start tracking the current one.
        if reservable_hours is None:
            tracked_reservable_hours[reservable_state] = opening_hour
            return

        # If any of the tracked reservable hours have the same state as
        # the current reservable hours, and they end before the current
        # reservable hours, extend that tracked reservable hours.
        # ---------------------------
        #  oooooo     -> ooooooooo
        #      ooooo  ->              Combined
        # ---------------------------
        #  oooo       -> ooooooooo
        #      ooooo  ->              Continued
        # ---------------------------
        elif reservable_hours.end_time < opening_hour.end_time:
            reservable_hours.extend(opening_hour)

    @staticmethod
    def _handle_closed_hours_split(
        hours: list[OpeningHours],
        opening_hour: OpeningHours,
        reservable_state: ResourceState,
        tracked_closed_hours: dict[ResourceState, Optional[OpeningHours]],
        tracked_reservable_hours: dict[ResourceState, Optional[OpeningHours]],
    ) -> None:
        closed_hours = tracked_closed_hours.get(reservable_state)

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
        #
        # If there are multiple tracked reservable hours which overlap
        # with the current closed hours, all of them are handled.
        # ---------------------------
        #     ooooo   ->               Gone
        #   ooooo     ->  oo           Shortened start
        #        ooo  ->         o     Shortened end
        #  ooooooooo  -> ooo     o     Sliced
        #     xxxxx   ->    xxxxx
        # ---------------------------
        for state, tracked_hours in tracked_reservable_hours.items():
            new_reservable_hours: Optional[OpeningHours] = None
            if tracked_hours.end_time > opening_hour.end_time:
                new_reservable_hours = copy(tracked_hours)
                new_reservable_hours.start_time = opening_hour.end_time

            tracked_hours.end_time = opening_hour.start_time
            if tracked_hours.start_time < tracked_hours.end_time:
                hours.append(tracked_hours)
            tracked_reservable_hours[state] = new_reservable_hours

        # If there aren't tracked closed hours of this state yet,
        # start tracking the current one.
        if closed_hours is None:
            tracked_closed_hours[reservable_state] = opening_hour
            return

        # If any of the tracked closed hours have the same state as
        # the current closed hours, and they end before the current
        # closed hours, extend that tracked closed hours.
        # ---------------------------
        #  xxxxxx     -> xxxxxxxxx
        #      xxxxx  ->              Combined
        # ---------------------------
        #  xxxx       -> xxxxxxxxx
        #      xxxxx  ->              Continued
        # ---------------------------
        elif closed_hours.end_time < opening_hour.end_time:
            closed_hours.extend(opening_hour)

    @staticmethod
    def _prune_tracked_hours(
        all_tracked_hours: dict[ResourceState, Optional[OpeningHours]],
        start_time: datetime.datetime,
    ) -> list[OpeningHours]:
        to_remove: list[ResourceState] = []
        removed_hours: list[OpeningHours] = []

        for state, tracked_hours in all_tracked_hours.items():
            if tracked_hours is None:
                to_remove.append(state)
                continue

            if tracked_hours.end_time < start_time:
                removed_hours.append(tracked_hours)
                to_remove.append(state)

        for state in to_remove:
            del all_tracked_hours[state]

        return removed_hours

    def refresh_opening_hours(self):
        self._init_opening_hours_structure()
        self._fetch_opening_hours(self.start, self.end)

    def get_opening_hours_for_resource(self, resource, date) -> list[OpeningHours]:
        resource = self.opening_hours.get(resource, {})
        times = resource.get(date, [])
        return times

    def get_opening_hours_for_date_range(
        self, resource: str, date_start: datetime.date, date_end: datetime.date
    ) -> dict[datetime.date, list[OpeningHours]]:
        opening_hours = {
            date: times
            for date, times in self.opening_hours.get(resource, {}).items()
            if date >= date_start and date <= date_end and times
        }
        return opening_hours

    def get_resource_periods(self, resource) -> list[Period]:
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
    ) -> tuple[datetime.date, list[OpeningHours]]:
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
