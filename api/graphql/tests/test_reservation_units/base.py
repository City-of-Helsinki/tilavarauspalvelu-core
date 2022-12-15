import datetime
from uuid import UUID

import snapshottest
from django.conf import settings
from django.test import override_settings
from django.utils.timezone import get_default_timezone
from rest_framework.test import APIClient

from api.graphql.tests.base import GrapheneTestCaseBase
from merchants.verkkokauppa.product.types import Product
from opening_hours.enums import State
from opening_hours.hours import TimeElement
from reservation_units.models import PaymentType, ReservationUnit, TaxPercentage
from reservation_units.tests.factories import (
    PurposeFactory,
    QualifierFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    ReservationUnitTypeFactory,
)
from reservations.tests.factories import ReservationMetadataSetFactory
from resources.tests.factories import ResourceFactory
from services.tests.factories import ServiceFactory
from spaces.tests.factories import SpaceFactory, UnitFactory
from terms_of_use.models import TermsOfUse
from terms_of_use.tests.factories import TermsOfUseFactory

DEFAULT_TIMEZONE = get_default_timezone()


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, UPDATE_PRODUCT_MAPPING=True)
class ReservationUnitQueryTestCaseBase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.type = ReservationUnitTypeFactory(
            name="test type fi",
            name_fi="test type fi",
            name_en="test type en",
            name_sv="test type sv",
        )
        service = ServiceFactory(
            name="Test Service",
            buffer_time_before=datetime.timedelta(minutes=15),
            buffer_time_after=datetime.timedelta(minutes=30),
        )
        large_space = SpaceFactory(
            max_persons=100, name="Large space", surface_area=100
        )
        cls.small_space = SpaceFactory(
            max_persons=10, name="Small space", surface_area=50
        )
        rule = ReservationUnitCancellationRuleFactory(
            name_fi="fi", name_en="en", name_sv="sv"
        )

        qualifier = QualifierFactory(name="Test Qualifier")

        cls.unit = UnitFactory(
            name="test unit fi",
            name_fi="test unit fi",
            name_en="test unit en",
            name_sv="test unit sv",
        )

        cls.reservation_unit = ReservationUnitFactory(
            name="test name fi",
            name_fi="test name fi",
            name_en="test name en",
            name_sv="test name sv",
            unit=cls.unit,
            reservation_unit_type=cls.type,
            uuid="3774af34-9916-40f2-acc7-68db5a627710",
            spaces=[large_space, cls.small_space],
            services=[service],
            cancellation_rule=rule,
            reservation_confirmed_instructions_fi="Hyväksytyn varauksen lisäohjeita",
            reservation_confirmed_instructions_sv="Ytterligare instruktioner för den godkända reservationen",
            reservation_confirmed_instructions_en="Additional instructions for the approved reservation",
            is_draft=False,
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_30_MINUTES,
            reservation_begins=datetime.datetime.now(tz=get_default_timezone()),
            reservation_ends=datetime.datetime.now(tz=get_default_timezone()),
            publish_begins=datetime.datetime.now(tz=get_default_timezone()),
            publish_ends=datetime.datetime.now(tz=get_default_timezone())
            + datetime.timedelta(days=7),
            buffer_time_before=datetime.timedelta(minutes=15),
            buffer_time_after=datetime.timedelta(minutes=15),
            min_reservation_duration=datetime.timedelta(minutes=10),
            max_reservation_duration=datetime.timedelta(days=1),
            metadata_set=ReservationMetadataSetFactory(name="Test form"),
            max_reservations_per_user=5,
            min_persons=10,
            max_persons=200,
            reservations_max_days_before=360,
            reservations_min_days_before=1,
            pricing_terms=TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PRICING),
        )
        cls.reservation_unit.qualifiers.set([qualifier])
        cls.reservation_unit.payment_types.set([PaymentType.ONLINE])
        cls.reservation_unit.pricings.add(
            ReservationUnitPricingFactory(reservation_unit=cls.reservation_unit)
        )

        cls.api_client = APIClient()

    def content_is_empty(self, content):
        return len(content["data"]["reservationUnits"]["edges"]) == 0


