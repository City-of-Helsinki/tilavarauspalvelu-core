import datetime
from unittest import mock

import pytest
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
@pytest.mark.django_db()
def test_fetching_opening_hours_for_reservation_unit(
    mocked_get_opening_hours,
    user_api_client,
    reservation_unit,
):
    response = user_api_client.get(
        reverse("opening_hour-detail", kwargs={"pk": reservation_unit.id}),
        format="json",
    )

    assert response.status_code == 200
    assert response.data["id"] == reservation_unit.id

    opening_hours = response.data["opening_hours"][0]

    assert opening_hours["date"] == "2021-01-01"
    assert opening_hours["times"][0]["start_time"] == "10:00:00"
    assert opening_hours["times"][0]["end_time"] == "22:00:00"
    assert opening_hours["times"][0]["end_time_on_next_day"] is False
