from __future__ import annotations

import datetime
from typing import Any

import pytest
from django.urls import reverse
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.models import ReservationUnit
from utils.date_utils import combine, local_date, local_datetime, local_time

from tests.factories import (
    ReservationFactory,
    ReservationUnitAccessTypeFactory,
    ReservationUnitFactory,
    TaxPercentageFactory,
    UnitFactory,
    UserFactory,
)
from tests.helpers import patch_method
from tests.test_admin.helpers import (
    collect_admin_form_errors,
    management_form_data,
    required_reservation_unit_form_data,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_admin__access_types(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation_unit = ReservationUnitFactory.create()

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-access_type": AccessType.UNRESTRICTED.value,
        "access_types-0-begin_date": local_date().isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1),
    }
    response = api_client.post(path=url, data=data)

    # Response is a redirect to the list view
    assert response.status_code == 302
    assert response.url == reverse("admin:tilavarauspalvelu_reservationunit_changelist")

    reservation_unit.refresh_from_db()

    access_types = reservation_unit.access_types.all()
    assert len(access_types) == 1
    assert access_types[0].access_type == AccessType.UNRESTRICTED
    assert access_types[0].begin_date == local_date()


def test_reservation_unit_admin__access_types__set_to_past(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    reservation_unit = ReservationUnitFactory.create()

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-access_type": AccessType.UNRESTRICTED.value,
        "access_types-0-begin_date": (local_date() - datetime.timedelta(days=1)).isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # There are errors in the form, so we stay on the form page
    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Access type cannot be created in the past.",
        },
    ]


def test_reservation_unit_admin__access_types__move_past_begin_date(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)
    today = local_date()

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    reservation_unit = ReservationUnitFactory.create()

    access_type_1 = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.PHYSICAL_KEY,
        begin_date=today,
    )
    access_type_2 = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.OPENED_BY_STAFF,
        begin_date=today - datetime.timedelta(days=1),
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-id": access_type_1.id,
        "access_types-0-access_type": AccessType.PHYSICAL_KEY.value,
        "access_types-0-begin_date": today.isoformat(),
        "access_types-1-id": access_type_2.id,
        "access_types-1-access_type": AccessType.UNRESTRICTED.value,
        "access_types-1-begin_date": (today - datetime.timedelta(days=7)).isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=2, initial_forms=2),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # There are errors in the form, so we stay on the form page
    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Past of active access type begin date cannot be changed.",
        },
    ]


def test_reservation_unit_admin__access_types__move_active_begin_date(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)
    today = local_date()

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    reservation_unit = ReservationUnitFactory.create()

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.PHYSICAL_KEY,
        begin_date=today,
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-id": access_type.id,
        "access_types-0-access_type": AccessType.OPENED_BY_STAFF.value,
        "access_types-0-begin_date": (today - datetime.timedelta(days=1)).isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1, initial_forms=1),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # There are errors in the form, so we stay on the form page
    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Past of active access type begin date cannot be changed.",
        },
    ]


def test_reservation_unit_admin__access_types__move_begin_date_to_past(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    reservation_unit = ReservationUnitFactory.create()

    access_type_1 = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.OPENED_BY_STAFF,
        begin_date=local_date(),
    )

    access_type_2 = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.PHYSICAL_KEY,
        begin_date=(local_date() + datetime.timedelta(days=1)),
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-id": access_type_1.id,
        "access_types-0-access_type": access_type_1.access_type.value,
        "access_types-0-begin_date": access_type_1.begin_date.isoformat(),
        "access_types-1-id": access_type_2.id,
        "access_types-1-access_type": access_type_2.access_type.value,
        "access_types-1-begin_date": (local_date() - datetime.timedelta(days=1)).isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=2, initial_forms=2),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # There are errors in the form, so we stay on the form page
    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Access type cannot be moved to the past.",
        },
    ]


def test_reservation_unit_admin__access_types__no_active_access_type(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)
    today = local_date()

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    reservation_unit = ReservationUnitFactory.create()

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.PHYSICAL_KEY,
        begin_date=today + datetime.timedelta(days=1),
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-id": access_type.id,
        "access_types-0-access_type": AccessType.PHYSICAL_KEY.value,
        "access_types-0-begin_date": (today + datetime.timedelta(days=1)).isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1, initial_forms=1),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # There are errors in the form, so we stay on the form page
    assert response.status_code == 200
    assert errors == [
        {
            "code": "RESERVATION_UNIT_MISSING_ACTIVE_ACCESS_TYPE",
            "message": "At least one active access type is required.",
        },
    ]


@patch_method(PindoraClient.get_reservation_unit)
def test_reservation_unit_admin__access_types__access_code_checks_pindora(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation_unit = ReservationUnitFactory.create()

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.OPENED_BY_STAFF,
        begin_date=local_date(),
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-id": access_type.id,
        "access_types-0-access_type": AccessType.ACCESS_CODE.value,
        "access_types-0-begin_date": local_date().isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1, initial_forms=1),
    }
    response = api_client.post(path=url, data=data)

    # Response is a redirect to the list view
    assert response.status_code == 302
    assert response.url == reverse("admin:tilavarauspalvelu_reservationunit_changelist")

    reservation_unit.refresh_from_db()

    access_types = reservation_unit.access_types.all()
    assert len(access_types) == 1
    assert access_types[0].access_type == AccessType.ACCESS_CODE
    assert access_types[0].begin_date == local_date()

    assert PindoraClient.get_reservation_unit.call_count == 1


