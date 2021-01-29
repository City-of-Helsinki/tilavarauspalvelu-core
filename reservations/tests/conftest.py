import datetime

import pytest

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationPeriod,
)
from reservation_units.models import ReservationUnit


@pytest.fixture(autouse=True)
def setup_audit_log(settings):
    settings.AUDIT_LOGGING_ENABLED = False


def get_default_start() -> datetime.date:
    return datetime.date(year=2020, month=1, day=1)


def get_default_end() -> datetime.date:
    return datetime.date(year=2020, month=1, day=31)


@pytest.fixture
def default_application_period() -> ApplicationPeriod:
    return ApplicationPeriod.objects.create(
        application_period_begin=get_default_start(),
        application_period_end=get_default_end(),
        reservation_period_begin=get_default_start(),
        reservation_period_end=get_default_end(),
    )


@pytest.fixture
def reservation_unit() -> ReservationUnit:
    reservation_unit = ReservationUnit.objects.create(
        name_en="Test reservation unit", require_introduction=False
    )
    return reservation_unit


@pytest.fixture
def application_period_with_reservation_units(
    reservation_unit, default_application_period
) -> ApplicationPeriod:
    default_application_period.reservation_units.set([reservation_unit])
    return default_application_period


@pytest.fixture
def minimal_application(default_application_period) -> Application:
    return Application.objects.create(
        application_period_id=default_application_period.id
    )


@pytest.fixture
def application_with_reservation_units(
    application_period_with_reservation_units,
) -> Application:
    return Application.objects.create(
        application_period_id=application_period_with_reservation_units.id
    )


@pytest.fixture
def application_with_application_events(application_period) -> Application:
    return Application.objects.create(application_period_id=application_period.id)


@pytest.fixture
def recurring_application_event(minimal_application) -> ApplicationEvent:
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
    )


@pytest.fixture
def scheduled_for_monday(recurring_application_event) -> ApplicationEventSchedule:
    return ApplicationEventSchedule.objects.create(
        day=0, begin="10:00", end="12:00", application_event=recurring_application_event
    )
