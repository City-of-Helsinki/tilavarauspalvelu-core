from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationSeriesFactory
from tests.helpers import patch_method

from .helpers import REPAIR_ACCESS_CODE_STAFF_MUTATION

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.sync_access_code)
@patch_method(EmailService.send_reservation_access_code_added_email)
def test_staff_repair_access_code(graphql):
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=now,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(hours=1),
        ends_at=now + datetime.timedelta(hours=2),
    )

    def hook(obj: Reservation) -> None:
        obj.access_code_is_active = True
        obj.save(update_fields=["access_code_is_active"])

    PindoraService.sync_access_code.side_effect = hook

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at is not None

    assert PindoraService.sync_access_code.call_count == 1
    assert EmailService.send_reservation_access_code_added_email.call_count == 1


@patch_method(PindoraService.sync_access_code)
@patch_method(EmailService.send_reservation_access_code_added_email)
def test_staff_repair_access_code__was_active(graphql):
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=now,
        access_code_is_active=True,
        begins_at=now + datetime.timedelta(hours=1),
        ends_at=now + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at is not None

    assert PindoraService.sync_access_code.call_count == 1
    # Access code was already active, so no email should be sent
    assert EmailService.send_reservation_access_code_added_email.call_count == 0


def test_staff_repair_access_code__access_type_not_access_code(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.UNRESTRICTED,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation access type does not use access codes."]


def test_staff_repair_access_code__in_series(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
        reservation_series=ReservationSeriesFactory.create(),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be in a reservation series."]


@patch_method(PindoraService.sync_access_code)
@patch_method(EmailService.send_reservation_access_code_added_email)
def test_staff_repair_access_code__ongoing(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        begins_at=local_datetime() - datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=1),
    )

    def hook(obj: Reservation) -> None:
        obj.access_code_is_active = True
        obj.save(update_fields=["access_code_is_active"])

    PindoraService.sync_access_code.side_effect = hook

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert EmailService.send_reservation_access_code_added_email.call_count == 1


@patch_method(PindoraService.sync_access_code)
def test_staff_repair_access_code__has_ended(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() - datetime.timedelta(hours=2),
        ends_at=local_datetime() - datetime.timedelta(hours=1),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation has already ended."]


@patch_method(PindoraService.sync_access_code, side_effect=PindoraAPIError("Pindora Error"))
def test_staff_repair_access_code__pindora_call_fails(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Pindora Error"]

    assert PindoraService.sync_access_code.call_count == 1
