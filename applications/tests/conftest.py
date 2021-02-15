import datetime

import pytest
import pytz

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationRound,
)


@pytest.fixture
def default_application_round() -> ApplicationRound:
    return ApplicationRound.objects.create(
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


@pytest.fixture
def minimal_application(default_application_round) -> Application:
    return Application.objects.create(application_round_id=default_application_round.id)


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
