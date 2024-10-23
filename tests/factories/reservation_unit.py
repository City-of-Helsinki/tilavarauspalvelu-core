import datetime
import uuid
from typing import Any

import factory
from factory import LazyAttribute

from tilavarauspalvelu.enums import AuthenticationType, ReservationKind, ReservationStartInterval
from tilavarauspalvelu.models import ReservationUnit
from utils.date_utils import local_start_of_day

from ._base import (
    FakerEN,
    FakerFI,
    FakerSV,
    ForeignKeyFactory,
    GenericDjangoModelFactory,
    ManyToManyFactory,
    ReverseForeignKeyFactory,
)

__all__ = [
    "ReservationUnitFactory",
]


class ReservationUnitFactory(GenericDjangoModelFactory[ReservationUnit]):
    class Meta:
        model = ReservationUnit

    # IDs
    sku = FakerFI("word")
    uuid = factory.LazyFunction(uuid.uuid4)
    rank = factory.Sequence(lambda n: n)

    # Strings
    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    description = FakerFI("sentence")
    description_fi = LazyAttribute(lambda i: i.description)
    description_en = FakerEN("sentence")
    description_sv = FakerSV("sentence")

    contact_information = FakerFI("sentence")

    terms_of_use = FakerFI("sentence")
    terms_of_use_fi = LazyAttribute(lambda i: i.terms_of_use)
    terms_of_use_en = FakerEN("sentence")
    terms_of_use_sv = FakerSV("sentence")

    reservation_pending_instructions = FakerFI("sentence")
    reservation_pending_instructions_fi = LazyAttribute(lambda i: i.reservation_pending_instructions)
    reservation_pending_instructions_en = FakerEN("sentence")
    reservation_pending_instructions_sv = FakerSV("sentence")

    reservation_confirmed_instructions = FakerFI("sentence")
    reservation_confirmed_instructions_fi = LazyAttribute(lambda i: i.reservation_confirmed_instructions)
    reservation_confirmed_instructions_en = FakerEN("sentence")
    reservation_confirmed_instructions_sv = FakerSV("sentence")

    reservation_cancelled_instructions = FakerFI("sentence")
    reservation_cancelled_instructions_fi = LazyAttribute(lambda i: i.reservation_cancelled_instructions)
    reservation_cancelled_instructions_en = FakerEN("sentence")
    reservation_cancelled_instructions_sv = FakerSV("sentence")

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
    unit = ForeignKeyFactory("tests.factories.UnitFactory", required=True)
    origin_hauki_resource = ForeignKeyFactory("tests.factories.OriginHaukiResourceFactory")
    reservation_unit_type = ForeignKeyFactory("tests.factories.ReservationUnitTypeFactory", required=True)
    cancellation_rule = ForeignKeyFactory("tests.factories.ReservationUnitCancellationRuleFactory")
    metadata_set = ForeignKeyFactory("tests.factories.ReservationMetadataSetFactory")
    cancellation_terms = ForeignKeyFactory("tests.factories.TermsOfUseFactory")
    service_specific_terms = ForeignKeyFactory("tests.factories.TermsOfUseFactory")
    pricing_terms = ForeignKeyFactory("tests.factories.TermsOfUseFactory")
    payment_terms = ForeignKeyFactory("tests.factories.TermsOfUseFactory")
    payment_product = ForeignKeyFactory("tests.factories.PaymentProductFactory")
    payment_merchant = ForeignKeyFactory("tests.factories.PaymentMerchantFactory")
    payment_accounting = ForeignKeyFactory("tests.factories.PaymentAccountingFactory")

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
    reservations = ManyToManyFactory("tests.factories.ReservationFactory")

    # Reverse one-to-many
    images = ReverseForeignKeyFactory("tests.factories.ReservationUnitImageFactory")
    pricings = ReverseForeignKeyFactory("tests.factories.ReservationUnitPricingFactory")
    introductions = ReverseForeignKeyFactory("tests.factories.IntroductionFactory")
    recurring_reservations = ReverseForeignKeyFactory("tests.factories.RecurringReservationFactory")
    application_round_time_slots = ReverseForeignKeyFactory("tests.factories.ApplicationRoundTimeSlotFactory")
    reservation_unit_options = ReverseForeignKeyFactory("tests.factories.ReservationUnitOptionFactory")

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
        from .reservable_time_span import ReservableTimeSpanFactory
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
