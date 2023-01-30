from assertpy import assert_that
from django.test import TestCase
from django.utils.timezone import get_default_timezone

from applications.models import CUSTOMER_TYPES
from email_notification.sender.email_notification_context import (
    EmailNotificationContext,
)
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import (
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
)
from spaces.tests.factories import LocationFactory, UnitFactory


class EmailNotificationContextTestCase(TestCase):
    def setUp(self) -> None:
        self.unit = UnitFactory.create(name="Test unit")
        self.location = LocationFactory.create(
            unit=self.unit,
            address_street="Street",
            address_zip="0100",
            address_city="Rovaniemi",
        )
        self.reservation_unit = ReservationUnitFactory.create(unit=self.unit)
        self.deny_reason = ReservationDenyReasonFactory.create()
        self.cancel_reason = ReservationCancelReasonFactory.create()
        self.reservation = ReservationFactory.create(
            reservation_unit=[self.reservation_unit],
            deny_reason=self.deny_reason,
            cancel_reason=self.cancel_reason,
        )

    def test_from_reservation(self):
        context = EmailNotificationContext.from_reservation(self.reservation)

        assert_that(context.reservee_name).is_equal_to(
            f"{self.reservation.reservee_first_name} {self.reservation.reservee_last_name}"
        )
        assert_that(context.reservation_name).is_equal_to(self.reservation.name)
        assert_that(context.begin_datetime).is_equal_to(
            self.reservation.begin.astimezone(get_default_timezone())
        )
        assert_that(context.end_datetime).is_equal_to(
            self.reservation.end.astimezone(get_default_timezone())
        )
        assert_that(context.reservation_number).is_equal_to(self.reservation.id)
        assert_that(context.unit_location).is_equal_to(
            f"{self.location.address_street} {self.location.address_zip} {self.location.address_city}"
        )
        assert_that(context.unit_name).is_equal_to(self.unit.name)
        assert_that(context.price).is_equal_to(self.reservation.price)
        assert_that(context.non_subsidised_price).is_equal_to(
            self.reservation.non_subsidised_price
        )
        assert_that(context.subsidised_price).is_equal_to(self.reservation.price)
        assert_that(context.tax_percentage).is_equal_to(
            self.reservation.tax_percentage_value
        )
        assert_that(context.reservee_language).is_equal_to(
            self.reservation.reservee_language
        )
        assert_that(context.confirmed_instructions["fi"]).is_equal_to(
            self.reservation_unit.reservation_confirmed_instructions_fi
        )
        assert_that(context.confirmed_instructions["sv"]).is_equal_to(
            self.reservation_unit.reservation_confirmed_instructions_sv
        )
        assert_that(context.confirmed_instructions["en"]).is_equal_to(
            self.reservation_unit.reservation_confirmed_instructions_en
        )
        assert_that(context.pending_instructions["fi"]).is_equal_to(
            self.reservation_unit.reservation_pending_instructions_fi
        )
        assert_that(context.pending_instructions["sv"]).is_equal_to(
            self.reservation_unit.reservation_pending_instructions_sv
        )
        assert_that(context.pending_instructions["en"]).is_equal_to(
            self.reservation_unit.reservation_pending_instructions_en
        )
        assert_that(context.cancelled_instructions["fi"]).is_equal_to(
            self.reservation_unit.reservation_cancelled_instructions_fi
        )
        assert_that(context.cancelled_instructions["sv"]).is_equal_to(
            self.reservation_unit.reservation_cancelled_instructions_sv
        )
        assert_that(context.cancelled_instructions["en"]).is_equal_to(
            self.reservation_unit.reservation_cancelled_instructions_en
        )
        assert_that(context.deny_reason["fi"]).is_equal_to(self.deny_reason.reason_fi)
        assert_that(context.deny_reason["sv"]).is_equal_to(self.deny_reason.reason_sv)
        assert_that(context.deny_reason["en"]).is_equal_to(self.deny_reason.reason_en)
        assert_that(context.cancel_reason["fi"]).is_equal_to(
            self.cancel_reason.reason_fi
        )
        assert_that(context.cancel_reason["sv"]).is_equal_to(
            self.cancel_reason.reason_sv
        )
        assert_that(context.cancel_reason["en"]).is_equal_to(
            self.cancel_reason.reason_en
        )

    def test_from_reservation_organisation_name(self):
        self.reservation.reservee_type = CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS
        self.reservation.reservee_organisation_name = "Business"
        self.reservation.save()

        context = EmailNotificationContext.from_reservation(self.reservation)
        assert_that(context.reservee_name).is_equal_to(
            self.reservation.reservee_organisation_name
        )

    def test_from_reservation_no_location(self):
        self.location.delete()
        context = EmailNotificationContext.from_reservation(self.reservation)
        assert_that(context.unit_location).is_none()
