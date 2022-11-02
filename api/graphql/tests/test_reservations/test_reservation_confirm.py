import datetime
import json
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

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
from merchants.verkkokauppa.order.types import Order, OrderCustomer, OrderType
from opening_hours.tests.test_get_periods import get_mocked_periods
from permissions.models import UnitRole
from reservations.models import STATE_CHOICES, AgeGroup
from reservations.tests.factories import ReservationFactory


def create_verkkokauppa_order() -> Order:
    return Order(
        order_id=uuid4(),
        namespace="tilanvaraus",
        user=str(uuid4()),
        created_at=datetime.datetime.now(),
        items=[],
        price_net=Decimal("100.0"),
        price_vat=Decimal("24.0"),
        price_total=Decimal("124.0"),
        checkout_url="https://checkout.url",
        receipt_url="http://receipt.url",
        customer=OrderCustomer(
            first_name="Liu",
            last_name="Kang",
            email="liu.kang@earthrealm.com",
            phone="+358 50 123 4567",
        ),
        status="created",
        subscription_id=uuid4(),
        type="order",
    )


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@patch(
    "opening_hours.hours.get_periods_for_resource", return_value=get_mocked_periods()
)
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

        UnitRole
        self.general_admin

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
    @patch("api.graphql.reservations.reservation_serializers.create_order")
    def test_confirm_reservation_changes_state(
        self, mock_create_order, mock_periods, mock_opening_hours
    ):
        mock_create_order.return_value = create_verkkokauppa_order()
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
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

    @patch("api.graphql.reservations.reservation_serializers.create_order")
    def test_confirm_reservation_updates_confirmed_at(
        self, mock_create_order, mock_periods, mock_opening_hours
    ):
        mock_create_order.return_value = create_verkkokauppa_order()
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        self.query(self.get_confirm_query(), input_data=input_data)
        self.reservation.refresh_from_db()
        assert_that(self.reservation.confirmed_at).is_equal_to(
            datetime.datetime(2021, 10, 12, 12).astimezone(get_default_timezone())
        )

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_confirm_reservation_succeeds_if_reservation_already_has_required_fields(
        self, mock_periods, mock_opening_hours
    ):
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
