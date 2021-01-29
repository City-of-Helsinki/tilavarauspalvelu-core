import datetime

import pytest

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationPeriod,
)


@pytest.fixture
def default_application_period() -> ApplicationPeriod:
    return ApplicationPeriod.objects.create(
        application_period_begin=datetime.date(year=2020, month=1, day=1),
        application_period_end=datetime.date(year=2020, month=8, day=30),
        reservation_period_begin=datetime.date(year=2020, month=1, day=1),
        reservation_period_end=datetime.date(year=2020, month=8, day=30),
    )


@pytest.fixture
def minimal_application(default_application_period) -> Application:
    return Application.objects.create(
        application_period_id=default_application_period.id
    )


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
def scheduled_for_tuesday(recurring_application_event) -> ApplicationEventSchedule:
    return ApplicationEventSchedule.objects.create(
        day=1, begin="10:00", end="12:00", application_event=recurring_application_event
    )