@patch_method(PindoraClient.get_reservation_unit)
def test_reservation_unit_admin__access_types__already_access_code_skips_pindora_check(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation_unit = ReservationUnitFactory.create()

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=local_date(),
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-id": access_type.id,
        "access_types-0-access_type": AccessType.ACCESS_CODE.value,
        "access_types-0-begin_date": local_date().isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1, initial_forms=1),
    }
    response = api_client.post(path=url, data=data)

    # Response is a redirect to the list view
    assert response.status_code == 302
    assert response.url == reverse("admin:tilavarauspalvelu_reservationunit_changelist")

    reservation_unit.refresh_from_db()

    access_types = reservation_unit.access_types.all()
    assert len(access_types) == 1
    assert access_types[0].access_type == AccessType.ACCESS_CODE

    # Pindora still called in form init...
    assert PindoraClient.get_reservation_unit.call_count == 1


@freeze_time(local_datetime(2023, 1, 1, hour=0))
def test_reservation_unit_admin__access_types__set_new_access_type_to_reservations(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    today = local_date(2023, 1, 1)

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    reservation_unit = ReservationUnitFactory.create()

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.PHYSICAL_KEY,
        begin_date=today,
    )

    past_reservation = ReservationFactory.create(
        begins_at=combine(today - datetime.timedelta(days=1), local_time(12)),
        ends_at=combine(today - datetime.timedelta(days=1), local_time(13)),
        access_type=AccessType.PHYSICAL_KEY,
        reservation_unit=reservation_unit,
    )
    todays_reservation = ReservationFactory.create(
        begins_at=combine(today, local_time(12)),
        ends_at=combine(today, local_time(13)),
        access_type=AccessType.PHYSICAL_KEY,
        reservation_unit=reservation_unit,
    )
    future_reservation = ReservationFactory.create(
        begins_at=combine(today + datetime.timedelta(days=1), local_time(12)),
        ends_at=combine(today + datetime.timedelta(days=1), local_time(13)),
        access_type=AccessType.PHYSICAL_KEY,
        reservation_unit=reservation_unit,
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-id": access_type.id,
        "access_types-0-access_type": AccessType.UNRESTRICTED.value,
        "access_types-0-begin_date": today.isoformat(),
        "access_types-1-access_type": AccessType.OPENED_BY_STAFF.value,
        "access_types-1-begin_date": (today + datetime.timedelta(days=1)).isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=2, initial_forms=1),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # Response is a redirect to the list view
    assert response.status_code == 302
    assert response.url == reverse("admin:tilavarauspalvelu_reservationunit_changelist")

    past_reservation.refresh_from_db()
    assert past_reservation.access_type == AccessType.PHYSICAL_KEY

    todays_reservation.refresh_from_db()
    assert todays_reservation.access_type == AccessType.UNRESTRICTED

    future_reservation.refresh_from_db()
    assert future_reservation.access_type == AccessType.OPENED_BY_STAFF


def test_reservation_unit_admin__access_types__cannot_delete_active(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    reservation_unit = ReservationUnitFactory.create()

    today = local_date()

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.PHYSICAL_KEY,
        begin_date=today,
    )

    url = reverse("admin:tilavarauspalvelu_reservationunit_change", args=[reservation_unit.pk])
    data = {
        #
        # Inline form data
        "access_types-0-id": access_type.id,
        "access_types-0-access_type": access_type.access_type.value,
        "access_types-0-begin_date": access_type.begin_date.isoformat(),
        "access_types-0-DELETE": True,
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1, initial_forms=1),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # There are errors in the form, so we stay on the form page
    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Cannot delete past or active access type.",
        },
    ]


def test_reservation_unit_admin__access_types__new(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.build(unit=unit)

    url = reverse("admin:tilavarauspalvelu_reservationunit_add")
    data = {
        #
        # Inline form data
        "access_types-0-access_type": AccessType.UNRESTRICTED.value,
        "access_types-0-begin_date": local_date().isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1),
    }
    response = api_client.post(path=url, data=data)

    # Response is a redirect to the list view
    assert response.status_code == 302
    assert response.url == reverse("admin:tilavarauspalvelu_reservationunit_changelist")

    reservation_unit = ReservationUnit.objects.first()

    access_types = reservation_unit.access_types.all()
    assert len(access_types) == 1
    assert access_types[0].access_type == AccessType.UNRESTRICTED
    assert access_types[0].begin_date == local_date()


def test_reservation_unit_admin__access_types__new__access_code(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.build(unit=unit)

    url = reverse("admin:tilavarauspalvelu_reservationunit_add")
    data = {
        #
        # Inline form data
        "access_types-0-access_type": AccessType.ACCESS_CODE.value,
        "access_types-0-begin_date": local_date().isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # There are errors in the form, so we stay on the form page
    assert response.status_code == 200

    assert errors == [
        {
            "code": "",
            "message": "Cannot set access type to access code on reservation unit create.",
        },
    ]


@patch_method(PindoraClient.get_reservation_unit)
def test_reservation_unit_admin__access_types__new__cannot_be_access_type_on_create(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    # Needed to get default tax percentage
    TaxPercentageFactory.create()

    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.build(unit=unit)

    url = reverse("admin:tilavarauspalvelu_reservationunit_add")
    data = {
        #
        # Inline form data
        "access_types-0-access_type": AccessType.ACCESS_CODE.value,
        "access_types-0-begin_date": local_date().isoformat(),
        #
        # Required fields
        **required_reservation_unit_form_data(reservation_unit),
        **management_form_data("access_types", total_forms=1),
    }

    errors: list[dict[str, Any]] = []

    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    # There are errors in the form, so we stay on the form page
    assert response.status_code == 200

    assert errors == [
        {
            "code": "",
            "message": "Cannot set access type to access code on reservation unit create.",
        },
    ]
