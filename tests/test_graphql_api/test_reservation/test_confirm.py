from decimal import Decimal

import pytest
from django.test import override_settings
from graphene_django_extensions.testing import build_mutation

from tilavarauspalvelu.enums import OrderStatus, PaymentType, ReservationNotification, ReservationStateChoice
from tilavarauspalvelu.models import PaymentOrder
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import CreateOrderError
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.sentry import SentryLogger

from tests.factories import (
    OrderFactory,
    PaymentOrderFactory,
    ReservationFactory,
    ReservationMetadataSetFactory,
    ReservationUnitPaymentTypeFactory,
    UserFactory,
)
from tests.helpers import patch_method

from .helpers import CONFIRM_MUTATION, get_confirm_data

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(SEND_EMAILS=True)
def test_reservation__confirm__changes_state__confirmed(graphql, outbox):
    reservation = ReservationFactory.create_for_confirmation()

    # Unit admin will get an email
    unit = reservation.reservation_units.first().unit
    UserFactory.create_with_unit_role(
        units=[unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert len(outbox) == 2
    assert outbox[0].subject == "Thank you for your booking at Varaamo"
    unit_name = reservation.reservation_units.first().unit.name
    assert outbox[1].subject == f"New booking {reservation.id} has been made for {unit_name}"


@override_settings(SEND_EMAILS=True)
def test_reservation__confirm__changes_state__requires_handling(graphql, outbox):
    reservation = ReservationFactory.create_for_confirmation(reservation_units__require_reservation_handling=True)

    # Unit admin will get an email
    unit = reservation.reservation_units.first().unit
    UserFactory.create_with_unit_role(
        units=[unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    input_data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 2
    assert outbox[0].subject == "Your booking is waiting for processing"
    unit_name = reservation.reservation_units.first().unit.name
    assert outbox[1].subject == f"New booking {reservation.id} requires handling at unit {unit_name}"


@override_settings(SEND_EMAILS=True)
def test_reservation__confirm__changes_state_to_requires_handling_on_subsidy_request(graphql, outbox):
    reservation = ReservationFactory.create_for_confirmation(
        applying_for_free_of_charge=True,
        free_of_charge_reason="foo",
    )

    # Unit admin will get an email
    unit = reservation.reservation_units.first().unit
    UserFactory.create_with_unit_role(
        units=[unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()

    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 2
    assert outbox[0].subject == "Your booking is waiting for processing"
    unit_name = reservation.reservation_units.first().unit.name
    assert outbox[1].subject == f"New booking {reservation.id} requires handling at unit {unit_name}"


def test_reservation__confirm__fails_if_state_is_not_created(graphql):
    reservation = ReservationFactory.create_for_confirmation(state=ReservationStateChoice.DENIED)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.error_message() == "Reservation cannot be changed anymore."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__confirm__reservation_owner_can_confirm(graphql):
    reservation = ReservationFactory.create_for_confirmation()

    graphql.force_login(reservation.user)
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__confirm__regular_user_cannot_confirm(graphql):
    reservation = ReservationFactory.create_for_confirmation()

    graphql.login_with_regular_user()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__confirm__updates_confirmed_at(graphql):
    reservation = ReservationFactory.create_for_confirmation(confirmed_at=None)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.confirmed_at is not None


def test_reservation__confirm__succeeds_if_reservation_has_all_required_fields(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__metadata_set=ReservationMetadataSetFactory.create_basic(),
        reservee_first_name="John",
        reservee_last_name="Doe",
        reservee_email="foo@email.com",
        reservee_phone="12345890",
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__confirm__fails_if_any_required_field_are_missing(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__metadata_set=ReservationMetadataSetFactory.create_basic(),
        reservee_first_name="John",
        reservee_last_name="Doe",
        reservee_email=None,
        reservee_phone="12345890",
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.error_message() == "Value for required field reserveeEmail is missing."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__does_not_create_order_when_handling_is_required(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__require_reservation_handling=True,
        reservation_units__payment_types__code=PaymentType.INVOICE,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert PaymentOrder.objects.count() == 0
    assert VerkkokauppaAPIClient.create_order.called is False


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__creates_local_order_when_payment_type_is_on_site(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__payment_types__code=PaymentType.ON_SITE,
        reservee_language="fi",
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.ON_SITE
    assert orders[0].status == OrderStatus.PAID_MANUALLY
    assert orders[0].language == reservation.reservee_language
    assert orders[0].reservation == reservation

    assert VerkkokauppaAPIClient.create_order.called is False


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__calls_verkkokauppa_api_when_payment_type_is_not_on_site(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__payment_types__code=PaymentType.INVOICE,
        reservee_language="fi",
    )

    order = OrderFactory.create()
    VerkkokauppaAPIClient.create_order.return_value = order

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.WAITING_FOR_PAYMENT

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.INVOICE
    assert orders[0].status == OrderStatus.DRAFT
    assert orders[0].language == reservation.reservee_language
    assert orders[0].reservation == reservation
    assert orders[0].remote_id == order.order_id
    assert orders[0].checkout_url == order.checkout_url
    assert orders[0].receipt_url == order.receipt_url

    assert VerkkokauppaAPIClient.create_order.called is True


@patch_method(VerkkokauppaAPIClient.create_order, side_effect=CreateOrderError("Test exception"))
@patch_method(SentryLogger.log_exception)
def test_reservation__confirm__does_not_save_when_api_call_fails(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__payment_types__code=PaymentType.INVOICE,
        reservee_language="fi",
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.error_message() == "Upstream service call failed. Unable to confirm the reservation."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED
    assert PaymentOrder.objects.count() == 0


def test_reservation__confirm__use_non_default_payment_type(graphql):
    payment_type_1 = ReservationUnitPaymentTypeFactory.create(code=PaymentType.ON_SITE.value)
    payment_type_2 = ReservationUnitPaymentTypeFactory.create(code=PaymentType.INVOICE.value)

    reservation = ReservationFactory.create_for_confirmation(reservation_units__payment_types=None)

    reservation_unit = reservation.reservation_units.first()
    reservation_unit.payment_types.add(payment_type_1, payment_type_2)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation, paymentType=PaymentType.ON_SITE.value)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__confirm__does_not_allow_unsupported_payment_type(graphql):
    reservation = ReservationFactory.create_for_confirmation()

    graphql.login_with_superuser()
    data = get_confirm_data(reservation, paymentType=PaymentType.ONLINE.value)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit does not support ONLINE payment type. Allowed values: ON_SITE"

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__allows_unsupported_payment_type_with_zero_price(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__payment_types__code=PaymentType.INVOICE,
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        price=Decimal(0),
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation, paymentType=PaymentType.ONLINE.value)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert VerkkokauppaAPIClient.create_order.called is False


def test_reservation__confirm__default_payment_type__on_site(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__payment_types__code=PaymentType.ON_SITE,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.ON_SITE


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__default_payment_type__invoice(graphql):
    payment_type_1 = ReservationUnitPaymentTypeFactory.create(code=PaymentType.ON_SITE.value)
    payment_type_2 = ReservationUnitPaymentTypeFactory.create(code=PaymentType.INVOICE.value)

    reservation = ReservationFactory.create_for_confirmation(reservation_units__payment_types=None)

    reservation_unit = reservation.reservation_units.first()
    reservation_unit.payment_types.add(payment_type_1, payment_type_2)

    VerkkokauppaAPIClient.create_order.return_value = OrderFactory.create()

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.INVOICE

    assert VerkkokauppaAPIClient.create_order.called is True


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__default_payment_type__online(graphql):
    payment_type_1 = ReservationUnitPaymentTypeFactory.create(code=PaymentType.ON_SITE.value)
    payment_type_2 = ReservationUnitPaymentTypeFactory.create(code=PaymentType.INVOICE.value)
    payment_type_3 = ReservationUnitPaymentTypeFactory.create(code=PaymentType.ONLINE.value)

    reservation = ReservationFactory.create_for_confirmation(reservation_units__payment_types=None)

    reservation_unit = reservation.reservation_units.first()
    reservation_unit.payment_types.add(payment_type_1, payment_type_2, payment_type_3)

    VerkkokauppaAPIClient.create_order.return_value = OrderFactory.create()

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.ONLINE

    assert VerkkokauppaAPIClient.create_order.called is True


def test_reservation__confirm__cannot_confirm_if_order_exists(graphql):
    reservation = ReservationFactory.create_for_confirmation()
    PaymentOrderFactory.create(reservation=reservation)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.error_message() == "Reservation cannot be changed anymore because it is attached to a payment order"


def test_reservation__confirm__order_not_created_when_price_is_zero(graphql):
    reservation = ReservationFactory.create_for_confirmation(price=Decimal(0))

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert PaymentOrder.objects.count() == 0


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__return_order_data(graphql):
    reservation = ReservationFactory.create_for_confirmation(reservation_units__payment_types__code=PaymentType.ONLINE)

    VerkkokauppaAPIClient.create_order.return_value = OrderFactory.create()

    fields = "state order { paymentType checkoutUrl }"
    query = build_mutation("confirmReservation", "ReservationConfirmMutation", fields=fields)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(query, input_data=data)

    assert response.has_errors is False, response.errors

    assert VerkkokauppaAPIClient.create_order.called is True

    reservation.refresh_from_db()
    orders = list(reservation.payment_order.all())
    assert len(orders) == 1
    order: PaymentOrder = orders[0]

    assert response.first_query_object == {
        "state": reservation.state.upper(),
        "order": {
            "checkoutUrl": "https://checkout.url",
            "paymentType": order.payment_type,
        },
    }


def test_reservation__confirm__with_price_requires_payment_product(graphql):
    reservation = ReservationFactory.create_for_confirmation(reservation_units__payment_product=None)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is missing payment product"


def test_reservation__confirm__without_price_and_with_free_pricing_does_not_require_payment_product(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_units__payment_product=None,
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        price=Decimal(0),
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert PaymentOrder.objects.count() == 0
