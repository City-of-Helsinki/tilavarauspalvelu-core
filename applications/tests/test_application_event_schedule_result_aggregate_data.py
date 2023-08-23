import datetime

import freezegun
from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from django.utils.timezone import get_default_timezone

from applications.models import (
    ApplicationEventAggregateData,
    ApplicationEventScheduleResultAggregateData,
)
from applications.tests.factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    ApplicationEventScheduleResultFactory,
)
from applications.utils.aggregate_data import (
    ApplicationEventScheduleResultAggregateDataRunner,
)


class ApplicationEventScheduleResultAggregateDataBaseTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.application_event = ApplicationEventFactory(
            num_persons=10,
            min_duration=datetime.timedelta(hours=2),
            max_duration=datetime.timedelta(hours=2),
            name="Football",
            events_per_week=1,
            begin=datetime.date(year=2020, month=1, day=1),
            end=datetime.date(year=2020, month=2, day=28),
            biweekly=False,
        )
        cls.schedule = ApplicationEventScheduleFactory(
            day=1,
            application_event=cls.application_event,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        cls.schedule_result = ApplicationEventScheduleResultFactory(
            application_event_schedule=cls.schedule,
            allocated_duration=datetime.timedelta(hours=2),
            allocated_day=cls.schedule.day,
            allocated_begin=cls.schedule.begin,
            allocated_end=cls.schedule.end,
        )


@freezegun.freeze_time("2020-01-01")
class ApplicationEventScheduleResultAggregateDataTestCase(ApplicationEventScheduleResultAggregateDataBaseTestCase):
    def test_correct_amount_of_aggregate_data_is_created(
        self,
    ):
        assert_that(ApplicationEventScheduleResultAggregateData.objects.count()).is_zero()
        self.schedule_result.create_aggregate_data()
        assert_that(2).is_equal_to(ApplicationEventScheduleResultAggregateData.objects.count())

    def test_duration_total(
        self,
    ):
        self.schedule_result.create_aggregate_data()
        duration = ApplicationEventScheduleResultAggregateData.objects.get(name="duration_total")
        assert_that(16 * 3600).is_equal_to(duration.value)

    def test_reservations_total(self):
        self.schedule_result.create_aggregate_data()
        res_tot = ApplicationEventScheduleResultAggregateData.objects.get(name="reservations_total")
        assert_that(8).is_equal_to(res_tot.value)


@freezegun.freeze_time("2020-01-01")
class ApplicationEventAggregateDataForScheduleResultsTestCase(ApplicationEventScheduleResultAggregateDataBaseTestCase):
    def test_schedule_result_data_is_created_correct_amount(
        self,
    ):
        qs = ApplicationEventAggregateData.objects.filter(name__istartswith="allocation_results")
        assert_that(qs.count()).is_zero()
        self.application_event.create_schedule_result_aggregated_data()
        assert_that(2).is_equal_to(qs.count())

    def test_schedule_result_values_are_zero_when_results_declined(
        self,
    ):
        self.schedule_result.declined = True
        self.schedule_result.save()
        qs = ApplicationEventAggregateData.objects.filter(name__istartswith="allocation_results")
        assert_that(qs.count()).is_zero()
        self.application_event.create_schedule_result_aggregated_data()
        for data in qs.all():
            assert_that(data.value).is_zero()

    def test_durations_total_when_one_schedule_result(
        self,
    ):
        self.application_event.create_schedule_result_aggregated_data()
        duration = ApplicationEventAggregateData.objects.get(name="allocation_results_duration_total")
        assert_that(16 * 3600).is_equal_to(duration.value)

    def test_duration_total_sums_amounts_of_schedule_results(
        self,
    ):
        self.application_event.events_per_week = 2
        self.application_event.save()
        schedule = ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        ApplicationEventScheduleResultFactory(
            application_event_schedule=schedule,
            allocated_duration=datetime.timedelta(hours=2),
            allocated_day=2,
            allocated_begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        self.application_event.create_schedule_result_aggregated_data()
        duration = ApplicationEventAggregateData.objects.get(name="allocation_results_duration_total")
        assert_that(34 * 3600).is_equal_to(duration.value)

    def test_reservations_total_when_one_schedule_result(self):
        self.application_event.create_schedule_result_aggregated_data()
        res_tot = ApplicationEventAggregateData.objects.get(name="allocation_results_reservations_total")
        assert_that(8).is_equal_to(res_tot.value)

    def test_reservations_total_sums_amounts_of_schedule_results(
        self,
    ):
        self.application_event.events_per_week = 2
        self.application_event.save()
        schedule = ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        ApplicationEventScheduleResultFactory(
            application_event_schedule=schedule,
            allocated_duration=datetime.timedelta(hours=2),
            allocated_day=2,
            allocated_begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        self.application_event.create_schedule_result_aggregated_data()
        res_tot = ApplicationEventAggregateData.objects.get(name="allocation_results_reservations_total")
        assert_that(res_tot.value).is_equal_to(17)

    def test_reservations_total_dont_include_declined_results(
        self,
    ):
        self.application_event.events_per_week = 2
        self.application_event.save()
        schedule = ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        ApplicationEventScheduleResultFactory(
            application_event_schedule=schedule,
            allocated_duration=datetime.timedelta(hours=2),
            allocated_day=2,
            allocated_begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
            declined=True,
        )
        self.application_event.create_schedule_result_aggregated_data()
        res_tot = ApplicationEventAggregateData.objects.get(name="allocation_results_reservations_total")
        assert_that(res_tot.value).is_equal_to(8)

    def test_durations_total_dont_include_declined_results(
        self,
    ):
        self.application_event.events_per_week = 2
        self.application_event.save()
        schedule = ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        ApplicationEventScheduleResultFactory(
            application_event_schedule=schedule,
            allocated_duration=datetime.timedelta(hours=2),
            allocated_day=2,
            allocated_begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
            declined=True,
        )
        self.application_event.create_schedule_result_aggregated_data()
        res_tot = ApplicationEventAggregateData.objects.get(name="allocation_results_duration_total")
        assert_that(res_tot.value).is_equal_to(16 * 3600)


@freezegun.freeze_time("2020-01-01")
class ApplicationEventScheduleResultAggregateDataRunnerTestCase(
    ApplicationEventScheduleResultAggregateDataBaseTestCase
):
    def test_running_creation_with_runner(
        self,
    ):
        settings.CELERY_ENABLED = False
        assert_that(ApplicationEventScheduleResultAggregateData.objects.count()).is_zero()
        ApplicationEventScheduleResultAggregateDataRunner(self.application_event.id).run()
        assert_that(ApplicationEventScheduleResultAggregateData.objects.count()).is_equal_to(2)
