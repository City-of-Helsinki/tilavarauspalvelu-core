import pytest
import datetime

from django.urls import reverse

from reservations.models import Reservation


@pytest.mark.django_db
def test_application_period_fetch(user_api_client, application_period):
    response = user_api_client.get(reverse("application_period-list"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("id") == application_period.id
