import datetime
import json
from decimal import Decimal
from unittest.mock import patch

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from applications.models import City
from email_notification.models import EmailType
from email_notification.tests.factories import EmailTemplateFactory
from merchants.models import OrderStatus, PaymentOrder, PaymentType
from merchants.tests.factories import PaymentOrderFactory
from merchants.verkkokauppa.order.test.factories import OrderFactory
from opening_hours.tests.test_get_periods import get_mocked_periods
from reservations.models import STATE_CHOICES, AgeGroup
from reservations.tests.factories import ReservationFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@patch(
    "opening_hours.hours.get_periods_for_resource", return_value=get_mocked_periods()
)
@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class ReservationConfirmTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=(
                datetime.datetime.now(tz=get_default_timezone())
                + datetime.timedelta(hours=1)
            ),
            state=STATE_CHOICES.CREATED,
            user=self.regular_joe,
            reservee_email="email@reservee",
            reservee_language="fi",
            price_net=Decimal("10.0"),
            price=Decimal("12.4"),
            tax_percentage_value=Decimal("24.0"),
        )
        EmailTemplateFactory(
            type=EmailType.RESERVATION_CONFIRMED, content="", subject="confirmed"
        )
        EmailTemplateFactory(
            type=EmailType.HANDLING_REQUIRED_RESERVATION, content="", subject="handling"
        )
        EmailTemplateFactory(
            type=EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
            content="",
            subject="staff reservation made",
        )
        EmailTemplateFactory(
            type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
            content="",
            subject="staff requires handling",
        )

    def get_confirm_query(self):
        return """
            mutation confirmReservation($input: ReservationConfirmMutationInput!) {
                confirmReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_confirm_data(self):
        return {"pk": self.reservation.pk}

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    @patch("merchants.verkkokauppa.helpers.create_order")
    def test_confirm_reservation_changes_state(
        self, mock_create_order, mock_periods, mock_opening_hours
    ):
        mock_create_order.return_value = OrderFactory.create()
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add("ON_SITE")

        input_data = self.get_valid_confirm_data()
        input_data["paymentType"] = PaymentType.ON_SITE

        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("state")).is_equal_to(
            STATE_CHOICES.CONFIRMED.upper()
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(len(mail.outbox)).is_equal_to(2)
        assert_that(mail.outbox[0].subject).is_equal_to("confirmed")
        assert_that(mail.outbox[1].subject).is_equal_to("staff reservation made")

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_confirm_reservation_changes_state_to_requires_handling(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.require_reservation_handling = True
        self.reservation_unit.save()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("state")).is_equal_to(
            STATE_CHOICES.REQUIRES_HANDLING.upper()
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        assert_that(len(mail.outbox)).is_equal_to(2)
        assert_that(mail.outbox[0].subject).is_equal_to("handling")
        assert_that(mail.outbox[1].subject).is_equal_to("staff requires handling")

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_confirm_reservation_changes_state_to_requires_handling_on_subsidy_request(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        self.reservation.applying_for_free_of_charge = True
        self.reservation.free_of_charge_reason = (
            "Reasonable reasoning for the reason that we question."
        )
        self.reservation.save()

        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_confirm_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)

        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("state")).is_equal_to(
            STATE_CHOICES.REQUIRES_HANDLING.upper()
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        assert_that(len(mail.outbox)).is_equal_to(2)
        assert_that(mail.outbox[0].subject).is_equal_to("handling")
        assert_that(mail.outbox[1].subject).is_equal_to("staff requires handling")

    def test_confirm_reservation_fails_if_state_is_not_created(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        self.reservation.state = STATE_CHOICES.DENIED
        self.reservation.save()
        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation cannot be changed anymore."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "CHANGES_NOT_ALLOWED"
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)

    def test_confirm_reservation_fails_on_wrong_user(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)

    @patch("merchants.verkkokauppa.helpers.create_order")
    def test_confirm_reservation_updates_confirmed_at(
        self, mock_create_order, mock_periods, mock_opening_hours
    ):
        mock_create_order.return_value = OrderFactory.create()
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        self.query(self.get_confirm_query(), input_data=input_data)
        self.reservation.refresh_from_db()
        assert_that(self.reservation.confirmed_at).is_equal_to(
            datetime.datetime(2021, 10, 12, 12).astimezone(get_default_timezone())
        )

    @patch("merchants.verkkokauppa.helpers.create_order")
    def test_confirm_reservation_succeeds_if_reservation_already_has_required_fields(
        self, mock_create_order, mock_periods, mock_opening_hours
    ):
        mock_create_order.return_value = OrderFactory.create()
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.metadata_set = self._create_metadata_set()
        self.reservation_unit.save(update_fields=["metadata_set"])
        self.reservation.reservee_first_name = "John"
        self.reservation.reservee_last_name = "Doe"
        self.reservation.home_city = City.objects.create(name="Helsinki")
        self.reservation.age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        self.reservation.save()
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_confirm_query(), input_data=self.get_valid_confirm_data()
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()

    def test_confirm_reservation_fails_if_required_fields_are_not_filled(
        self, mock_periods, mock_opening_hours
    ):
        self.reservation_unit.metadata_set = self._create_metadata_set()
        self.reservation_unit.save(update_fields=["metadata_set"])
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation.reservee_first_name = ""
        self.reservation.save()
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_confirm_query(), input_data=self.get_valid_confirm_data()
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains(
            "Value for required field"
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "REQUIRED_FIELD_MISSING"
        )
        assert_that(content.get("errors")[0]["extensions"]["field"]).is_equal_to(
            "homeCity"
        )

    @patch(
        "api.graphql.reservations.reservation_serializers.confirm_serializers.create_verkkokauppa_order"
    )
    def test_confirm_reservation_does_not_create_order_when_handling_is_required(
        self, mock_create_vk_order, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        self.reservation_unit.require_reservation_handling = True
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("state")).is_not_equal_to(
            STATE_CHOICES.CONFIRMED.upper()
        )

        assert_that(PaymentOrder.objects.all().count()).is_equal_to(0)
        assert_that(mock_create_vk_order.called).is_false()

    @patch(
        "api.graphql.reservations.reservation_serializers.confirm_serializers.create_verkkokauppa_order"
    )
    def test_confirm_reservation_creates_local_order_when_payment_type_is_on_site(
        self, mock_create_vk_order, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add(PaymentType.ON_SITE)

        input_data = self.get_valid_confirm_data()
        input_data["paymentType"] = PaymentType.ON_SITE

        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("state")).is_equal_to(
            STATE_CHOICES.CONFIRMED.upper()
        )

        local_order = PaymentOrder.objects.first()

        assert_that(mock_create_vk_order.called).is_false()
        assert_that(local_order).is_not_none()
        assert_that(local_order.payment_type).is_equal_to(PaymentType.ON_SITE)
        assert_that(local_order.status).is_equal_to(OrderStatus.PAID_MANUALLY)
        assert_that(local_order.created_at.strftime("%Y%m%d%H%:M:%S")).is_equal_to(
            datetime.datetime.now().strftime("%Y%m%d%H%:M:%S")
        )
        assert_that(local_order.language).is_equal_to(
            self.reservation.reservee_language
        )
        assert_that(local_order.reservation).is_equal_to(self.reservation)

    @patch(
        "api.graphql.reservations.reservation_serializers.confirm_serializers.create_verkkokauppa_order"
    )
    def test_confirm_reservation_calls_api_when_payment_type_is_not_on_site(
        self, mock_create_vk_order, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        mock_vk_order = OrderFactory()
        mock_create_vk_order.return_value = mock_vk_order

        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add(PaymentType.INVOICE)

        input_data = self.get_valid_confirm_data()
        input_data["paymentType"] = PaymentType.INVOICE

        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("state")).is_equal_to(
            STATE_CHOICES.WAITING_FOR_PAYMENT.upper()
        )

        assert_that(mock_create_vk_order.called).is_true()
        local_order = PaymentOrder.objects.first()
        assert_that(local_order).is_not_none()
        assert_that(local_order.remote_id).is_equal_to(mock_vk_order.order_id)
        assert_that(local_order.checkout_url).is_equal_to(mock_vk_order.checkout_url)
        assert_that(local_order.receipt_url).is_equal_to(mock_vk_order.receipt_url)

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(
            STATE_CHOICES.WAITING_FOR_PAYMENT
        )

    def test_confirm_reservation_does_not_allow_unsupported_payment_type(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add(PaymentType.INVOICE)

        input_data = self.get_valid_confirm_data()
        input_data["paymentType"] = PaymentType.ONLINE

        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit does not support ONLINE payment type. Allowed values: INVOICE, ON_SITE"
        )

    def test_confirm_reservation_allows_unsupported_payment_type_with_zero_price(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        self.reservation.price = Decimal(0)
        self.reservation.price_net = Decimal(0)
        self.reservation.save()

        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add(PaymentType.INVOICE)

        input_data = self.get_valid_confirm_data()
        input_data["paymentType"] = PaymentType.ONLINE

        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

    def test_confirm_reservation_without_payment_type_use_on_site(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add(PaymentType.ON_SITE)

        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        local_order = PaymentOrder.objects.first()
        assert_that(local_order.payment_type).is_equal_to(PaymentType.ON_SITE)

    @patch(
        "api.graphql.reservations.reservation_serializers.confirm_serializers.create_verkkokauppa_order"
    )
    def test_confirm_reservation_without_payment_type_use_invoice(
        self, mock_create_vk_order, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        mock_create_vk_order.return_value = OrderFactory()
        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add(
            PaymentType.ON_SITE, PaymentType.INVOICE
        )

        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        local_order = PaymentOrder.objects.first()
        assert_that(local_order.payment_type).is_equal_to(PaymentType.INVOICE)

    @patch(
        "api.graphql.reservations.reservation_serializers.confirm_serializers.create_verkkokauppa_order"
    )
    def test_confirm_reservation_without_payment_type_use_online(
        self, mock_create_vk_order, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        mock_create_vk_order.return_value = OrderFactory()
        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add(
            PaymentType.ON_SITE, PaymentType.INVOICE, PaymentType.ONLINE
        )

        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        local_order = PaymentOrder.objects.first()
        assert_that(local_order.payment_type).is_equal_to(PaymentType.ONLINE)

    def test_confirm_reservation_error_when_order_exists(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        PaymentOrderFactory(reservation=self.reservation)

        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation cannot be changed anymore because it is attached to a payment order"
        )

    def test_confirm_order_not_created_when_price_is_zero(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        self.reservation.price = Decimal(0)
        self.reservation.price_net = Decimal(0)
        self.reservation.save()

        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        local_order = PaymentOrder.objects.first()
        assert_that(local_order).is_none()

    @patch(
        "api.graphql.reservations.reservation_serializers.confirm_serializers.create_verkkokauppa_order"
    )
    def test_confirm_reservation_return_order_data(
        self, mock_create_vk_order, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        mock_order = OrderFactory()
        mock_create_vk_order.return_value = mock_order

        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_types.add(PaymentType.INVOICE)

        input_data = self.get_valid_confirm_data()
        query = """
            mutation confirmReservation($input: ReservationConfirmMutationInput!) {
                confirmReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                    order {
                        orderUuid
                        receiptUrl
                        checkoutUrl
                    }
                }
            }
        """
        response = self.query(query, input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("confirmReservation")).is_not_none()
        assert_that(
            content.get("data").get("confirmReservation").get("order")
        ).is_not_none()

        order_data = content.get("data").get("confirmReservation").get("order")
        assert_that(order_data.get("orderUuid")).is_equal_to(str(mock_order.order_id))
        assert_that(order_data.get("receiptUrl")).is_equal_to(mock_order.receipt_url)
        assert_that(order_data.get("checkoutUrl")).is_equal_to(mock_order.checkout_url)

    def test_confirm_reservation_with_price_requires_payment_product(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_product = None
        self.reservation_unit.save()

        input_data = self.get_valid_confirm_data()
        query = """
            mutation confirmReservation($input: ReservationConfirmMutationInput!) {
                confirmReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """
        response = self.query(query, input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "Reservation unit is missing payment product"
        )

    def test_confirm_reservation_without_price_does_not_require_payment_product(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        self.reservation_unit.payment_product = None
        self.reservation_unit.save()

        self.reservation.price = Decimal(0)
        self.reservation.price_net = Decimal(0)
        self.reservation.save()

        input_data = self.get_valid_confirm_data()
        query = """
            mutation confirmReservation($input: ReservationConfirmMutationInput!) {
                confirmReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """
        response = self.query(query, input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("confirmReservation")).is_not_none()
