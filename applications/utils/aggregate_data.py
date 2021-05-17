from threading import Thread

from django.db import Error

from opening_hours.hours import get_opening_hours


class EventAggregateDataCreator(Thread):
    def __init__(self, event, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.event = event

    def run(self) -> None:
        return self.event.create_aggregate_data()


class ApplicationEventScheduleResultAggregateDataCreator(Thread):
    def __init__(self, event, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.event = event

    def run(self) -> None:
        return self.event.create_schedule_result_aggregated_data()


class ApplicationRoundAggregateDataCreator(Thread):
    def __init__(self, app_round, *args, **kwargs):
        self.reservations_only = kwargs.pop("reservations_only", False)
        super().__init__(*args, **kwargs)
        self.app_round = app_round

    def run(self) -> None:
        self.create_total_reservations()

        if not self.reservations_only:
            self.create_total_opening_hours()

    def _update_or_create_aggregate_data_values(self, data: dict):
        from applications.models import ApplicationRoundAggregateData

        try:
            for name, value in data.items():
                ApplicationRoundAggregateData.objects.update_or_create(
                    application_round=self.app_round,
                    name=name,
                    defaults={"value": value},
                )
        except Error:
            pass

    def create_total_opening_hours(self):
        opening_hours = get_opening_hours(
            list(self.app_round.reservation_units.values_list("uuid", flat=True)),
            self.app_round.reservation_period_begin,
            self.app_round.reservation_period_end,
        )
        hours_in_day = 24
        total_opening_hours = 0
        for opening_hour in opening_hours:
            for time in opening_hour["times"]:
                if time.full_day:
                    total_opening_hours += hours_in_day
                    continue

                if time.end_time_on_next_day:
                    total_opening_hours += hours_in_day - time.start_time.hour
                    continue

                total_opening_hours += time.end_time.hour - time.start_time.hour

        data = {"total_hour_capacity": total_opening_hours}

        self._update_or_create_aggregate_data_values(data)

    def create_total_reservations(self):
        # Avoid circulars.
        from reservations.models import Reservation

        total_duration_qs = (
            Reservation.objects.going_to_occur()
            .filter(reservation_unit__in=self.app_round.reservation_units.all())
            .within_application_round_period(self.app_round)
            .total_duration()
        )
        total_duration = total_duration_qs.get("total_duration")
        data = {
            "total_reservation_duration": total_duration.total_seconds() / 3600.0
            if total_duration is not None
            else 0,
        }

        self._update_or_create_aggregate_data_values(data)
