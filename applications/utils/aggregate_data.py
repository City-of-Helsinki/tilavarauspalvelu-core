import logging
import sys
from threading import Thread

import celery
from django.conf import settings
from django.db import Error
from django.db.models import DurationField, ExpressionWrapper, F

from applications.utils.aggregate_tasks import (
    _celery_application_event_schedule_result_aggregate_data_create,
)
from opening_hours.hours import HaukiConfigurationError
from opening_hours.utils import get_resources_total_hours

logger = logging.getLogger(__name__)


class BaseAggregateDataCreator(Thread):
    def start(self) -> None:
        if len(sys.argv) > 1 and sys.argv[1] == "test":
            self.run()
            return
        super().run()


class CeleryRunner(object):
    _task: celery.Task

    def run_celery_task(self, *args, **kwargs):
        if settings.CELERY_ENABLED:
            self._task.delay(*args, **kwargs)
        else:
            self._task(*args, **kwargs)


class ApplicationAggregateDataCreator(BaseAggregateDataCreator):
    def __init__(self, application, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.application = application

    def run(self) -> None:
        # Base queries
        self._base_query = self.application.application_events.values(
            "id", "begin", "end", "events_per_week", "min_duration", "max_duration"
        ).annotate(
            events_count=ExpressionWrapper(
                (F("end") - F("begin")) / 7 * F("events_per_week"),
                output_field=DurationField(),
            )
        )

        self.weekly_query = self._base_query.filter(biweekly=False)

        self.bi_weekly_query = self._base_query.filter(biweekly=True).annotate(
            events_count=ExpressionWrapper(
                F("events_count") / 2, output_field=DurationField()
            )
        )

        self._create_event_based_aggregate_data()
        self._create_reservation_based_aggregate_data()

    def _create_event_based_aggregate_data(self):
        total_min_duration = 0
        events_count = 0
        for duration in self.weekly_query.union(self.bi_weekly_query):
            total_min_duration += (
                duration["events_count"].days * duration["min_duration"].total_seconds()
            )
            events_count += duration["events_count"].days

        data_values = {
            "applied_min_duration_total": total_min_duration,
            "applied_reservations_total": events_count,
        }

        self._update_or_create_aggregate_data_values(data_values)

        for event in self.application.application_events.all():
            EventAggregateDataCreator(event).start()

    def _create_reservation_based_aggregate_data(self):
        from reservations.models import Reservation

        res_qs = Reservation.objects.filter(
            recurring_reservation__application=self.application
        ).going_to_occur()
        created_reservations = res_qs.count()
        reservations_duration = res_qs.total_duration().get("total_duration")

        data_values = {
            "created_reservations_total": created_reservations,
            "reservations_duration_total": reservations_duration.total_seconds()
            if reservations_duration
            else 0,
        }
        self._update_or_create_aggregate_data_values(data_values)

    def _update_or_create_aggregate_data_values(self, data: dict):
        # Avoid circulars.
        from applications.models import ApplicationAggregateData

        try:
            for name, value in data.items():
                ApplicationAggregateData.objects.update_or_create(
                    application=self.application,
                    name=name,
                    defaults={"value": value},
                )
        except Error:
            logger.error(
                "ApplicationAggregateDataCreator got an error while creating or updating ApplicationAggregateData."
            )


class EventAggregateDataCreator(BaseAggregateDataCreator):
    def __init__(self, event, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.event = event

    def run(self) -> None:
        return self.event.create_aggregate_data()


class _ApplicationEventScheduleResultAggregateDataCreator(object):
    def __init__(self, event):
        self.event = event

    def run(self) -> None:
        return self.event.create_schedule_result_aggregated_data()


class ApplicationEventScheduleResultAggregateDataRunner(CeleryRunner):
    _task = _celery_application_event_schedule_result_aggregate_data_create
    application_event_id: int

    def __init__(self, application_event_id: int):
        self.application_event_id = application_event_id

    def run(self):
        self.run_celery_task(self.application_event_id)


class ApplicationRoundAggregateDataCreator(BaseAggregateDataCreator):
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
            logger.error(
                "ApplicationRoundAggregateDataCreator got an error while creating ApplicationRoundAggregateData."
            )

    def create_total_opening_hours(self):
        try:
            total_opening_hours = get_resources_total_hours(
                list(self.app_round.reservation_units.values_list("uuid", flat=True)),
                self.app_round.reservation_period_begin,
                self.app_round.reservation_period_end,
            )
        except HaukiConfigurationError:
            total_opening_hours = 0
            logger.error(
                "Got HaukiConfigurationError while trying to fetch opening hours."
            )

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
