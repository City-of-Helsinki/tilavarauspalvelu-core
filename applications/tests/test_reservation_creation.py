import datetime
from unittest import TestCase as DjangoTestCase
from unittest import mock
from unittest.mock import MagicMock

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import get_default_timezone

from applications.utils.reservation_creation import (
    ReservationScheduler,
    create_reservations_from_allocation_results,
)
from opening_hours.hours import TimeElement
from reservations.models import STATE_CHOICES, Reservation
from tests.factories import (
    AbilityGroupFactory,
    AddressFactory,
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    ApplicationEventScheduleResultFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    EventReservationUnitFactory,
    ReservationUnitFactory,
    SpaceFactory,
)
from tilavarauspalvelu.utils.date_util import next_or_current_matching_weekday

User = get_user_model()
response_mock = MagicMock()


def get_opening_hour_data_single_day(*args, **kwargs):
    id = args[0]
    start = kwargs.get("start_date")
    start_hour = kwargs.get("start_hour", 12)
    end_hour = kwargs.get("end_hour", 14)
    response = [
        {
            "resource_id": id,
            "date": start,
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=start_hour, tzinfo=get_default_timezone()),
                    end_time=datetime.time(hour=end_hour, tzinfo=get_default_timezone()),
                    end_time_on_next_day=False,
                )
            ],
        }
    ]
    return response


def get_opening_hour_data_not_open_that_day(*args, **kwargs):
    id = args[0]
    start = kwargs.get("start_date") - datetime.timedelta(days=1)
    end = kwargs.get("end_date") - datetime.timedelta(days=1)

    return get_opening_hour_data_single_day(id, start_date=start, end_date=end)


def get_opening_hour_data_for_multiple_days(*args, **kwargs):
    id = args[0]
    start = kwargs.get("start_date")
    end = kwargs.get("end_date")

    response = [
        {
            "resource_id": id,
            "date": start,
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=8, tzinfo=get_default_timezone()),
                    end_time=datetime.time(hour=23, minute=59, tzinfo=get_default_timezone()),
                    end_time_on_next_day=False,
                )
            ],
        },
        {
            "resource_id": id,
            "date": end,
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=0, tzinfo=get_default_timezone()),
                    end_time=datetime.time(hour=18, tzinfo=get_default_timezone()),
                    end_time_on_next_day=False,
                )
            ],
        },
    ]

    return response


