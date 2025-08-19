from __future__ import annotations

import uuid

import pytest
from django.urls import reverse
from freezegun import freeze_time

from tilavarauspalvelu.enums import UserRoleChoice
from utils.date_utils import local_datetime
from utils.utils import get_query_params, update_query_params

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory, UnitFactory, UserFactory


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__single_reservation_unit(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )

    user = UserFactory.create_superuser(email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=reservation_unit.pk,
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    assert response.status_code == 302
    assert response.url == (
        "https://fake.test.hauki.admin.com/resource/test-origin%3Af08dcb9f-9765-4747-b0c8-6d472326e562/"
        "?hsa_source=test-origin"
        "&hsa_username=test.user%40varaamo.fi"
        "&hsa_organization=tprek%3A1234"
        "&hsa_created_at=2024-01-01T00%3A00%3A00%2B02%3A00"
        "&hsa_valid_until=2024-01-01T00%3A30%3A00%2B02%3A00"
        "&hsa_resource=test-origin%3Af08dcb9f-9765-4747-b0c8-6d472326e562"
        "&hsa_has_organization_rights=true"
        "&hsa_signature=8d9dc19ae6332d50477cf80f5a853a995b3cf4a17f32da5571ed2f7d10cb9edf"
    )


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__multiple_reservation_units(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit_1 = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )
    reservation_unit_2 = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("b06643c1-955f-45b3-8372-ec29fa03a778"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )

    user = UserFactory.create_superuser(email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=f"{reservation_unit_1.pk},{reservation_unit_2.pk}",
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    assert response.status_code == 302
    assert response.url == (
        "https://fake.test.hauki.admin.com/resource/test-origin%3Af08dcb9f-9765-4747-b0c8-6d472326e562/"
        "?hsa_source=test-origin"
        "&hsa_username=test.user%40varaamo.fi"
        "&hsa_organization=tprek%3A1234"
        "&hsa_created_at=2024-01-01T00%3A00%3A00%2B02%3A00"
        "&hsa_valid_until=2024-01-01T00%3A30%3A00%2B02%3A00"
        "&hsa_resource=test-origin%3Af08dcb9f-9765-4747-b0c8-6d472326e562"
        "&hsa_has_organization_rights=true"
        "&hsa_signature=8d9dc19ae6332d50477cf80f5a853a995b3cf4a17f32da5571ed2f7d10cb9edf"
        "&target_resources="
        "test-origin%3Af08dcb9f-9765-4747-b0c8-6d472326e562%2C"
        "test-origin%3Ab06643c1-955f-45b3-8372-ec29fa03a778"
    )


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__no_redirect_on_error(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )

    user = UserFactory.create_superuser(email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=reservation_unit.pk,
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Request should include a 'redirect_on_error' parameter for error handling.",
        "code": "REDIRECT_ON_ERROR_MISSING",
    }


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__not_logged_in(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=reservation_unit.pk,
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "User must be authenticated to use Hauki",
        "error_code": "HAUKI_USER_NOT_AUTHENTICATED",
    }


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__user_no_email(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )

    user = UserFactory.create_superuser(email="")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=reservation_unit.pk,
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "User does not have email address",
        "error_code": "HAUKI_USER_NO_EMAIL",
    }


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__no_reservation_unit(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")

    user = UserFactory.create_superuser(email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "No reservation units provided",
        "error_code": "HAUKI_MISSING_RESERVATION_UNITS",
    }


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__missing_reservation_unit(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )

    user = UserFactory.create_superuser(email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=f"0,{reservation_unit.pk}",
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Some of the reservation units could not be found: 0",
        "error_code": "HAUKI_INVALID_RESERVATION_UNITS",
    }


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__primary_unit_missing_department_id(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit_1 = UnitFactory.create(origin_hauki_resource=hauki_resource)
    reservation_unit_1 = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit_1,
    )
    # Secondary unit having department ID doesn't matter
    unit_2 = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit_2 = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("b06643c1-955f-45b3-8372-ec29fa03a778"),
        origin_hauki_resource=hauki_resource,
        unit=unit_2,
    )

    user = UserFactory.create_superuser(email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=f"{reservation_unit_1.pk},{reservation_unit_2.pk}",
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Primary reservation unit 'f08dcb9f-9765-4747-b0c8-6d472326e562' department ID is missing",
        "error_code": "HAUKI_DEPARTMENT_ID_MISSING",
    }


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__reservation_unit_missing_hauki_resource(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit_1 = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )
    reservation_unit_2 = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("b06643c1-955f-45b3-8372-ec29fa03a778"),
        origin_hauki_resource=None,
        unit=unit,
    )

    user = UserFactory.create_superuser(email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=f"{reservation_unit_1.pk},{reservation_unit_2.pk}",
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Reservation unit 'b06643c1-955f-45b3-8372-ec29fa03a778' is not linked to a Hauki resource",
        "error_code": "HAUKI_RESOURCE_NOT_LINKED",
    }


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__reservation_unit_permission_denied(api_client):
    hauki_resource = OriginHaukiResourceFactory.create()
    unit_1 = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit_1 = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit_1,
    )
    unit_2 = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="5678")
    reservation_unit_2 = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("b06643c1-955f-45b3-8372-ec29fa03a778"),
        origin_hauki_resource=hauki_resource,
        unit=unit_2,
    )

    user = UserFactory.create_with_unit_role(units=[unit_1], role=UserRoleChoice.ADMIN, email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=f"{reservation_unit_1.pk},{reservation_unit_2.pk}",
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": (
            "User does not have permission to manage reservation unit 'b06643c1-955f-45b3-8372-ec29fa03a778'"
        ),
        "error_code": "HAUKI_PERMISSIONS_DENIED",
    }


@pytest.mark.django_db
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_redirect_to_hauki__settings_missing(api_client, settings):
    settings.HAUKI_ADMIN_UI_URL = None

    hauki_resource = OriginHaukiResourceFactory.create()
    unit = UnitFactory.create(origin_hauki_resource=hauki_resource, tprek_department_id="1234")
    reservation_unit = ReservationUnitFactory.create(
        ext_uuid=uuid.UUID("f08dcb9f-9765-4747-b0c8-6d472326e562"),
        origin_hauki_resource=hauki_resource,
        unit=unit,
    )

    user = UserFactory.create_superuser(email="test.user@varaamo.fi")

    url = update_query_params(
        reverse("edit_opening_hours"),
        reservation_units=reservation_unit.pk,
        redirect_on_error="https://fake.varaamo.hel.fi",
        lang="en",
    )

    api_client.force_login(user)

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Could not generate Hauki link",
        "error_code": "HAUKI_URL_GENERATION_FAILED",
    }
