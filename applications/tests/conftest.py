import datetime

import pytest
import pytz
from django.conf import settings

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationEventScheduleResult,
    ApplicationRound,
    ApplicationRoundBasket,
    City,
    EventReservationUnit,
)
from reservation_units.models import ReservationUnit
from reservations.models import AgeGroup, ReservationPurpose
from spaces.models import Space


@pytest.fixture(autouse=True)
def disable_hauki():
    settings.HAUKI_API_URL = None


@pytest.fixture(autouse=True)
def disable_celery():
    settings.CELERY_ENABLED = False


@pytest.fixture
def purpose() -> ReservationPurpose:
    return ReservationPurpose.objects.create(name="Football")


@pytest.fixture
def purpose_two() -> ReservationPurpose:
    return ReservationPurpose.objects.create(name="Scating")


@pytest.fixture
def reservation_unit(space_for_15_persons) -> ReservationUnit:
    reservation_unit = ReservationUnit.objects.create(
        name_en="Test reservation unit", require_introduction=False
    )
    reservation_unit.spaces.set([space_for_15_persons])
    return reservation_unit


@pytest.fixture
def space_for_15_persons():
    return Space.objects.create(name="Space", max_persons=15)


@pytest.fixture
def scheduled_for_monday(recurring_application_event) -> ApplicationEventSchedule:
    return ApplicationEventSchedule.objects.create(
        day=0, begin="10:00", end="12:00", application_event=recurring_application_event
    )


@pytest.fixture
def result_scheduled_for_monday(scheduled_for_monday, reservation_unit):
    return ApplicationEventScheduleResult.objects.create(
        application_event_schedule=scheduled_for_monday,
        accepted=True,
        allocated_reservation_unit=reservation_unit,
        allocated_duration="01:00",
        allocated_begin="10:00",
        allocated_end="11:00",
        allocated_day=0,
    )


@pytest.fixture
def matching_event_reservation_unit(
    recurring_application_event, reservation_unit
) -> EventReservationUnit:
    return EventReservationUnit.objects.create(
        priority=100,
        application_event=recurring_application_event,
        reservation_unit=reservation_unit,
    )


@pytest.fixture
def default_application_round(purpose) -> ApplicationRound:
    application_round = ApplicationRound.objects.create(
        application_period_begin=datetime.datetime(
            year=2020, month=1, day=1, tzinfo=pytz.UTC
        ),
        application_period_end=datetime.datetime(
            year=2020, month=8, day=30, tzinfo=pytz.UTC
        ),
        reservation_period_begin=datetime.date(year=2020, month=1, day=1),
        reservation_period_end=datetime.date(year=2020, month=8, day=30),
        public_display_begin=datetime.datetime(
            year=2020, month=1, day=1, tzinfo=pytz.UTC
        ),
        public_display_end=datetime.datetime(
            year=2020, month=8, day=30, tzinfo=pytz.UTC
        ),
    )
    application_round.purposes.set([purpose])
    return application_round


@pytest.fixture
def second_application_round(purpose) -> ApplicationRound:
    application_round = ApplicationRound.objects.create(
        application_period_begin=datetime.datetime(
            year=2020, month=1, day=1, tzinfo=pytz.UTC
        ),
        application_period_end=datetime.datetime(
            year=2020, month=8, day=30, tzinfo=pytz.UTC
        ),
        reservation_period_begin=datetime.date(year=2020, month=1, day=1),
        reservation_period_end=datetime.date(year=2020, month=8, day=30),
        public_display_begin=datetime.datetime(
            year=2020, month=1, day=1, tzinfo=pytz.UTC
        ),
        public_display_end=datetime.datetime(
            year=2020, month=8, day=30, tzinfo=pytz.UTC
        ),
    )
    application_round.purposes.set([purpose])
    return application_round


@pytest.fixture
def application_round_with_reservation_units(
    reservation_unit, default_application_round
) -> ApplicationRound:
    default_application_round.reservation_units.set([reservation_unit])
    return default_application_round


@pytest.fixture
def application_with_reservation_units(
    default_application_round,
) -> Application:
    return Application.objects.create(application_round_id=default_application_round.id)


@pytest.fixture
def application_in_second_application_round(
    second_application_round,
) -> Application:
    return Application.objects.create(application_round_id=second_application_round.id)


@pytest.fixture
def five_to_ten_age_group() -> AgeGroup:
    return AgeGroup.objects.create(minimum=5, maximum=10)


@pytest.fixture
def fifty_to_eighty_age_group() -> AgeGroup:
    return AgeGroup.objects.create(minimum=50, maximum=80)


@pytest.fixture
def minimal_application(default_application_round) -> Application:
    return Application.objects.create(application_round_id=default_application_round.id)


@pytest.fixture
def recurring_application_event(minimal_application, purpose) -> ApplicationEvent:
    return ApplicationEvent.objects.create(
        application=minimal_application,
        num_persons=10,
        min_duration=datetime.timedelta(hours=1),
        max_duration=datetime.timedelta(hours=2),
        name="Football",
        events_per_week=2,
        begin=datetime.date(year=2020, month=1, day=1),
        end=datetime.date(year=2020, month=2, day=28),
        biweekly=False,
        purpose=purpose,
    )


@pytest.fixture
def recurring_bi_weekly_application_event(minimal_application) -> ApplicationEvent:
    return ApplicationEvent.objects.create(
        application=minimal_application,
        num_persons=10,
        min_duration=datetime.timedelta(hours=1),
        max_duration=datetime.timedelta(hours=2),
        name="Soccer",
        events_per_week=2,
        begin=datetime.date(year=2020, month=1, day=1),
        end=datetime.date(year=2020, month=3, day=31),
        biweekly=True,
    )


@pytest.fixture
def scheduled_for_tuesday(recurring_application_event) -> ApplicationEventSchedule:
    return ApplicationEventSchedule.objects.create(
        day=1, begin="10:00", end="12:00", application_event=recurring_application_event
    )


@pytest.fixture
def result_scheduled_for_tuesday(scheduled_for_tuesday, reservation_unit):
    return ApplicationEventScheduleResult.objects.create(
        application_event_schedule=scheduled_for_tuesday,
        accepted=False,
        allocated_reservation_unit=reservation_unit,
        allocated_duration="01:00",
        allocated_begin="10:00",
        allocated_end="11:00",
        allocated_day=1,
    )


@pytest.fixture
def application_round_basket_one(
    default_application_round, purpose
) -> ApplicationRoundBasket:
    basket = ApplicationRoundBasket.objects.create(
        name="Basket with order number one",
        application_round=default_application_round,
        order_number=1,
        customer_type=[],
    )
    basket.purposes.set([purpose])
    return basket


@pytest.fixture
def application_round_basket_two(
    default_application_round, purpose
) -> ApplicationRoundBasket:
    basket = ApplicationRoundBasket.objects.create(
        name="Basket with order number two",
        application_round=default_application_round,
        order_number=2,
        customer_type=[],
    )
    basket.purposes.set([purpose])
    return basket


@pytest.fixture
def city_of_helsinki(default_application_round, purpose) -> City:
    return City.objects.create(
        name="Helsinki",
    )


@pytest.fixture
def city_of_tampere(default_application_round, purpose) -> City:
    return City.objects.create(
        name="Tampere",
    )
