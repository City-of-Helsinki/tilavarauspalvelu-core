from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.models import ReservationUnit
from utils.date_utils import combine, local_date, local_datetime, local_time

from tests.factories import ReservationFactory, ReservationUnitAccessTypeFactory, ReservationUnitFactory
from tests.helpers import patch_method

from .helpers import (
    CREATE_MUTATION,
    UPDATE_MUTATION,
    get_create_draft_input_data,
    get_create_non_draft_input_data,
    get_draft_update_input_data,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__create__access_types(graphql):
    today = local_date()

    data = get_create_draft_input_data()
    data["accessTypes"] = [
        {
            "beginDate": today.isoformat(),
            "accessType": AccessType.OPENED_BY_STAFF.value,
        },
        {
            "beginDate": (today + datetime.timedelta(days=1)).isoformat(),
            "accessType": AccessType.UNRESTRICTED.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])

    access_type = list(reservation_unit.access_types.order_by("begin_date").all())
    assert len(access_type) == 2

    assert access_type[0].access_type == AccessType.OPENED_BY_STAFF
    assert access_type[1].access_type == AccessType.UNRESTRICTED


def test_reservation_unit__create__access_types__not_access_code(graphql):
    today = local_date()

    data = get_create_draft_input_data()
    data["accessTypes"] = [
        {
            "beginDate": today.isoformat(),
            "accessType": AccessType.ACCESS_CODE.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Cannot set access type to access code on reservation unit create."]


def test_reservation_unit__create__access_types__not_in_the_past(graphql):
    today = local_date()

    data = get_create_draft_input_data()
    data["accessTypes"] = [
        {
            "beginDate": (today - datetime.timedelta(days=1)).isoformat(),
            "accessType": AccessType.OPENED_BY_STAFF.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Access type cannot be created in the past."]


def test_reservation_unit__create__access_types__published(graphql):
    data = get_create_non_draft_input_data()

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])

    access_type = list(reservation_unit.access_types.order_by("begin_date").all())
    assert len(access_type) == 1

    assert access_type[0].access_type == AccessType.UNRESTRICTED


def test_reservation_unit__create__access_types__published__no_active_access_type(graphql):
    data = get_create_non_draft_input_data()
    data["accessTypes"] = []

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["At least one active access type is required."]


def test_reservation_unit__update__access_types(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=local_date() - datetime.timedelta(days=1),
        access_type=AccessType.PHYSICAL_KEY,
    )

    today = local_date()

    data = get_draft_update_input_data(reservation_unit=reservation_unit)
    data["accessTypes"] = [
        {
            "pk": access_type.pk,
            "beginDate": access_type.begin_date.isoformat(),
            "accessType": AccessType.PHYSICAL_KEY.value,
        },
        {
            "beginDate": today.isoformat(),
            "accessType": AccessType.OPENED_BY_STAFF.value,
        },
        {
            "beginDate": (today + datetime.timedelta(days=1)).isoformat(),
            "accessType": AccessType.UNRESTRICTED.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])

    access_type = list(reservation_unit.access_types.order_by("begin_date").all())
    assert len(access_type) == 3

    assert access_type[0].access_type == AccessType.PHYSICAL_KEY
    assert access_type[1].access_type == AccessType.OPENED_BY_STAFF
    assert access_type[2].access_type == AccessType.UNRESTRICTED


@pytest.mark.parametrize("started_days_ago", [0, 1])
def test_reservation_unit__update__access_types__cannot_change_access_type_begin_date(graphql, started_days_ago):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    today = local_date() - datetime.timedelta(days=started_days_ago)

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=today,
        access_type=AccessType.PHYSICAL_KEY,
    )

    data = get_draft_update_input_data(reservation_unit=reservation_unit)
    data["accessTypes"] = [
        {
            "pk": access_type.pk,
            "beginDate": (today + datetime.timedelta(days=1)).isoformat(),
            "accessType": AccessType.PHYSICAL_KEY.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Past of active access type begin date cannot be changed."]


def test_reservation_unit__update__access_types__cannot_move_to_the_past(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    today = local_date()

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=today,
        access_type=AccessType.PHYSICAL_KEY,
    )
    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=today + datetime.timedelta(days=1),
        access_type=AccessType.PHYSICAL_KEY,
    )

    data = get_draft_update_input_data(reservation_unit=reservation_unit)
    data["accessTypes"] = [
        {
            "pk": access_type.pk,
            "beginDate": (today - datetime.timedelta(days=1)).isoformat(),
            "accessType": AccessType.PHYSICAL_KEY.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Access type cannot be moved to the past."]


@freeze_time(local_datetime(2023, 1, 1, hour=0))
def test_reservation_unit__update__access_types__set_new_access_type_to_reservations(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    today = local_date(2023, 1, 1)

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=local_date(),
        access_type=AccessType.PHYSICAL_KEY,
    )

    past_reservation = ReservationFactory.create(
        begin=combine(today - datetime.timedelta(days=1), local_time(12)),
        end=combine(today - datetime.timedelta(days=1), local_time(13)),
        access_type=AccessType.PHYSICAL_KEY,
        reservation_units=[reservation_unit],
    )
    todays_reservation = ReservationFactory.create(
        begin=combine(today, local_time(12)),
        end=combine(today, local_time(13)),
        access_type=AccessType.PHYSICAL_KEY,
        reservation_units=[reservation_unit],
    )
    future_reservation = ReservationFactory.create(
        begin=combine(today + datetime.timedelta(days=1), local_time(12)),
        end=combine(today + datetime.timedelta(days=1), local_time(13)),
        access_type=AccessType.PHYSICAL_KEY,
        reservation_units=[reservation_unit],
    )

    today = local_date()

    graphql.login_with_superuser()

    data = get_draft_update_input_data(reservation_unit=reservation_unit)
    data["accessTypes"] = [
        {
            "pk": access_type.pk,
            "beginDate": today.isoformat(),
            "accessType": AccessType.OPENED_BY_STAFF.value,
        },
    ]

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    past_reservation.refresh_from_db()
    assert past_reservation.access_type == AccessType.PHYSICAL_KEY

    todays_reservation.refresh_from_db()
    assert todays_reservation.access_type == AccessType.OPENED_BY_STAFF

    future_reservation.refresh_from_db()
    assert future_reservation.access_type == AccessType.OPENED_BY_STAFF


@patch_method(PindoraClient.get_reservation_unit)
def test_reservation_unit__update__access_types__check_from_pindora__switch_to_access_code(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=local_date() - datetime.timedelta(days=1),
        access_type=AccessType.PHYSICAL_KEY,
    )

    data = get_draft_update_input_data(reservation_unit=reservation_unit)
    data["accessTypes"] = [
        {
            "pk": access_type.pk,
            "beginDate": access_type.begin_date.isoformat(),
            "accessType": AccessType.ACCESS_CODE.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraClient.get_reservation_unit.call_count == 1


@patch_method(PindoraClient.get_reservation_unit)
def test_reservation_unit__update__access_types__check_from_pindora__new_access_type(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    today = local_date()

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=today - datetime.timedelta(days=1),
        access_type=AccessType.PHYSICAL_KEY,
    )

    data = get_draft_update_input_data(reservation_unit=reservation_unit)
    data["accessTypes"] = [
        {
            "pk": access_type.pk,
            "beginDate": access_type.begin_date.isoformat(),
            "accessType": AccessType.PHYSICAL_KEY.value,
        },
        {
            "beginDate": (today + datetime.timedelta(days=1)).isoformat(),
            "accessType": AccessType.ACCESS_CODE.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraClient.get_reservation_unit.call_count == 1


@patch_method(PindoraClient.get_reservation_unit)
def test_reservation_unit__update__access_types__dont_check_from_pindora__still_access_code(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=local_date() - datetime.timedelta(days=1),
        access_type=AccessType.ACCESS_CODE,
    )

    data = get_draft_update_input_data(reservation_unit=reservation_unit)
    data["accessTypes"] = [
        {
            "pk": access_type.pk,
            "beginDate": access_type.begin_date.isoformat(),
            "accessType": AccessType.ACCESS_CODE.value,
        },
    ]

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraClient.get_reservation_unit.call_count == 0


def test_reservation_unit__update__access_types__future_one_is_deleted(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    today = local_date()

    active_access_type = ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=today - datetime.timedelta(days=1),
        access_type=AccessType.PHYSICAL_KEY,
    )

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=today + datetime.timedelta(days=1),
        access_type=AccessType.UNRESTRICTED,
    )

    data = get_draft_update_input_data(reservation_unit=reservation_unit)
    data["accessTypes"] = []

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])

    access_type = list(reservation_unit.access_types.order_by("begin_date").all())
    assert len(access_type) == 1
    assert access_type[0].pk == active_access_type.pk