@mock.patch(
    "applications.utils.reservation_creation.get_opening_hours",
    wraps=get_opening_hour_data_single_day,
)
class ReservationSchedulerTestCase(TestCase, DjangoTestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        user = get_user_model().objects.create(
            username="testu",
            first_name="first",
            last_name="last",
            email="first.last@localhost",
        )
        date = datetime.date.today()
        cls.round = ApplicationRoundFactory(
            reservation_period_begin=date,
            reservation_period_end=date + datetime.timedelta(weeks=4),
        )
        cls.application = ApplicationFactory(application_round=cls.round, user=user, billing_address=AddressFactory())
        cls.application_event = ApplicationEventFactory(
            application=cls.application,
            events_per_week=1,
            begin=date,
            end=date + datetime.timedelta(weeks=4),
            ability_group=AbilityGroupFactory(),
            num_persons=20,
        )
        cls.res_unit = ReservationUnitFactory(spaces=[SpaceFactory()])
        EventReservationUnitFactory(
            application_event=cls.application_event,
            reservation_unit=cls.res_unit,
        )
        cls.schedule = ApplicationEventScheduleFactory(application_event=cls.application_event)

        cls.result = ApplicationEventScheduleResultFactory(
            application_event_schedule=cls.schedule,
            allocated_reservation_unit=cls.res_unit,
            allocated_begin=datetime.time(hour=12),
            allocated_end=datetime.time(hour=14),
        )
        cls.service_sector_manager = User.objects.create(
            username="service_sector_person",
            first_name="ser",
            last_name="vice",
            email="ser.vice.person@foo.com",
        )
        reservation_date = next_or_current_matching_weekday(cls.application_event.begin, cls.result.allocated_day)
        cls.reservation_begin = datetime.datetime.combine(
            reservation_date, cls.result.allocated_begin, tzinfo=get_default_timezone()
        )
        cls.reservation_end = datetime.datetime.combine(
            reservation_date, cls.result.allocated_end, tzinfo=get_default_timezone()
        )

    def test_reservation_time_equal_reservation_time_when_open_in_reservation_time(self, mock):
        scheduler = ReservationScheduler(self.res_unit, self.reservation_begin, self.reservation_end)
        start_dt, end_dt = scheduler.get_reservation_times_based_on_opening_hours()

        assert_that(start_dt).is_equal_to(self.reservation_begin)
        assert_that(end_dt).is_equal_to(self.reservation_end)

    def test_reservation_time_is_one_hour_reduced_from_reservation_time_when_closes_before_reservation_end(self, mock):
        reservation_end = self.reservation_end + datetime.timedelta(hours=1)
        scheduler = ReservationScheduler(self.res_unit, self.reservation_begin, reservation_end)
        start_dt, end_dt = scheduler.get_reservation_times_based_on_opening_hours()

        expected_res_end = datetime.datetime(
            end_dt.year, end_dt.month, end_dt.day, 14, 0, tzinfo=get_default_timezone()
        )
        assert_that(start_dt).is_equal_to(self.reservation_begin)
        assert_that(end_dt).is_equal_to(expected_res_end)

    def test_reservation_time_is_one_hour_reduced_from_reservation_time_when_opens_after_reservation_begin(self, mock):
        reservation_start = self.reservation_begin - datetime.timedelta(hours=1)
        scheduler = ReservationScheduler(self.res_unit, reservation_start, self.reservation_end)
        start_dt, end_dt = scheduler.get_reservation_times_based_on_opening_hours()

        expected_res_begin = datetime.datetime(
            start_dt.year,
            start_dt.month,
            start_dt.day,
            12,
            0,
            tzinfo=get_default_timezone(),
        )
        assert_that(start_dt).is_equal_to(expected_res_begin)
        assert_that(end_dt).is_equal_to(self.reservation_end)

    def test_reservation_times_are_none_when_the_reservation_unit_is_not_open_in_reservation_time(self, mock):
        mock.return_value = get_opening_hour_data_not_open_that_day(
            self.res_unit,
            start_date=self.reservation_begin.date(),
            end_date=self.reservation_end.date(),
        )
        scheduler = ReservationScheduler(self.res_unit, self.reservation_begin, self.reservation_end)
        start_dt, end_dt = scheduler.get_reservation_times_based_on_opening_hours()

        assert_that(start_dt).is_none()
        assert_that(end_dt).is_none()

    def test_over_day_reservation_is_reduced_to_one_day_if_reservation_unit_not_open_through_night(self, mock):
        res_end = self.reservation_end + datetime.timedelta(days=1)
        scheduler = ReservationScheduler(self.res_unit, self.reservation_begin, res_end)
        start_dt, end_dt = scheduler.get_reservation_times_based_on_opening_hours()
        expected_end = datetime.datetime(
            start_dt.year,
            start_dt.month,
            start_dt.day,
            14,
            00,
            tzinfo=get_default_timezone(),
        )
        assert_that(start_dt).is_equal_to(start_dt)
        assert_that(end_dt).is_equal_to(expected_end)

    def test_over_day_reservation_when_unit_is_open_through_night(self, mock):
        res_end = self.reservation_end + datetime.timedelta(days=1)
        mock.return_value = get_opening_hour_data_for_multiple_days(
            self.res_unit,
            start_date=self.reservation_begin.date(),
            end_date=res_end.date(),
        )
        scheduler = ReservationScheduler(self.res_unit, self.reservation_begin, res_end)
        start_dt, end_dt = scheduler.get_reservation_times_based_on_opening_hours()

        expected_end = datetime.datetime(
            res_end.year,
            res_end.month,
            res_end.day,
            14,
            00,
            tzinfo=get_default_timezone(),
        )
        assert_that(start_dt).is_equal_to(start_dt)
        assert_that(end_dt).is_equal_to(expected_end)

    def test_creating_reservations(self, mock):
        create_reservations_from_allocation_results(self.application_event)
        assert_that(Reservation.objects.count()).is_equal_to(4)

        for res in Reservation.objects.all().order_by("name"):
            assert_that(res.state).is_equal_to(STATE_CHOICES.CONFIRMED)
            assert_that(res.priority).is_equal_to(self.schedule.priority)
            assert_that(res.user).is_equal_to(self.application.user)
            assert_that(res.begin.weekday()).is_equal_to(self.result.allocated_day)
            assert_that(res.end.weekday()).is_equal_to(self.result.allocated_day)
            assert_that(res.num_persons).is_equal_to(self.application_event.num_persons)
            assert_that(res.purpose).is_equal_to(self.application_event.purpose)
            assert_that(res.age_group).is_equal_to(self.application_event.age_group)
            assert_that(res.name).is_equal_to(self.application_event.name)
            assert_that(res.home_city).is_equal_to(self.application.home_city)

            organisation = self.application.organisation
            assert_that(res.reservee_organisation_name).is_equal_to(organisation.name)
            assert_that(res.reservee_id).is_equal_to(organisation.identifier)
            assert_that(res.reservee_address_zip).is_equal_to(organisation.address.post_code)
            assert_that(res.reservee_address_street).is_equal_to(organisation.address.street_address)
            assert_that(res.reservee_address_city).is_equal_to(organisation.address.city)

            assert_that(res.billing_address_street).is_equal_to(self.application.billing_address.street_address)
            assert_that(res.billing_address_city).is_equal_to(self.application.billing_address.city)
            assert_that(res.billing_address_zip).is_equal_to(self.application.billing_address.post_code)

            contact_person = self.application.contact_person
            assert_that(res.reservee_first_name).is_equal_to(contact_person.first_name)
            assert_that(res.reservee_last_name).is_equal_to(contact_person.last_name)
            assert_that(res.reservee_email).is_equal_to(contact_person.email)
            assert_that(res.reservee_phone).is_equal_to(contact_person.phone_number)

            assert_that(res.recurring_reservation).is_not_none()
            recurring_res = res.recurring_reservation
            assert_that(recurring_res.user).is_equal_to(self.application.user)
            assert_that(recurring_res.application).is_equal_to(self.application)
            assert_that(recurring_res.application_event).is_equal_to(self.application_event)
            assert_that(recurring_res.age_group).is_equal_to(self.application_event.age_group)
            assert_that(recurring_res.ability_group).is_equal_to(self.application_event.ability_group)
            assert_that(recurring_res.reservation_unit).is_equal_to(self.result.allocated_reservation_unit)

    def test_creating_reservations_without_result(self, mock):
        self.result.delete()
        create_reservations_from_allocation_results(self.application_event)
        assert_that(Reservation.objects.count()).is_equal_to(0)
