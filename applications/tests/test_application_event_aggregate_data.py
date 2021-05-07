import datetime
from unittest import mock

import freezegun
import pytest
from assertpy import assert_that
from django.test.testcases import TestCase
from django.utils.timezone import get_default_timezone

from applications.models import ApplicationEventAggregateData, ApplicationStatus
from applications.tests.factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
)


class ApplicationEventAggregateDataBaseTestCase(TestCase):
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


@mock.patch("applications.utils.aggregate_data.EventAggregateDataCreator.start")
class ApplicationEventAggregateDataCreatorTestCase(
    ApplicationEventAggregateDataBaseTestCase
):
    def test_application_event_aggregate_data_creator_start_called_when_app_status_change_in_review(
        self, mock
    ):
        assert_that(ApplicationEventAggregateData.objects.exists()).is_false()
        self.application_event.application.set_status(ApplicationStatus.IN_REVIEW)
        assert_that(mock.call_count).is_greater_than(0)

    def test_application_event_aggregate_data_does_not_call_creator_start_when_app_status_not_in_review(
        self, mock
    ):
        self.application_event.application.set_status(ApplicationStatus.DRAFT)
        assert_that(mock.called).is_false()


@pytest.mark.django_db
@freezegun.freeze_time("2020-01-01")
class ApplicationEventAggregateDataTestCase(ApplicationEventAggregateDataBaseTestCase):
    def test_application_event_aggregate_data_is_creates_correct_amount(
        self,
    ):
        assert_that(ApplicationEventAggregateData.objects.count()).is_zero()
        self.application_event.create_aggregate_data()
        assert_that(2).is_equal_to(ApplicationEventAggregateData.objects.count())

    def test_duration_total_when_one_schedule(
        self,
    ):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=1,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        self.application_event.create_aggregate_data()
        duration = ApplicationEventAggregateData.objects.get(name="duration_total")
        assert_that(16).is_equal_to(duration.value)

    def test_duration_total_uses_max_amount_when_when_multiple_schedules_and_events_per_week_one(
        self,
    ):
        self.application_event.events_per_week = 1
        self.application_event.save()
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=1,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        self.application_event.create_aggregate_data()
        duration = ApplicationEventAggregateData.objects.get(name="duration_total")
        assert_that(18).is_equal_to(duration.value)

    def test_duration_total_sums_amounts_when_events_per_week_is_same_with_amount_of_schedules(
        self,
    ):
        self.application_event.events_per_week = 2
        self.application_event.save()
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=1,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        self.application_event.create_aggregate_data()
        duration = ApplicationEventAggregateData.objects.get(name="duration_total")
        assert_that(34).is_equal_to(duration.value)

    def test_reservations_total_when_one_schedule(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=1,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        self.application_event.create_aggregate_data()
        res_tot = ApplicationEventAggregateData.objects.get(name="reservations_total")
        assert_that(8).is_equal_to(res_tot.value)

    def test_reservations_total_uses_max_amount_when_when_multiple_schedules_and_events_per_week_one(
        self,
    ):
        self.application_event.events_per_week = 1
        self.application_event.save()
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=1,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        self.application_event.create_aggregate_data()
        res_tot = ApplicationEventAggregateData.objects.get(name="reservations_total")
        assert_that(9).is_equal_to(res_tot.value)

    def test_reservations_total_sums_amounts_when_events_per_week_is_same_with_amount_of_schedules(
        self,
    ):
        self.application_event.events_per_week = 2
        self.application_event.save()
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=1,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
            end=datetime.time(14, 0, tzinfo=get_default_timezone()),
        )
        self.application_event.create_aggregate_data()
        res_tot = ApplicationEventAggregateData.objects.get(name="reservations_total")
        assert_that(res_tot.value).is_equal_to(17)
