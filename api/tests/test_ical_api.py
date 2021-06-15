import io
import uuid

import pytest
from assertpy import assert_that
from rest_framework.reverse import reverse

from api.ical_api import uuid_to_hmac_signature


@pytest.mark.django_db
def test_regular_user_cant_get_url(user_api_client, reservation_unit):
    response = user_api_client.get(
        reverse(
            "reservation_unit_calendar_url-detail", kwargs={"pk": reservation_unit.id}
        )
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_unit_group_admin_can_get_calendar_url(
    unit_group_admin_api_client, reservation_unit
):
    response = unit_group_admin_api_client.get(
        reverse(
            "reservation_unit_calendar_url-detail", kwargs={"pk": reservation_unit.id}
        )
    )

    assert response.status_code == 200
    assert response.data.get("calendar_url") == (
        f"http://testserver/v1/reservation_unit_calendar/{reservation_unit.id}"
        f"/?hash={uuid_to_hmac_signature(reservation_unit.uuid)}"
    )


@pytest.mark.django_db
def test_unit_manager_can_get_calendar_url(unit_manager_api_client, reservation_unit):
    response = unit_manager_api_client.get(
        reverse(
            "reservation_unit_calendar_url-detail", kwargs={"pk": reservation_unit.id}
        )
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_getting_reservation_unit_calendar(
    user_api_client,
    reservation_unit,
    reservation,
    reservation_in_second_unit,
    set_ical_secret,
):
    base_url = reverse(
        "reservation_unit_calendar-detail", kwargs={"pk": reservation_unit.id}
    )
    url = f"{base_url}?hash={uuid_to_hmac_signature(reservation_unit.uuid)}"
    response = user_api_client.get(url)
    assert response.status_code == 200
    zip_content = (
        io.BytesIO(b"".join(response.streaming_content)).read().decode("utf-8")
    )

    expected_start = (
        f"DTSTART;VALUE=DATE-TIME:{reservation.begin.strftime('%Y%m%dT%H%M%SZ')}"
    )
    unexpected_start = f"DTSTART;VALUE=DATE-TIME:{reservation_in_second_unit.begin.strftime('%Y%m%dT%H%M%SZ')}"

    assert_that(expected_start in zip_content).is_true()
    assert_that(unexpected_start in zip_content).is_false()


@pytest.mark.django_db
def test_getting_reservation_unit_calendar_without_hash(
    user_api_client,
    reservation_unit,
    reservation,
    reservation_in_second_unit,
    set_ical_secret,
):
    response = user_api_client.get(
        reverse("reservation_unit_calendar-detail", kwargs={"pk": reservation_unit.id})
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_getting_reservation_unit_calendar_with_invalid_hash(
    user_api_client,
    reservation_unit,
    reservation,
    reservation_in_second_unit,
    set_ical_secret,
):
    base_url = reverse(
        "reservation_unit_calendar-detail", kwargs={"pk": reservation_unit.id}
    )
    url = f"{base_url}?hash={uuid_to_hmac_signature(uuid.uuid4())}"
    response = user_api_client.get(url)
    assert response.status_code == 400


@pytest.mark.django_db
def test_getting_application_event_calendar_name_for_organisation(
    user_api_client,
    application_event,
    organisation,
):
    application_event.application.organization = organisation
    response = user_api_client.get(
        reverse(
            "application_event_calendar-detail", kwargs={"pk": application_event.uuid}
        )
    )

    zip_content = (
        io.BytesIO(b"".join(response.streaming_content)).read().decode("utf-8")
    )

    assert_that(response.status_code).is_equal_to(200)
    assert_that(organisation.name in zip_content).is_true()


@pytest.mark.django_db
def test_getting_application_event_calendar_name_for_contact_person(
    user_api_client, application_event, person
):
    application_event.application.contact_person = person
    application_event.application.organisation = None
    application_event.application.save()
    response = user_api_client.get(
        reverse(
            "application_event_calendar-detail", kwargs={"pk": application_event.uuid}
        )
    )

    zip_content = (
        io.BytesIO(b"".join(response.streaming_content)).read().decode("utf-8")
    )

    assert_that(response.status_code).is_equal_to(200)
    assert_that(person.first_name in zip_content).is_true()
    assert_that(person.last_name in zip_content).is_true()


@pytest.mark.django_db
def test_getting_application_event_should_give_404_when_not_found(
    user_api_client, application_event, person
):
    response = user_api_client.get(
        reverse(
            "application_event_calendar-detail",
            kwargs={"pk": "a301b49f-89f5-4b9a-ac90-cd27815b3581"},
        )
    )

    assert_that(response.status_code).is_equal_to(404)
