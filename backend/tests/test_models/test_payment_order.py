from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from freezegun import freeze_time

from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentOrder, Reservation
from utils.date_utils import local_datetime

from tests.factories import PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Price validation ──


def test_order_price_net_fails_when_less_than_0_01():
    with pytest.raises(ValidationError) as error:
        PaymentOrderFactory.create(
            price_net=Decimal("0.0"),
            price_total=Decimal("0.0"),
            price_vat=Decimal("0.0"),
        )

    assert error.value.message_dict == {"price_net": ["Must be greater than 0.01"]}


def test_order_price_vat_fails_when_less_than_0():
    with pytest.raises(ValidationError) as error:
        PaymentOrderFactory.create(
            price_net=Decimal("0.1"),
            price_vat=Decimal("-0.1"),
            price_total=Decimal("0.0"),
        )

    assert error.value.message_dict == {"price_vat": ["Must be greater than 0"]}


def test_order_price_total_fails_when_sum_is_not_correct():
    with pytest.raises(ValidationError) as error:
        PaymentOrderFactory.create(
            price_net=Decimal("0.1"),
            price_vat=Decimal("0.1"),
            price_total=Decimal("10.0"),
        )

    assert error.value.message_dict == {"price_total": ["Must be the sum of net and vat amounts"]}


# ── Refresh order status from webshop ──


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
def test_refresh_order_status_from_webshop__keeps_draft_if_no_payment_and_order_has_not_expired():
    payment_order = PaymentOrderFactory.create(status=OrderStatus.DRAFT, remote_id=uuid.uuid4())

    payment_order.actions.refresh_order_status_from_webshop()

    assert VerkkokauppaAPIClient.get_payment.call_count == 1

    payment_order = PaymentOrder.objects.get(pk=payment_order.pk)
    assert payment_order.status == OrderStatus.DRAFT
    assert payment_order.processed_at is None


# ── Complete payment ──


@patch_method(EmailService.send_reservation_created_email)
@patch_method(EmailService.send_reservation_created_staff_notification_email)
def test_complete_payment__does_nothing_if_reservation_is_already_confirmed():
    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create(reservation=reservation, status=OrderStatus.PAID)

    payment_order.actions.complete_payment()

    reservation = Reservation.objects.get(pk=reservation.pk)
    assert reservation.state == ReservationStateChoice.CONFIRMED

    assert EmailService.send_reservation_created_email.call_count == 0
    assert EmailService.send_reservation_created_staff_notification_email.call_count == 0


# ── Cancel together with verkkokauppa ──


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_cancel_together_with_verkkokauppa__does_nothing_if_status_cannot_be_cancelled():
    payment_order = PaymentOrderFactory.create(status=OrderStatus.PAID, remote_id=uuid.uuid4())

    payment_order.actions.cancel_together_with_verkkokauppa()

    assert VerkkokauppaAPIClient.cancel_order.call_count == 0

    payment_order = PaymentOrder.objects.get(pk=payment_order.pk)
    assert payment_order.status == OrderStatus.PAID
    assert payment_order.processed_at is None


@patch_method(VerkkokauppaAPIClient.cancel_order, return_value=None)
@patch_method(SentryLogger.log_message)
def test_cancel_together_with_verkkokauppa__does_not_cancel_if_order_is_not_found_from_verkkokauppa():
    payment_order = PaymentOrderFactory.create(
        status=OrderStatus.DRAFT,
        remote_id=uuid.uuid4(),
        reservation_user_uuid=uuid.uuid4(),
    )

    payment_order.actions.cancel_together_with_verkkokauppa()

    assert VerkkokauppaAPIClient.cancel_order.call_count == 1
    assert SentryLogger.log_message.call_count == 1

    payment_order = PaymentOrder.objects.get(pk=payment_order.pk)
    assert payment_order.status == OrderStatus.DRAFT
    assert payment_order.processed_at is None


# ── Issue refund in verkkokauppa ──


@patch_method(VerkkokauppaAPIClient.refund_order)
def test_issue_refund_in_verkkokauppa__does_nothing_if_status_cannot_be_refunded():
    payment_order = PaymentOrderFactory.create(status=OrderStatus.DRAFT, remote_id=uuid.uuid4())

    payment_order.actions.issue_refund_in_verkkokauppa()

    assert VerkkokauppaAPIClient.refund_order.call_count == 0

    payment_order = PaymentOrder.objects.get(pk=payment_order.pk)
    assert payment_order.status == OrderStatus.DRAFT
    assert payment_order.refund_id is None


@patch_method(VerkkokauppaAPIClient.refund_order)
def test_issue_refund_in_verkkokauppa__does_nothing_if_order_is_not_in_verkkokauppa():
    payment_order = PaymentOrderFactory.create(status=OrderStatus.PAID, remote_id=None)

    payment_order.actions.issue_refund_in_verkkokauppa()

    assert VerkkokauppaAPIClient.refund_order.call_count == 0

    payment_order = PaymentOrder.objects.get(pk=payment_order.pk)
    assert payment_order.status == OrderStatus.PAID
    assert payment_order.refund_id is None


@patch_method(VerkkokauppaAPIClient.refund_order)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_issue_refund_in_verkkokauppa__marks_refunded_when_verkkokauppa_is_mocked(settings):
    settings.MOCK_VERKKOKAUPPA_API_ENABLED = True
    payment_order = PaymentOrderFactory.create(status=OrderStatus.PAID, remote_id=uuid.uuid4())

    payment_order.actions.issue_refund_in_verkkokauppa()

    assert VerkkokauppaAPIClient.refund_order.call_count == 0

    payment_order = PaymentOrder.objects.get(pk=payment_order.pk)
    assert payment_order.status == OrderStatus.REFUNDED
    assert payment_order.refund_id is not None
    assert payment_order.processed_at == local_datetime(2024, 1, 1, 12)
