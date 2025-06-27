from __future__ import annotations

from decimal import Decimal

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, OrderStatus, PaymentType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationUnitFactory
from tests.helpers import patch_method

from .helpers import APPROVE_MUTATION, get_approve_data

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_reservation_approved_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
def test_reservation__approve__free(graphql):
    reservation_unit = ReservationUnitFactory.create_free()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert EmailService.send_reservation_approved_email.called is True
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is True


@patch_method(EmailService.send_reservation_approved_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
def test_reservation__approve__paid__on_site(graphql):
    reservation_unit = ReservationUnitFactory.create_paid_on_site()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    data["price"] = "10.59"
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert EmailService.send_reservation_approved_email.called is True
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is True


@patch_method(EmailService.send_reservation_requires_payment_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation__approve__paid__in_webshop(graphql):
    reservation_unit = ReservationUnitFactory.create_paid_in_webshop()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 10, 12),
        ends_at=local_datetime(2024, 1, 10, 13),
        tax_percentage_value=Decimal("24.0"),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation, price="10.59")
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert EmailService.send_reservation_requires_payment_email.called is True
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is True

    reservation.refresh_from_db()

    # Reservation is confirmed, even though payment is not completed
    assert reservation.state == ReservationStateChoice.CONFIRMED

    # Tax percentage is taken from the latest pricing
    assert reservation.tax_percentage_value == Decimal("25.5")

    assert hasattr(reservation, "payment_order")

    payment_order = reservation.payment_order

    # Verkkokauppa order has not been created yet
    assert payment_order.remote_id is None
    assert payment_order.checkout_url == ""
    assert payment_order.receipt_url == ""

    # Order is pending
    assert payment_order.payment_type == PaymentType.ONLINE
    assert payment_order.status == OrderStatus.PENDING

    # Pricing is correct
    assert payment_order.price_net == Decimal("8.44")
    assert payment_order.price_vat == Decimal("2.15")
    assert payment_order.price_total == Decimal("10.59")

    # Handled payment due by is set 3 days from now
    handled_payment_due_by = payment_order.handled_payment_due_by.astimezone(DEFAULT_TIMEZONE)
    assert handled_payment_due_by == local_datetime(2024, 1, 4, 12)


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation__approve__paid__in_webshop__close_to_begin_date(graphql):
    reservation_unit = ReservationUnitFactory.create_paid_in_webshop()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 2, 12),
        ends_at=local_datetime(2024, 1, 2, 13),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation, price="10.59")
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert hasattr(reservation, "payment_order")

    payment_order = reservation.payment_order

    # Handled payment due by is set 1 hour before reservation begins
    handled_payment_due_by = payment_order.handled_payment_due_by.astimezone(DEFAULT_TIMEZONE)
    assert handled_payment_due_by == local_datetime(2024, 1, 2, 11)


@patch_method(EmailService.send_reservation_approved_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation__approve__paid__in_webshop__paid_on_site_since_begin_too_close(graphql):
    reservation_unit = ReservationUnitFactory.create_paid_in_webshop()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 1, 13),
        ends_at=local_datetime(2024, 1, 1, 14),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation, price="10.59")
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert EmailService.send_reservation_approved_email.called is True
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is True

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert hasattr(reservation, "payment_order")

    payment_order = reservation.payment_order

    assert payment_order.payment_type == PaymentType.ON_SITE
    assert payment_order.status == OrderStatus.PAID_MANUALLY


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation__approve__paid__in_webshop__has_payment__paid_online__with_same_price(graphql):
    reservation_unit = ReservationUnitFactory.create_paid_in_webshop()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 2, 12),
        ends_at=local_datetime(2024, 1, 2, 13),
        tax_percentage_value=Decimal("24.0"),
    )

    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        payment_type=PaymentType.ONLINE,
        status=OrderStatus.PAID,
        price_net=Decimal("8.44"),
        price_vat=Decimal("2.15"),
        price_total=Decimal("10.59"),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation, price="10.59")
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
    # Tax percentage is not changed, since we reuse the existing payment order
    assert reservation.tax_percentage_value == Decimal("24.0")

    # Same payment order should be reused
    assert hasattr(reservation, "payment_order")
    assert reservation.payment_order == payment_order


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation__approve__paid__in_webshop__has_payment__paid_online__different_price(graphql):
    reservation_unit = ReservationUnitFactory.create_paid_in_webshop()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 2, 12),
        ends_at=local_datetime(2024, 1, 2, 13),
    )

    PaymentOrderFactory.create(
        reservation=reservation,
        payment_type=PaymentType.ONLINE,
        status=OrderStatus.PAID,
        price_net=Decimal("10.0"),
        price_vat=Decimal("2.0"),
        price_total=Decimal("12.0"),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation, price="10.59")
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation already has a paid payment order with a different price."]


