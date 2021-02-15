import datetime

import pytest
import pytz

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationRound,
    ApplicationRoundBasket,
)
from reservation_units.models import Purpose
from reservations.models import AgeGroup


@pytest.fixture
def purpose() -> Purpose:
    return Purpose.objects.create(name="Football")


@pytest.fixture
def purpose_two() -> Purpose:
    return Purpose.objects.create(name="Scating")


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
def application_round_basket_one(
    default_application_round, purpose
) -> ApplicationRoundBasket:
    return ApplicationRoundBasket.objects.create(
        name="Basket with order number one",
        application_round=default_application_round,
        purpose=purpose,
        order_number=1,
        customer_type=[ApplicationRoundBasket.CUSTOMER_TYPE_NONPROFIT],
    )


@pytest.fixture
def application_round_basket_two(
    default_application_round, purpose
) -> ApplicationRoundBasket:
    return ApplicationRoundBasket.objects.create(
        name="Basket with order number two",
        application_round=default_application_round,
        purpose=purpose,
        order_number=2,
        customer_type=[],
    )
