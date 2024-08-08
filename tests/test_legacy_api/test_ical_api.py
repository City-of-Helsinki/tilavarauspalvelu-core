import datetime
import io

import pytest
from rest_framework.reverse import reverse
from rest_framework.test import APIClient

from api.legacy_rest_api.utils import hmac_signature
from tests.factories import ReservationFactory, UserFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_ical():
    user = UserFactory.create()

    api_client = APIClient()
    api_client.force_authenticate(user=user)

    reservation_1 = ReservationFactory.create()
    reservation_2 = ReservationFactory.create()

    base_url = reverse("reservation_calendar-detail", kwargs={"pk": reservation_1.pk})
    url = f"{base_url}?hash={hmac_signature(f'reservation-{reservation_1.pk}')}"

    response = api_client.get(url)

    assert response.status_code == 200
    zip_content = io.BytesIO(b"".join(response.streaming_content)).read().decode("utf-8")

    expected_summary = "SUMMARY:" + reservation_1.get_ical_summary().replace("\n", "\\n")
    expected_description = "DESCRIPTION:" + reservation_1.get_ical_description().replace("\n", "\\n")
    expected_start = f"DTSTART:{reservation_1.begin.astimezone(datetime.UTC).strftime('%Y%m%dT%H%M%SZ')}"
    unexpected_start = f"DTSTART:{reservation_2.begin.astimezone(datetime.UTC).strftime('%Y%m%dT%H%M%SZ')}"

    assert expected_summary in zip_content
    assert expected_description in zip_content
    assert expected_start in zip_content
    assert unexpected_start not in zip_content


def test_reservation_ical__without_hash():
    user = UserFactory.create()

    api_client = APIClient()
    api_client.force_authenticate(user=user)

    reservation = ReservationFactory.create()

    response = api_client.get(reverse("reservation_calendar-detail", kwargs={"pk": reservation.pk}))
    assert response.status_code == 400


def test_reservation_ical__with_invalid_hash():
    user = UserFactory.create()

    api_client = APIClient()
    api_client.force_authenticate(user=user)

    reservation = ReservationFactory.create()

    base_url = reverse("reservation_calendar-detail", kwargs={"pk": reservation.pk})
    url = f"{base_url}?hash={hmac_signature('this-does-not-exist')}"
    response = api_client.get(url)
    assert response.status_code == 400
