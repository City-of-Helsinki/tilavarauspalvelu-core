from typing import List

import pytest
from django.utils import timezone
from rest_framework.reverse import reverse

from applications.models import Application, ApplicationEvent


@pytest.mark.django_db
def test_application_create(
    purpose,
    application_period,
    user_api_client,
    user,
):
    assert Application.objects.count() == 0
    data = {
        "organisation": {
            "id": None,
            "identifier": "123-identifier",
            "name": "Super organisation",
        },
        "contact_person": {
            "id": None,
            "first_name": "John",
            "last_name": "Wayne",
            "email": "john@test.com",
            "phone_number": "123-123",
        },
        "application_period_id": application_period.id,
    }
    response = user_api_client.post(reverse("application-list"), data, format="json")
    assert response.status_code == 201

    assert response.data.get("organisation")["identifier"] == "123-identifier"
    assert response.data.get("contact_person")["email"] == "john@test.com"
    assert Application.objects.count() == 1


@pytest.mark.django_db
def test_application_update_should_update_organisation_and_contact_person(
    user_api_client, application, organisation, person, purpose, application_period
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "organisation": {
            "id": organisation.id,
            "identifier": organisation.identifier,
            "name": "Super organisation modified",
        },
        "contact_person": {
            "id": person.id,
            "first_name": person.first_name,
            "last_name": "The modified",
            "email": person.email,
            "phone_number": person.phone_number,
        },
        "application_period_id": application_period.id,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200
    assert response.data.get("contact_person")["id"] == person.id
    assert response.data.get("contact_person")["last_name"] == "The modified"

    assert response.data.get("organisation")["id"] == organisation.id
    assert response.data.get("organisation")["name"] == "Super organisation modified"


@pytest.mark.django_db
def test_application_update_should_null_organisation_and_contact_person(
    user_api_client, application, organisation, person, purpose, application_period
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "organisation": None,
        "contact_person": None,
        "application_period_id": application_period.id,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200
    assert response.data.get("contact_person") is None
    assert response.data.get("organisation") is None


@pytest.mark.django_db
def test_application_fetch(user_api_client, application):
    response = user_api_client.get(reverse("application-list"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("id") == application.id
    assert response.data[0].get("contact_person")["last_name"] == "Legend"


@pytest.mark.django_db
def test_application_event_save(user_api_client, valid_application_event_data):
    assert ApplicationEvent.objects.count() == 0
    data = valid_application_event_data

    response = user_api_client.post(
        reverse("application_event-list"), data=data, format="json"
    )

    assert response.status_code == 201

    assert response.data.get("min_duration") == "01:15:00"
    assert response.data.get("name") == valid_application_event_data["name"]
    assert ApplicationEvent.objects.count() == 1


@pytest.mark.django_db
def test_application_event_invalid_durations(
    user_api_client, valid_application_event_data
):
    assert ApplicationEvent.objects.count() == 0
    data = valid_application_event_data
    data["max_duration"] = "00:45:00"

    response = user_api_client.post(
        reverse("application_event-list"), data=data, format="json"
    )
    assert response.status_code == 400

    assert (
        "Maximum duration should be larger than minimum duration"
        in response.data["non_field_errors"]
    )


@pytest.mark.django_db
def test_application_event_fetch_without_dates_should_return_all(
    user_api_client, weekly_recurring_mondays_and_tuesdays_2021
):
    response = user_api_client.get(reverse("application_event-list"))
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
        reverse("application_event-list"), {"start": start, "end": end}
    )
    assert response.status_code == 200
    assert len(response.data) == 1

    recurrence: List[any] = response.data[0].get("recurrences")[0].get("recurrence")
    assert len(recurrence) == 8
