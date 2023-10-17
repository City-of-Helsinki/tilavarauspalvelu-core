import datetime
from functools import partial

from django.utils.timezone import get_default_timezone

from opening_hours.hours import OpeningHoursDayData, TimeElement
from tests.helpers import build_mutation, build_query

schedules_query = partial(
    build_query,
    "applicationEvents",
    fields="applicationEventSchedules { pk }",
    connection=True,
    order_by="pk",
)


APPROVE_MUTATION = build_mutation(
    "approveApplicationEventSchedule",
    "ApplicationEventScheduleApproveMutationInput",
)

DECLINE_MUTATION = build_mutation(
    "declineApplicationEventSchedule",
    "ApplicationEventScheduleDeclineMutationInput",
)


def mock_full_opening_hours(
    resource_id: str,
    start_date: datetime.date,
    end_date: datetime.date,
) -> list[OpeningHoursDayData]:
    return [
        OpeningHoursDayData(
            timezone=get_default_timezone(),
            resource_id=resource_id,
            origin_id="origin",
            date=start_date + datetime.timedelta(days=day),
            times=[
                TimeElement(
                    start_time=datetime.time(hour=0, minute=0, second=0),
                    end_time=datetime.time(hour=23, minute=59, second=59),
                    end_time_on_next_day=False,
                ),
            ],
        )
        for day in range((end_date - start_date).days + 1)
    ]


def mock_empty_opening_hours(
    resource_id: str,
    start_date: datetime.date,
    end_date: datetime.date,
) -> list[OpeningHoursDayData]:
    return [
        OpeningHoursDayData(
            timezone=get_default_timezone(),
            resource_id=resource_id,
            origin_id="origin",
            date=start_date + datetime.timedelta(days=day),
            times=[],
        )
        for day in range((end_date - start_date).days + 1)
    ]