@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.parametrize("status", [OrderStatus.PAID_MANUALLY, OrderStatus.REFUNDED, OrderStatus.CANCELLED])
def test_reservation__approve__paid__in_webshop__has_payment__not_paid_online(graphql, status):
    reservation_unit = ReservationUnitFactory.create_paid_in_webshop()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 2, 12),
        ends_at=local_datetime(2024, 1, 2, 13),
    )

    old_payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        payment_type=PaymentType.ONLINE,
        status=status,
        price_net=Decimal("10.0"),
        price_vat=Decimal("2.0"),
        price_total=Decimal("12.0"),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation, price="10.59")
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    # Payment order should be replaced
    assert hasattr(reservation, "payment_order")
    new_payment_order = reservation.payment_order
    assert new_payment_order != old_payment_order

    # Order is pending
    assert new_payment_order.payment_type == PaymentType.ONLINE
    assert new_payment_order.status == OrderStatus.PENDING

    # Pricing is correct
    assert new_payment_order.price_net == Decimal("8.44")
    assert new_payment_order.price_vat == Decimal("2.15")
    assert new_payment_order.price_total == Decimal("10.59")


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.create_access_code)
def test_reservation__approve__pindora_api__call_succeeds(graphql):
    reservation_unit = ReservationUnitFactory.create_free(
        access_types__access_type=AccessType.ACCESS_CODE,
    )

    reservation = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.REQUIRES_HANDLING,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert PindoraService.activate_access_code.called is True
    assert PindoraService.create_access_code.called is False


@patch_method(PindoraService.activate_access_code, side_effect=PindoraAPIError("Error"))
@patch_method(PindoraService.create_access_code)
@patch_method(SentryLogger.log_exception)
def test_reservation__approve__pindora_api__call_fails(graphql):
    reservation_unit = ReservationUnitFactory.create_free(
        access_types__access_type=AccessType.ACCESS_CODE,
    )

    reservation = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.REQUIRES_HANDLING,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    # Request is still successful, even if Pindora API call fails
    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
    assert reservation.access_code_is_active is False

    assert PindoraService.activate_access_code.called is True
    assert PindoraService.create_access_code.called is False

    assert SentryLogger.log_exception.called is True


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation__approve__no_pricing(graphql):
    reservation_unit = ReservationUnitFactory.create()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 10, 12),
        ends_at=local_datetime(2024, 1, 10, 13),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation, price="10.59")
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["No pricing found for reservation's begin date."]


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation__approve__no_payment_product_if_paid_online(graphql):
    reservation_unit = ReservationUnitFactory.create(
        pricings__lowest_price=Decimal("10.00"),
        pricings__highest_price=Decimal("20.00"),
        pricings__tax_percentage__value=Decimal("25.50"),
        pricings__payment_type=PaymentType.ONLINE,
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 10, 12),
        ends_at=local_datetime(2024, 1, 10, 13),
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation, price="10.59")
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation unit is missing payment product"]


def test_reservation__approve__status_not_requires_handling(graphql):
    reservation_unit = ReservationUnitFactory.create_free()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CREATED,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be approved based on its state"]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__approve__price_missing(graphql):
    reservation_unit = ReservationUnitFactory.create_free()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    input_data = get_approve_data(reservation)
    input_data.pop("price")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.has_errors is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__approve__handling_details_missing(graphql):
    reservation_unit = ReservationUnitFactory.create_free()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    input_data = get_approve_data(reservation)
    input_data.pop("handlingDetails")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.has_errors is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__approve__empty_handling_details(graphql):
    reservation_unit = ReservationUnitFactory.create_free()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    data["handlingDetails"] = ""
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