class ReservationUnitMutationsTestCaseBase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.unit = UnitFactory()
        cls.purpose = PurposeFactory()
        cls.qualifier = QualifierFactory()
        cls.space = SpaceFactory(unit=cls.unit)
        cls.resource = ResourceFactory()
        cls.reservation_unit_type = ReservationUnitTypeFactory()
        cls.service = ServiceFactory()
        cls.rule = ReservationUnitCancellationRuleFactory(
            name_fi="fi",
            name_en="en",
            name_sv="sv",
        )
        cls.metadata_set = ReservationMetadataSetFactory(name="Test form")
        cls.pricing_term = TermsOfUseFactory(
            name="Test pricing terms", terms_type=TermsOfUse.TERMS_TYPE_PRICING
        )
        cls.tax_percentage = TaxPercentage.objects.get(value=24)

    def setUp(self):
        self.client.force_login(self.general_admin)


def mock_create_product(*args, **kwargs):
    return Product(
        product_id=UUID("1018cabd-d693-41c1-8ddc-dc5c08829048"),
        namespace="tilanvaraus",
        namespace_entity_id="foo",
        merchant_id="bar",
    )


def get_mocked_opening_hours(uuid):
    resource_id = f"{settings.HAUKI_ORIGIN_ID}:{uuid}"
    return [
        {
            "timezone": DEFAULT_TIMEZONE,
            "resource_id": resource_id,
            "origin_id": str(uuid),
            "date": datetime.date(2020, 1, 1),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                    resource_state=State.WITH_RESERVATION,
                    periods=[1, 2, 3, 4],
                ),
            ],
        },
        {
            "timezone": DEFAULT_TIMEZONE,
            "resource_id": resource_id,
            "origin_id": str(uuid),
            "date": datetime.date(2020, 1, 2),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                    resource_state=State.WITH_RESERVATION,
                    periods=[
                        1,
                    ],
                ),
            ],
        },
    ]


def get_mocked_periods():
    data = [
        {
            "id": 38600,
            "resource": 26220,
            "name": {"fi": "Vakiovuorot", "sv": "", "en": ""},
            "description": {"fi": "", "sv": "", "en": ""},
            "start_date": "2020-01-01",
            "end_date": None,
            "resource_state": "undefined",
            "override": False,
            "origins": [],
            "created": "2021-05-07T13:01:30.477693+03:00",
            "modified": "2021-05-07T13:01:30.477693+03:00",
            "time_span_groups": [
                {
                    "id": 29596,
                    "period": 38600,
                    "time_spans": [
                        {
                            "id": 39788,
                            "group": 29596,
                            "name": {"fi": None, "sv": None, "en": None},
                            "description": {"fi": None, "sv": None, "en": None},
                            "start_time": "09:00:00",
                            "end_time": "21:00:00",
                            "end_time_on_next_day": False,
                            "full_day": False,
                            "weekdays": [6],
                            "resource_state": "open",
                            "created": "2021-05-07T13:01:30.513468+03:00",
                            "modified": "2021-05-07T13:01:30.513468+03:00",
                        },
                        {
                            "id": 39789,
                            "group": 29596,
                            "name": {
                                "fi": None,
                                "sv": None,
                                "en": None,
                            },
                            "description": {"fi": None, "sv": None, "en": None},
                            "start_time": "09:00:00",
                            "end_time": "21:00:00",
                            "end_time_on_next_day": False,
                            "full_day": False,
                            "weekdays": [7],
                            "resource_state": "open",
                            "created": "2021-05-07T13:01:30.530932+03:00",
                            "modified": "2021-05-07T13:01:30.530932+03:00",
                        },
                    ],
                    "rules": [],
                    "is_removed": False,
                }
            ],
        }
    ]
    return data


DEFAULT_TIMEZONE = get_default_timezone()
