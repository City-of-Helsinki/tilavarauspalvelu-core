import datetime

from django.test import TestCase
from django.utils.timezone import get_default_timezone

from email_notification.models import EmailType
from email_notification.tests.factories import EmailTemplateFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import (
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
)
from spaces.tests.factories import LocationFactory, UnitFactory


class ReservationEmailBaseTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.email_template = EmailTemplateFactory(
            type=EmailType.RESERVATION_CONFIRMED,
            content="This is the {{ reservation_number }} content",
            content_en="This is the {{ reservation_number }} content in english",
            subject="Los subjectos {{ name }}",
            subject_en="Los subjectos inglesa {{ name }}",
        )

        cls.unit = UnitFactory(name="The unit")
        cls.location = LocationFactory(
            unit=cls.unit,
            address_street="brilliant st 10",
            address_city="Btown",
            address_zip="00001b",
        )
        cls.begin = datetime.datetime(2022, 2, 9, 10, 0, tzinfo=get_default_timezone())
        cls.end = datetime.datetime(2022, 2, 9, 12, 0, tzinfo=get_default_timezone())
        deny_reason = ReservationDenyReasonFactory(
            reason="deny reason", reason_en="en deny reason"
        )
        cancel_reason = ReservationCancelReasonFactory(
            reason="cancel reason", reason_en="en cancel reason"
        )
        cls.reservation_unit = ReservationUnitFactory(
            unit=cls.unit,
            reservation_pending_instructions="pend instru",
            reservation_pending_instructions_en="en pend instru",
            reservation_confirmed_instructions="conf instru",
            reservation_confirmed_instructions_en="en conf instru",
            reservation_cancelled_instructions="can instru",
            reservation_cancelled_instructions_en="en can instru",
        )
        cls.reservation = ReservationFactory(
            reservee_first_name="Let it",
            reservee_last_name="Snow",
            reservee_email="reservee@testing.isbesthing",
            name="Dance time!",
            reservation_unit=[cls.reservation_unit],
            end=cls.end,
            begin=cls.begin,
            deny_reason=deny_reason,
            cancel_reason=cancel_reason,
        )
