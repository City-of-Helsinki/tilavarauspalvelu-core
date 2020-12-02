from typing import List

import pytest
from django.utils import timezone
from rest_framework.reverse import reverse

from applications.models import Application


@pytest.mark.django_db
def test_application_create(
    purpose,
    reservation_purpose,
    organisation,
    person,
    application_period,
    user_api_client,
    user,
):
    assert Application.objects.count() == 0
    data = {
        "purpose": purpose.id,
        "reservation_purpose": reservation_purpose.id,
        "organisation": organisation.id,
        "contact_person": person.id,
        "application_period": application_period.id,
    }
    response = user_api_client.post(reverse("application-list"), data, format="json")
    assert response.status_code == 201
    assert response.data.get("user") == user.id
    assert Application.objects.count() == 1


@pytest.mark.django_db
def test_application_fetch(user_api_client, application):
    response = user_api_client.get(reverse("application-list"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("id") == application.id
    assert response.data[0].get("description") == "Application for exercise spaces"


@pytest.mark.django_db
def test_application_event_fetch_without_dates_should_return_all(
    user_api_client, weekly_recurring_mondays_and_tuesdays_2021
):
    response = user_api_client.get(reverse("applicationevent-list"))
    assert response.status_code == 200
    assert len(response.data) == 1

    recurrence: List[any] = response.data[0].get("recurrences")[0].get("recurrence")
    assert len(recurrence) == 104


@pytest.mark.django_db
def test_application_event_fetch_should_return_between_dates(
    user_api_client, weekly_recurring_mondays_and_tuesdays_2021
):
    start = timezone.datetime(2021, 6, 1, 0, 0, 0, 0, timezone.get_default_timezone())
    end = timezone.datetime(2021, 7, 1, 0, 0, 0, 0, timezone.get_default_timezone())
    response = user_api_client.get(
        reverse("applicationevent-list"), {"start": start, "end": end}
    )
    assert response.status_code == 200
    assert len(response.data) == 1

    recurrence: List[any] = response.data[0].get("recurrences")[0].get("recurrence")
    assert len(recurrence) == 8
