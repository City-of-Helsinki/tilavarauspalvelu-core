import datetime
from uuid import UUID

import snapshottest
from django.test import override_settings
from django.utils.timezone import get_default_timezone
from rest_framework.test import APIClient

from api.graphql.tests.base import GrapheneTestCaseBase
from merchants.verkkokauppa.product.types import Product
from reservation_units.enums import PaymentType, ReservationStartInterval
from reservation_units.models import TaxPercentage
from terms_of_use.models import TermsOfUse
from tests.factories import (
    PurposeFactory,
    QualifierFactory,
    ReservationMetadataSetFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    ReservationUnitTypeFactory,
    ResourceFactory,
    ServiceFactory,
    SpaceFactory,
    TermsOfUseFactory,
    UnitFactory,
)

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
        large_space = SpaceFactory(max_persons=100, name="Large space", surface_area=100)
        cls.small_space = SpaceFactory(max_persons=10, name="Small space", surface_area=50)
        rule = ReservationUnitCancellationRuleFactory(name_fi="fi", name_en="en", name_sv="sv")

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
            reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
            reservation_begins=datetime.datetime.now(tz=DEFAULT_TIMEZONE),
            reservation_ends=datetime.datetime.now(tz=DEFAULT_TIMEZONE),
            publish_begins=datetime.datetime.now(tz=DEFAULT_TIMEZONE),
            publish_ends=datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(days=7),
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
        cls.reservation_unit.pricings.add(ReservationUnitPricingFactory(reservation_unit=cls.reservation_unit))

        cls.api_client = APIClient()

    def content_is_empty(self, content):
        return len(((content.get("data") or {}).get("reservationUnits") or {}).get("edges", [])) == 0


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
        cls.pricing_term = TermsOfUseFactory(name="Test pricing terms", terms_type=TermsOfUse.TERMS_TYPE_PRICING)
        cls.tax_percentage = TaxPercentage.objects.get(value=24)

    def setUp(self):
        self.client.force_login(self.general_admin)


def mock_create_product():
    return Product(
        product_id=UUID("1018cabd-d693-41c1-8ddc-dc5c08829048"),
        namespace="tilanvaraus",
        namespace_entity_id="foo",
        merchant_id="bar",
    )
