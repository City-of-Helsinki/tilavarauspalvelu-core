from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationNotification, ReservationStateChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationUnitHierarchy
from tilavarauspalvelu.models.reservation.actions import ReservationActions
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationUnitFactory, UserFactory
from tests.helpers import patch_method

from .helpers import REQUIRE_HANDLING_MUTATION, get_require_handling_data

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(SEND_EMAILS=True)
@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CONFIRMED,
        ReservationStateChoice.DENIED,
    ],
)
@patch_method(PindoraService.deactivate_access_code)
def test_reservation__requires_handling__allowed_states(graphql, outbox, state):
    reservation = ReservationFactory.create_for_requires_handling(state=state)

    # Admin will get notification
    UserFactory.create_with_unit_role(
        units=[reservation.reservation_units.first().unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 1
    assert outbox[0].subject == "Your booking is waiting for processing"

    assert PindoraService.deactivate_access_code.call_count == 0


@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CREATED,
        ReservationStateChoice.CANCELLED,
        ReservationStateChoice.REQUIRES_HANDLING,
        ReservationStateChoice.WAITING_FOR_PAYMENT,
    ],
)
def test_reservation__requires_handling__disallowed_states(graphql, state):
    reservation = ReservationFactory.create_for_requires_handling(state=state)

    # Admin will get notification
    UserFactory.create_with_unit_role(
        units=[reservation.reservation_units.first().unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be handled based on its state"]

    reservation.refresh_from_db()
    assert reservation.state == state


@patch_method(PindoraService.deactivate_access_code)
def test_reservation__requires_handling__pindora_api__call_succeeds(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert PindoraService.deactivate_access_code.call_count == 1


@patch_method(PindoraService.deactivate_access_code, side_effect=PindoraAPIError("Pindora API error"))
def test_reservation__requires_handling__pindora_api__call_fails(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    # Mutation didn't fail even if Pindora call failed.
    # Access code will be deactivated later in a background task.
    assert response.has_errors is False, response.errors

    assert PindoraService.deactivate_access_code.call_count == 1


@patch_method(PindoraService.deactivate_access_code, side_effect=PindoraNotFoundError("Error"))
@patch_method(SentryLogger.log_exception)
def test_reservation__requires_handling__pindora_api__call_fails__404(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    # Request is still successful if Pindora fails with 404
    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING
    assert reservation.access_code_is_active is True

    assert PindoraService.deactivate_access_code.call_count == 1

    assert SentryLogger.log_exception.called is True


def test_reservation__requires_handling__denied_overlaps_with_existing_reservation(graphql):
    now = local_datetime()
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    ReservationUnitHierarchy.refresh()

    ReservationFactory.create(
        begin=now + datetime.timedelta(hours=1),
        end=now + datetime.timedelta(hours=2),
        state=ReservationStateChoice.CONFIRMED,
        reservation_units=[reservation_unit],
    )
    reservation = ReservationFactory.create_for_requires_handling(
        begin=now + datetime.timedelta(hours=1),
        end=now + datetime.timedelta(hours=2),
        state=ReservationStateChoice.DENIED,
        reservation_units=[reservation_unit],
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)

    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__requires_handling__denied_overlaps_with_existing_reservation__after_mutation(graphql):
    now = local_datetime()
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    ReservationUnitHierarchy.refresh()

    reservation = ReservationFactory.create_for_reservation_unit(
        begin=now + datetime.timedelta(hours=1),
        end=now + datetime.timedelta(hours=2),
        state=ReservationStateChoice.DENIED,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)

    def callback(*args, **kwargs):
        ReservationFactory.create_for_reservation_unit(
            begin=now + datetime.timedelta(hours=1),
            end=now + datetime.timedelta(hours=2),
            state=ReservationStateChoice.CONFIRMED,
            reservation_unit=reservation_unit,
        )
        return Reservation.objects.filter(pk=reservation.pk)

    with patch_method(ReservationActions.overlapping_reservations, side_effect=callback):
        response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Overlapping reservations were created at the same time."]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__requires_handling__cancel_order_if_not_paid_yet(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        price=Decimal("12.4"),
        tax_percentage_value=Decimal("25.5"),
        payment_order__remote_id=None,
        payment_order__status=OrderStatus.PENDING,
        payment_order__handled_payment_due_by=local_datetime(),
        payment_order__price_net=Decimal("10.0"),
        payment_order__price_vat=Decimal("2.4"),
        payment_order__price_total=Decimal("12.4"),
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    payment_order = reservation.payment_order
    assert payment_order.status == OrderStatus.CANCELLED


def test_reservation__requires_handling__leave_order_paid(graphql):
    reservation = ReservationFactory.create_for_requires_handling(
        price=Decimal("12.4"),
        tax_percentage_value=Decimal("25.5"),
        payment_order__remote_id=uuid.uuid4(),
        payment_order__status=OrderStatus.PAID,
        payment_order__handled_payment_due_by=local_datetime(),
        payment_order__price_net=Decimal("10.0"),
        payment_order__price_vat=Decimal("2.4"),
        payment_order__price_total=Decimal("12.4"),
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    # Order is left paid and can be refunded optionally during deny if wanted to
    payment_order = reservation.payment_order
    assert payment_order.status == OrderStatus.PAID
