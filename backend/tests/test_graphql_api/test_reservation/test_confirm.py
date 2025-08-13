from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import (
    AccessType,
    OrderStatus,
    PaymentType,
    ReservationNotification,
    ReservationStateChoice,
    ReserveeType,
)
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CreateOrderError
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentOrder

from tests.factories import (
    OrderFactory,
    PaymentOrderFactory,
    ReservationFactory,
    ReservationMetadataSetFactory,
    UserFactory,
)
from tests.helpers import patch_method
from tests.query_builder import build_mutation

from .helpers import CONFIRM_MUTATION, get_confirm_data

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.verkkokauppa.order.types import CreateOrderParams

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(SEND_EMAILS=True)
@patch_method(PindoraService.activate_access_code)
def test_reservation__confirm__changes_state__confirmed(graphql, outbox):
    reservation = ReservationFactory.create_for_confirmation()

    # Unit admin will get an email
    unit = reservation.reservation_unit.unit
    UserFactory.create_with_unit_role(
        units=[unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert len(outbox) == 2
    assert outbox[0].subject == "Thank you for your booking at Varaamo"
    unit_name = reservation.reservation_unit.unit.name
    assert outbox[1].subject == f"New booking {reservation.id} has been made for {unit_name}"

    assert PindoraService.activate_access_code.call_count == 0


@override_settings(SEND_EMAILS=True)
def test_reservation__confirm__changes_state__requires_handling(graphql, outbox):
    reservation = ReservationFactory.create_for_confirmation(reservation_unit__require_reservation_handling=True)

    # Unit admin will get an email
    unit = reservation.reservation_unit.unit
    UserFactory.create_with_unit_role(
        units=[unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    input_data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 2
    assert outbox[0].subject == "Your booking is waiting for processing"
    unit_name = reservation.reservation_unit.unit.name
    assert outbox[1].subject == f"New booking {reservation.id} requires handling at unit {unit_name}"


@override_settings(SEND_EMAILS=True)
def test_reservation__confirm__changes_state_to_requires_handling_on_subsidy_request(graphql, outbox):
    reservation = ReservationFactory.create_for_confirmation(
        applying_for_free_of_charge=True,
        free_of_charge_reason="foo",
    )

    # Unit admin will get an email
    unit = reservation.reservation_unit.unit
    UserFactory.create_with_unit_role(
        units=[unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()

    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 2
    assert outbox[0].subject == "Your booking is waiting for processing"
    unit_name = reservation.reservation_unit.unit.name
    assert outbox[1].subject == f"New booking {reservation.id} requires handling at unit {unit_name}"


def test_reservation__confirm__fails_if_state_is_not_created(graphql):
    reservation = ReservationFactory.create_for_confirmation(state=ReservationStateChoice.DENIED)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation cannot be changed anymore."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__confirm__reservation_owner_can_confirm(graphql):
    reservation = ReservationFactory.create_for_confirmation()

    graphql.force_login(reservation.user)
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__confirm__regular_user_cannot_confirm(graphql):
    reservation = ReservationFactory.create_for_confirmation()

    graphql.login_with_regular_user()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to confirm reservation."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__confirm__updates_confirmed_at(graphql):
    reservation = ReservationFactory.create_for_confirmation(confirmed_at=None)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.confirmed_at is not None


def test_reservation__confirm__succeeds_if_reservation_has_all_required_fields(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__metadata_set=ReservationMetadataSetFactory.create_basic(),
        reservee_first_name="John",
        reservee_last_name="Doe",
        reservee_email="foo@email.com",
        reservee_phone="12345890",
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__confirm__fails_if_any_required_field_are_missing(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__metadata_set=ReservationMetadataSetFactory.create_basic(),
        reservee_first_name="John",
        reservee_last_name="Doe",
        reservee_email=None,
        reservee_phone="12345890",
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Value for required field 'reservee_email' is missing."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__does_not_create_order_when_handling_is_required(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__pricings__payment_type=PaymentType.ONLINE,
        reservation_unit__require_reservation_handling=True,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert PaymentOrder.objects.count() == 0
    assert VerkkokauppaAPIClient.create_order.called is False


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__creates_local_order_when_payment_type_is_on_site(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__pricings__payment_type=PaymentType.ON_SITE,
        user__preferred_language="fi",
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.ON_SITE
    assert orders[0].status == OrderStatus.PAID_MANUALLY
    assert orders[0].language == reservation.user.preferred_language
    assert orders[0].reservation == reservation

    assert VerkkokauppaAPIClient.create_order.called is False


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__calls_verkkokauppa_api_when_payment_type_is_not_on_site(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__pricings__payment_type=PaymentType.ONLINE,
        user__preferred_language="fi",
    )

    order = OrderFactory.create()
    VerkkokauppaAPIClient.create_order.return_value = order

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.WAITING_FOR_PAYMENT

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.ONLINE
    assert orders[0].status == OrderStatus.DRAFT
    assert orders[0].language == reservation.user.preferred_language
    assert orders[0].reservation == reservation
    assert orders[0].remote_id == order.order_id
    assert orders[0].checkout_url == order.checkout_url
    assert orders[0].receipt_url == order.receipt_url

    assert VerkkokauppaAPIClient.create_order.called is True


@patch_method(VerkkokauppaAPIClient.create_order, side_effect=CreateOrderError("Test exception"))
@patch_method(SentryLogger.log_exception)
def test_reservation__confirm__does_not_save_when_api_call_fails(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__pricings__payment_type=PaymentType.ONLINE,
        user__preferred_language="fi",
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Upstream service call failed. Unable to confirm the reservation."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED
    assert PaymentOrder.objects.count() == 0


def test_reservation__confirm__default_payment_type__on_site(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__pricings__payment_type=PaymentType.ON_SITE,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.ON_SITE


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__default_payment_type__online(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__pricings__payment_type=PaymentType.ONLINE,
    )

    VerkkokauppaAPIClient.create_order.return_value = OrderFactory.create()

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.ONLINE

    assert VerkkokauppaAPIClient.create_order.called is True


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__default_payment_type__online_or_invoice(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        # Required params for invoicing to work
        reservee_type=ReserveeType.COMPANY,
        reservation_unit__pricings__payment_type=PaymentType.ONLINE_OR_INVOICE,
        reservation_unit__payment_accounting__product_invoicing_sales_org="2900",
        reservation_unit__payment_accounting__product_invoicing_sales_office="2911",
        reservation_unit__payment_accounting__product_invoicing_material="12345678",
        reservation_unit__payment_accounting__product_invoicing_order_type="ZTY1",
    )

    VerkkokauppaAPIClient.create_order.return_value = OrderFactory.create()

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    orders = list(PaymentOrder.objects.all())
    assert len(orders) == 1
    assert orders[0].payment_type == PaymentType.ONLINE_OR_INVOICE

    assert VerkkokauppaAPIClient.create_order.called is True

    # 'invoicing_date' parameter is given so that invoicing is show in Verkkokauppa UI
    order_params: CreateOrderParams = VerkkokauppaAPIClient.create_order.call_args.kwargs["order_params"]
    assert order_params.items[0].invoicing_date is not None


def test_reservation__confirm__cannot_confirm_if_order_exists(graphql):
    reservation = ReservationFactory.create_for_confirmation()
    PaymentOrderFactory.create(reservation=reservation)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.error_message(0) == (
        "Reservation cannot be changed anymore because it is attached to a payment order"
    )


def test_reservation__confirm__order_not_created_when_price_is_zero(graphql):
    reservation = ReservationFactory.create_for_confirmation(price=Decimal(0))

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors
    assert PaymentOrder.objects.count() == 0


@patch_method(VerkkokauppaAPIClient.create_order)
def test_reservation__confirm__return_order_data(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__pricings__payment_type=PaymentType.ONLINE,
    )

    VerkkokauppaAPIClient.create_order.return_value = OrderFactory.create()

    fields = "state paymentOrder { paymentType checkoutUrl }"
    query = build_mutation("confirmReservation", "ReservationConfirmMutation", fields=fields)

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(query, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert VerkkokauppaAPIClient.create_order.called is True

    reservation.refresh_from_db()

    assert response.results == {
        "state": reservation.state.upper(),
        "paymentOrder": {
            "checkoutUrl": "https://checkout.url",
            "paymentType": reservation.payment_order.payment_type,
        },
    }


def test_reservation__confirm__payment_type_online_requires_payment_product(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__payment_product=None,
        reservation_unit__pricings__payment_type=PaymentType.ONLINE,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation unit is missing payment product"


def test_reservation__confirm__payment_type_onsite_doesnt_require_payment_product(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__payment_product=None,
        reservation_unit__pricings__payment_type=PaymentType.ON_SITE,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response


def test_reservation__confirm__without_price_and_with_free_pricing_does_not_require_payment_product(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        reservation_unit__payment_product=None,
        reservation_unit__pricings__lowest_price=0,
        reservation_unit__pricings__highest_price=0,
        price=Decimal(0),
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert PaymentOrder.objects.count() == 0


@patch_method(PindoraClient.get_reservation, side_effect=PindoraNotFoundError("Not found"))  # Called by email sending
@patch_method(PindoraService.activate_access_code)
def test_reservation__confirm__pindora_api__call_succeeds(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert PindoraService.activate_access_code.call_count == 1


@patch_method(PindoraClient.get_reservation, side_effect=PindoraNotFoundError("Not found"))  # Called by email sending
@patch_method(PindoraService.activate_access_code, side_effect=PindoraAPIError("Error"))
@patch_method(SentryLogger.log_exception)
def test_reservation__confirm__pindora_api__call_fails(graphql):
    reservation = ReservationFactory.create_for_confirmation(
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
    )

    graphql.login_with_superuser()
    data = get_confirm_data(reservation)
    response = graphql(CONFIRM_MUTATION, variables={"input": data})

    # Request is still successful, even if Pindora API call fails
    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
    assert reservation.access_code_is_active is False

    assert PindoraService.activate_access_code.call_count == 1

    assert SentryLogger.log_exception.called is True
