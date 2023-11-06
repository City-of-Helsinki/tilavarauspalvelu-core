import datetime
import uuid
from contextlib import contextmanager
from functools import partial
from typing import Any
from unittest.mock import patch

from django.conf import settings
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from opening_hours.enums import State
from opening_hours.hours import OpeningHoursDayData, TimeElement
from tests.helpers import ResponseMock, build_mutation, build_query

reservations_query = partial(build_query, "reservations", connection=True, order_by="pk")


CREATE_MUTATION = build_mutation("createReservation", "ReservationCreateMutationInput")


@contextmanager
def mock_profile_reader(profile_data: dict[str, Any] | None = None, **kwargs: Any):
    if profile_data is None:
        profile_data = {
            "firstName": "John",
            "lastName": "Doe",
            "primaryAddress": {
                "postalCode": "00100",
                "address": "Test street 1",
                "city": "Helsinki",
                "addressType": "HOME",
            },
            "primaryPhone": {
                "phone": "123456789",
            },
            "verifiedPersonalInformation": {
                "municipalityOfResidence": "Helsinki",
                "municipalityOfResidenceNumber": "12345",
            },
        }

    profile_data.update(kwargs)
    data = {"data": {"myProfile": profile_data}}

    response = ResponseMock(status_code=200, json_data=data)
    get_from_profile = "users.utils.open_city_profile.basic_info_resolver.requests.get"
    get_profile_token = "users.utils.open_city_profile.mixins.get_profile_token"  # noqa: S105
    with patch(get_from_profile, return_value=response) as mock, patch(get_profile_token, return_value="token"):
        yield mock


@contextmanager
def mock_opening_hours(
    reservation_unit_uuid: uuid.UUID,
    date: datetime.date | None = None,
    start_hour: int = 6,
    end_hour: int = 22,
):
    if date is None:
        date = datetime.date.today()

    opening_hours = [
        OpeningHoursDayData(
            timezone=get_default_timezone(),
            resource_id=f"{settings.HAUKI_ORIGIN_ID}:{reservation_unit_uuid}",
            origin_id=str(reservation_unit_uuid),
            date=date,
            times=[
                TimeElement(
                    start_time=datetime.time(hour=start_hour),
                    end_time=datetime.time(hour=end_hour),
                    end_time_on_next_day=False,
                    resource_state=State.WITH_RESERVATION,
                    periods=[],
                ),
            ],
        ),
    ]

    get_opening_hours = "opening_hours.utils.opening_hours_client.get_opening_hours"
    with freeze_time(date), patch(get_opening_hours, return_value=opening_hours) as mock:
        yield mock
