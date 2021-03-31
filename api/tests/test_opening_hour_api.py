import datetime
from unittest import mock

import pytest
from assertpy import assert_that
from rest_framework.reverse import reverse

from opening_hours.hours import TimeElement


@mock.patch(
    "api.hauki_api.get_opening_hours",
    return_value=[
        {
            "resource_id": 123,
            "date": datetime.datetime.strptime("2021-01-01", "%Y-%m-%d").date(),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                )
            ],
        }
    ],
)
@pytest.mark.django_db
def test_fetching_opening_hours_for_reservation_unit(
    mocked_opening_hours,
    user_api_client,
    reservation_unit,
):
    mocked_opening_hours()
    response = user_api_client.get(
        reverse("opening_hour-detail", kwargs={"pk": reservation_unit.id}),
        format="json",
    )

    assert_that(response).has_status_code == 201
    assert_that(response.data["id"]).is_equal_to(reservation_unit.id)
    opening_hours = response.data["opening_hours"][0]
    assert_that(opening_hours).has_date("2021-01-01")
    assert_that(opening_hours["times"][0]).has_start_time("10:00:00").has_end_time(
        "22:00:00"
    ).has_end_time_on_next_day(False)
