import datetime
import io

import pytest
from rest_framework.reverse import reverse

from api.legacy_rest_api.utils import hmac_signature

pytestmark = [
    pytest.mark.django_db,
]


def test_getting_reservation_calendar(user_api_client, reservation, reservation_in_second_unit):
    base_url = reverse("reservation_calendar-detail", kwargs={"pk": reservation.pk})
    url = f"{base_url}?hash={hmac_signature(f'reservation-{reservation.pk}')}"
    response = user_api_client.get(url)
    assert response.status_code == 200
    zip_content = io.BytesIO(b"".join(response.streaming_content)).read().decode("utf-8")

    expected_summary = "SUMMARY:" + reservation.get_ical_summary().replace("\n", "\\n")
    expected_description = "DESCRIPTION:" + reservation.get_ical_description().replace("\n", "\\n")
    expected_start = f"DTSTART:{reservation.begin.astimezone(datetime.UTC).strftime('%Y%m%dT%H%M%SZ')}"
    unexpected_start = f"DTSTART:{reservation_in_second_unit.begin.astimezone(datetime.UTC).strftime('%Y%m%dT%H%M%SZ')}"

    assert expected_summary in zip_content
    assert expected_description in zip_content
    assert expected_start in zip_content
    assert unexpected_start not in zip_content


def test_getting_reservation_calendar_without_hash(user_api_client, reservation):
    response = user_api_client.get(reverse("reservation_calendar-detail", kwargs={"pk": reservation.pk}))
    assert response.status_code == 400


def test_getting_reservation_calendar_with_invalid_hash(user_api_client, reservation):
    base_url = reverse("reservation_calendar-detail", kwargs={"pk": reservation.pk})
    url = f"{base_url}?hash={hmac_signature('this-does-not-exist')}"
    response = user_api_client.get(url)
    assert response.status_code == 400
