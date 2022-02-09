import datetime

from django.test import TestCase
from django.utils.timezone import get_default_timezone

from email_notification.models import EmailType
from email_notification.tests.factories import EmailTemplateFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import ReservationFactory
from spaces.tests.factories import LocationFactory, UnitFactory


class ReservationEmailBaseTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.email_template = EmailTemplateFactory(
            type=EmailType.RESERVATION_CONFIRMED,
            content="This is the {{ reservation_number }} content",
            subject="Los subjectos {{ name }}",
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
        cls.reservation_unit = ReservationUnitFactory(unit=cls.unit)
        cls.reservation = ReservationFactory(
            reservee_first_name="Let it",
            reservee_last_name="Snow",
            reservee_email="reservee@testing.isbesthing",
            name="Dance time!",
            reservation_unit=[cls.reservation_unit],
            end=cls.end,
            begin=cls.begin,
        )
