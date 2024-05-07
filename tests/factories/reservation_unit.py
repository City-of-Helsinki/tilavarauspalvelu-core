import datetime
import uuid
from typing import Any

import factory
from factory import fuzzy

from common.date_utils import local_start_of_day
from reservation_units.enums import AuthenticationType, ReservationKind, ReservationStartInterval
from reservation_units.models import ReservationUnit

from ._base import GenericDjangoModelFactory, ManyToManyFactory, NullableSubFactory, OneToManyFactory

__all__ = [
    "ReservationUnitFactory",
]


class ReservationUnitFactory(GenericDjangoModelFactory[ReservationUnit]):
    class Meta:
        model = ReservationUnit

    # IDs
    sku = fuzzy.FuzzyText()
    uuid = factory.LazyFunction(uuid.uuid4)
    rank = factory.Sequence(lambda n: n)

    # Strings
    name = fuzzy.FuzzyText()
    description = fuzzy.FuzzyText()
    contact_information = fuzzy.FuzzyText()
    terms_of_use = fuzzy.FuzzyText()
    reservation_pending_instructions = ""
    reservation_confirmed_instructions = ""
    reservation_cancelled_instructions = ""

    # Integers
    surface_area = None
    min_persons = None
    max_persons = None
    max_reservations_per_user = None
    reservations_min_days_before = None
    reservations_max_days_before = None

    # Datetime
    reservation_begins = None
    reservation_ends = None
    publish_begins = None
    publish_ends = None
    max_reservation_duration = None
    min_reservation_duration = None
    buffer_time_before = factory.LazyFunction(datetime.timedelta)
    buffer_time_after = factory.LazyFunction(datetime.timedelta)

    # Booleans
    is_draft = False
    is_archived = False
    require_introduction = False
    require_reservation_handling = False
    reservation_block_whole_day = False
    can_apply_free_of_charge = False
    allow_reservations_without_opening_hours = False

    # Enums
    authentication = AuthenticationType.WEAK.value
    reservation_start_interval = ReservationStartInterval.INTERVAL_15_MINUTES.value
    reservation_kind = ReservationKind.DIRECT_AND_SEASON.value

    # Forward many-to-one related
    unit = factory.SubFactory("tests.factories.UnitFactory")
    reservation_unit_type = factory.SubFactory("tests.factories.ReservationUnitTypeFactory")
    origin_hauki_resource = NullableSubFactory("tests.factories.OriginHaukiResourceFactory", null=True)
    cancellation_rule = NullableSubFactory("tests.factories.ReservationUnitCancellationRuleFactory", null=True)
    metadata_set = NullableSubFactory("tests.factories.ReservationMetadataSetFactory", null=True)
    cancellation_terms = NullableSubFactory("tests.factories.TermsOfUseFactory", null=True)
    service_specific_terms = NullableSubFactory("tests.factories.TermsOfUseFactory", null=True)
    pricing_terms = NullableSubFactory("tests.factories.TermsOfUseFactory", null=True)
    payment_terms = NullableSubFactory("tests.factories.TermsOfUseFactory", null=True)
    payment_product = NullableSubFactory("tests.factories.PaymentProductFactory", null=True)
    payment_merchant = NullableSubFactory("tests.factories.PaymentMerchantFactory", null=True)
    payment_accounting = NullableSubFactory("tests.factories.PaymentAccountingFactory", null=True)

    # Forward many-to-many
    spaces = ManyToManyFactory("tests.factories.SpaceFactory")
    resources = ManyToManyFactory("tests.factories.ResourceFactory")
    purposes = ManyToManyFactory("tests.factories.PurposeFactory")
    equipments = ManyToManyFactory("tests.factories.EquipmentFactory")
    services = ManyToManyFactory("tests.factories.ServiceFactory")
    payment_types = ManyToManyFactory("tests.factories.ReservationUnitPaymentTypeFactory")
    qualifiers = ManyToManyFactory("tests.factories.QualifierFactory")
    keyword_groups = ManyToManyFactory("tests.factories.KeywordGroupFactory")

    # Reverse many-to-many
    application_rounds = ManyToManyFactory("tests.factories.ApplicationRoundFactory")
    reservation_set = ManyToManyFactory("tests.factories.ReservationFactory")

    # Reverse one-to-many
    images = OneToManyFactory("tests.factories.ReservationUnitImageFactory")
    pricings = OneToManyFactory("tests.factories.ReservationUnitPricingFactory")
    application_round_time_slots = OneToManyFactory("tests.factories.ApplicationRoundTimeSlotFactory")

    @classmethod
    def create_published(cls, **kwargs: Any) -> ReservationUnit:
        return cls.create(
            is_draft=False,
            name="foo",
            name_fi="foo",
            name_sv="foo",
            name_en="foo",
            description="foo",
            description_fi="foo",
            description_sv="foo",
            description_en="foo",
            **kwargs,
        )

    @classmethod
    def create_reservable_now(cls, **kwargs: Any) -> ReservationUnit:
        """Create a reservation unit that is reservable for yesterday, the current day, and the next day."""
        from .opening_hours import ReservableTimeSpanFactory
        from .space import SpaceFactory

        start_of_today = local_start_of_day()

        space = SpaceFactory.create()

        kwargs.setdefault("origin_hauki_resource__id", "987")
        kwargs.setdefault("spaces", [space])
        kwargs.setdefault("unit", space.unit)
        reservation_unit = cls.create(**kwargs)

        ReservableTimeSpanFactory.create(
            resource=reservation_unit.origin_hauki_resource,
            start_datetime=start_of_today - datetime.timedelta(days=1),
            end_datetime=start_of_today + datetime.timedelta(days=4),
        )

        return reservation_unit
