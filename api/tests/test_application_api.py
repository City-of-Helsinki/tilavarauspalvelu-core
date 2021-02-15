import pytest
from rest_framework.reverse import reverse

from applications.models import Application, ApplicationEvent


@pytest.mark.django_db
def test_application_create(
    application_round,
    user_api_client,
):
    assert Application.objects.count() == 0
    data = {
        "applicant_type": "company",
        "organisation": {
            "id": None,
            "identifier": "123-identifier",
            "name": "Super organisation",
            "address": {
                "street_address": "Testikatu 28",
                "post_code": 33540,
                "city": "Tampere",
            },
        },
        "contact_person": {
            "id": None,
            "first_name": "John",
            "last_name": "Wayne",
            "email": "john@test.com",
            "phone_number": "123-123",
        },
        "application_round_id": application_round.id,
        "application_events": [],
        "status": "draft",
        "billing_address": {
            "street_address": "Laskukatu 1c",
            "post_code": 33540,
            "city": "Tampere",
        },
    }
    response = user_api_client.post(reverse("application-list"), data, format="json")
    assert response.status_code == 201

    assert response.data["organisation"]["identifier"] == "123-identifier"
    assert response.data["contact_person"]["email"] == "john@test.com"
    assert response.data["organisation"]["address"]["street_address"] == "Testikatu 28"
    assert response.data["billing_address"]["street_address"] == "Laskukatu 1c"
    assert Application.objects.count() == 1


@pytest.mark.django_db
def test_application_update_should_update_organisation_and_contact_person(
    user_api_client, application, organisation, person, purpose, application_round
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "applicant_type": "company",
        "organisation": {
            "id": organisation.id,
            "identifier": organisation.identifier,
            "name": "Super organisation modified",
            "address": None,
        },
        "contact_person": {
            "id": person.id,
            "first_name": person.first_name,
            "last_name": "The modified",
            "email": person.email,
            "phone_number": person.phone_number,
        },
        "application_round_id": application_round.id,
        "application_events": [],
        "status": "draft",
        "billing_address": None,
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
    user_api_client, application, organisation, person, purpose, application_round
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_INDIVIDUAL,
        "organisation": None,
        "contact_person": None,
        "application_round_id": application_round.id,
        "application_events": [],
        "status": "draft",
        "billing_address": None,
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
def test_application_update_updating_and_adding_application_events(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    application_event,
    valid_application_event_data,
):
    assert Application.objects.count() == 1
    application_event.num_persons = 20

    existing_event = dict(valid_application_event_data)
    existing_event["id"] = application_event.id
    existing_event["name"] = "Updated name"
    existing_event["num_persons"] = 112
    existing_event["application_event_schedules"] = [
        {"day": 3, "begin": "10:40", "end": "16:30"}
    ]

    valid_application_event_data["name"] = "New event name"
    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_INDIVIDUAL,
        "organisation": None,
        "contact_person": None,
        "application_round_id": application_round.id,
        "application_events": [existing_event, valid_application_event_data],
        "status": "draft",
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200
    assert len(response.data.get("application_events")) == 2
    assert response.data.get("application_events")[0].get("num_persons") == 112
    assert response.data.get("application_events")[0].get("name") == "Updated name"
    assert (
        response.data.get("application_events")[0]
        .get("application_event_schedules")[0]
        .get("day")
        == 3
    )

    assert response.data.get("application_events")[1].get("name") == "New event name"


@pytest.mark.django_db
def test_application_update_should_remove_application_events_if_no_longer_in_data(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    application_event,
    valid_application_event_data,
):
    assert Application.objects.count() == 1
    application_event.num_persons = 20

    valid_application_event_data["name"] = "New event name"
    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_INDIVIDUAL,
        "organisation": None,
        "contact_person": None,
        "application_round_id": application_round.id,
        "application_events": [valid_application_event_data],
        "status": "draft",
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200
    assert len(response.data.get("application_events")) == 1

    assert response.data.get("application_events")[0].get("name") == "New event name"


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
def test_application_update_review_valid(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    valid_application_event_data,
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_COMPANY,
        "organisation": {
            "id": organisation.id,
            "identifier": organisation.identifier,
            "name": "Super organisation modified",
            "address": {
                "street_address": "Osoitetie 11b",
                "post_code": 33540,
                "city": "Tampere",
            },
        },
        "contact_person": {
            "id": person.id,
            "first_name": person.first_name,
            "last_name": "The modified",
            "email": person.email,
            "phone_number": person.phone_number,
        },
        "application_round_id": application_round.id,
        "application_events": [valid_application_event_data],
        "status": "in_review",
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_application_review_invalid(
    purpose,
    application_round,
    user_api_client,
    user,
):
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
        "application_round_id": application_round.id,
        "application_events": [],
        "status": "review",
    }
    response = user_api_client.post(reverse("application-list"), data, format="json")
    assert response.status_code == 400
