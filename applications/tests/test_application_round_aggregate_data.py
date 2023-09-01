import datetime
from unittest import mock

import freezegun
from assertpy import assert_that
from django.test.testcases import TestCase
from django.utils.timezone import get_default_timezone

from applications.models import ApplicationRoundAggregateData
from applications.utils.aggregate_data import ApplicationRoundAggregateDataCreator
from opening_hours.hours import TimeElement
from reservations.models import STATE_CHOICES
from tests.factories import ApplicationRoundFactory, ReservationFactory, ReservationUnitFactory


def get_mocked_opening_hours(*args, **kwargs):
    days = kwargs.get("days", 1)
    full_days = list(range(kwargs.get("full_days", 0)))
    opening_day = kwargs.get("start_date", datetime.date.today())
    opening_hours = []
    for _c in range(days):
        is_full_day = len(full_days) > 0
        if is_full_day:
            full_days.pop()
        opening_hours.append(
            {
                "resource_id": id,
                "date": opening_day,
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=8, tzinfo=get_default_timezone()),
                        end_time=datetime.time(hour=16, tzinfo=get_default_timezone()),
                        end_time_on_next_day=False,
                        full_day=is_full_day,
                    )
                ],
            }
        )
        opening_day = opening_day + datetime.timedelta(days=1)
    return opening_hours


@freezegun.freeze_time("2020-01-01")
@mock.patch(
    "opening_hours.utils.summaries.get_opening_hours",
    return_value=get_mocked_opening_hours(),
)
class ApplicationRoundAggregateDataTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.reservation_units = ReservationUnitFactory.create_batch(
            4,
        )
        cls.application_round = ApplicationRoundFactory(
            reservation_units=cls.reservation_units,
            reservation_period_begin=datetime.date.today(),
            reservation_period_end=datetime.date(2020, 2, 28),
        )
        res_start = datetime.datetime.combine(
            cls.application_round.reservation_period_begin, datetime.time(12)
        ).astimezone(tz=get_default_timezone())
        cls.reservation_1 = ReservationFactory(
            begin=res_start,
            end=res_start + datetime.timedelta(hours=2),
            reservation_unit=[cls.reservation_units[0]],
            state=STATE_CHOICES.CREATED,
        )
        res_start = res_start + datetime.timedelta(days=7)
        cls.reservation_2 = ReservationFactory(
            begin=res_start,
            end=res_start + datetime.timedelta(hours=2),
            reservation_unit=[cls.reservation_units[1]],
            state=STATE_CHOICES.CREATED,
        )
        res_start = res_start + datetime.timedelta(days=7)
        cls.reservation_3 = ReservationFactory(
            begin=res_start,
            end=res_start + datetime.timedelta(hours=2),
            reservation_unit=[cls.reservation_units[2]],
            state=STATE_CHOICES.CREATED,
        )
        res_start = res_start + datetime.timedelta(days=7)
        cls.reservation_4 = ReservationFactory(
            begin=res_start,
            end=res_start + datetime.timedelta(hours=2),
            reservation_unit=[cls.reservation_units[3]],
            state=STATE_CHOICES.CREATED,
        )

    def test_aggregate_data_is_created(self, mock):
        assert_that(ApplicationRoundAggregateData.objects.count()).is_zero()
        ApplicationRoundAggregateDataCreator(self.application_round).run()
        assert_that(ApplicationRoundAggregateData.objects.count()).is_equal_to(2)

    def test_only_reservations_total_duration_created_when_reservations_only(self, mock):
        assert_that(ApplicationRoundAggregateData.objects.count()).is_zero()
        ApplicationRoundAggregateDataCreator(self.application_round, reservations_only=True).run()
        assert_that(ApplicationRoundAggregateData.objects.count()).is_equal_to(1)
        res_tot = ApplicationRoundAggregateData.objects.filter(name="total_reservation_duration").first()
        assert_that(res_tot).is_not_none()

    def test_total_amount_of_hours_within_round_when_one_opening_time(self, mock):
        ApplicationRoundAggregateDataCreator(self.application_round).run()
        assert_that(ApplicationRoundAggregateData.objects.get(name="total_hour_capacity").value).is_equal_to(8)

    def test_total_amount_of_hours_within_round_when_multiple_opening_times(self, mock):
        mock.return_value = get_mocked_opening_hours(days=4)
        ApplicationRoundAggregateDataCreator(self.application_round).run()
        assert_that(ApplicationRoundAggregateData.objects.get(name="total_hour_capacity").value).is_equal_to(8 * 4)

    def test_total_reservation_hours_within_round(self, mock):
        ApplicationRoundAggregateDataCreator(self.application_round).run()
        assert_that(ApplicationRoundAggregateData.objects.get(name="total_reservation_duration").value).is_equal_to(8)

    def test_total_amount_of_hours_within_round_when_full_days_one(self, mock):
        mock.return_value = get_mocked_opening_hours(days=2, full_days=1)
        ApplicationRoundAggregateDataCreator(self.application_round).run()
        assert_that(ApplicationRoundAggregateData.objects.get(name="total_hour_capacity").value).is_equal_to(8 + 24)

    def test_total_amount_of_hours_within_round_when_full_days_more_than_one(self, mock):
        mock.return_value = get_mocked_opening_hours(days=4, full_days=3)
        ApplicationRoundAggregateDataCreator(self.application_round).run()
        assert_that(ApplicationRoundAggregateData.objects.get(name="total_hour_capacity").value).is_equal_to(8 + 24 * 3)

    def test_total_amount_of_hours_within_round_when_end_time_next_day_cuts_the_day(self, mock):
        opening_hours = get_mocked_opening_hours()
        opening_hours.append(
            {
                "resource_id": id,
                "date": datetime.date.today() + datetime.timedelta(days=1),
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=20, tzinfo=get_default_timezone()),
                        end_time=datetime.time(hour=8, tzinfo=get_default_timezone()),
                        end_time_on_next_day=True,
                    )
                ],
            }
        )
        mock.return_value = opening_hours
        ApplicationRoundAggregateDataCreator(self.application_round).run()
        assert_that(ApplicationRoundAggregateData.objects.get(name="total_hour_capacity").value).is_equal_to(8 + 4)
