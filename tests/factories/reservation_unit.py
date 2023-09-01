from datetime import date
from decimal import Decimal
from typing import Any, Iterable, Optional

import factory
from factory import fuzzy

from reservation_units.models import (
    Equipment,
    PriceUnit,
    PricingStatus,
    PricingType,
    Purpose,
    Qualifier,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
    ReservationUnitType,
)
from reservations.models import ReservationMetadataSet
from resources.models import Resource
from services.models import Service
from spaces.models import Space
from terms_of_use.models import TermsOfUse

from ._base import GenericDjangoModelFactory
from .equipment import EquipmentFactory
from .purpose import PurposeFactory
from .qualifier import QualifierFactory
from .reservation import ReservationMetadataSetFactory
from .resource import ResourceFactory
from .service import ServiceFactory
from .space import SpaceFactory
from .terms_of_use import TermsOfUseFactory

__all__ = [
    "ReservationUnitFactory",
    "ReservationUnitTypeFactory",
    "ReservationUnitCancellationRuleFactory",
    "ReservationUnitImageFactory",
    "ReservationUnitPricingFactory",
    "ReservationUnitPaymentTypeFactory",
]


class ReservationUnitFactory(GenericDjangoModelFactory[ReservationUnit]):
    class Meta:
        model = ReservationUnit

    sku = fuzzy.FuzzyText()
    name = fuzzy.FuzzyText()
    reservation_unit_type = factory.SubFactory("tests.factories.ReservationUnitTypeFactory")
    unit = factory.SubFactory("tests.factories.UnitFactory")

    @factory.post_generation
    def spaces(self, create: bool, spaces: Optional[Iterable[Space]], **kwargs: Any) -> None:
        if not create:
            return

        if not spaces and kwargs:
            self.spaces.add(SpaceFactory.create(**kwargs))

        for space in spaces or []:
            self.spaces.add(space)

    @factory.post_generation
    def resources(self, create: bool, resources: Optional[Iterable[Resource]], **kwargs: Any) -> None:
        if not create:
            return

        if not resources and kwargs:
            self.resources.add(ResourceFactory.create(**kwargs))

        for resource in resources or []:
            self.resources.add(resource)

    @factory.post_generation
    def services(self, create: bool, services: Optional[Iterable[Service]], **kwargs: Any) -> None:
        if not create:
            return

        if not services and kwargs:
            self.services.add(ServiceFactory.create(**kwargs))

        for service in services or []:
            self.services.add(service)

    @factory.post_generation
    def purposes(self, create: bool, purposes: Optional[Iterable[Purpose]], **kwargs: Any) -> None:
        if not create:
            return

        if not purposes and kwargs:
            self.purposes.add(PurposeFactory.create(**kwargs))

        for purpose in purposes or []:
            self.purposes.add(purpose)

    @factory.post_generation
    def equipments(self, create: bool, equipments: Optional[Iterable[Equipment]], **kwargs: Any) -> None:
        if not create:
            return

        if not equipments and kwargs:
            self.equipments.add(EquipmentFactory.create(**kwargs))

        for equipment in equipments or []:
            self.equipments.add(equipment)

    @factory.post_generation
    def qualifiers(self, create: bool, qualifiers: Optional[Iterable[Qualifier]], **kwargs: Any) -> None:
        if not create:
            return

        if not qualifiers and kwargs:
            self.qualifiers.add(QualifierFactory.create(**kwargs))

        for qualifier in qualifiers or []:
            self.qualifiers.add(qualifier)

    @factory.post_generation
    def pricings(self, create: bool, pricings: Optional[Iterable[ReservationUnitPricing]], **kwargs: Any) -> None:
        if not create:
            return

        if not pricings and kwargs:
            self.pricings.add(ReservationUnitPricingFactory.create(**kwargs))

        for pricing in pricings or []:
            self.pricings.add(pricing)

    @factory.post_generation
    def payment_types(
        self,
        create: bool,
        payment_types: Optional[Iterable[ReservationUnitPaymentType]],
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not payment_types and kwargs:
            self.payment_types.add(ReservationUnitPaymentTypeFactory.create(**kwargs))

        for payment_type in payment_types or []:
            self.payment_types.add(payment_type)

    # TODO: These should be SubFactories but some test might be expecting None for the respective fields

    @factory.post_generation
    def payment_terms(self, create: bool, terms: Optional[TermsOfUse], **kwargs: Any) -> None:
        if not create:
            return

        if not terms and kwargs:
            kwargs["terms_type"] = TermsOfUse.TERMS_TYPE_PAYMENT
            terms = TermsOfUseFactory.create(**kwargs)

        self.payment_terms = terms

    @factory.post_generation
    def cancellation_terms(self, create: bool, terms: Optional[TermsOfUse], **kwargs: Any) -> None:
        if not create:
            return

        if not terms and kwargs:
            kwargs["terms_type"] = TermsOfUse.TERMS_TYPE_CANCELLATION
            terms = TermsOfUseFactory.create(**kwargs)

        self.cancellation_terms = terms

    @factory.post_generation
    def service_specific_terms(self, create: bool, terms: Optional[TermsOfUse], **kwargs: Any) -> None:
        if not create:
            return

        if not terms and kwargs:
            kwargs["terms_type"] = TermsOfUse.TERMS_TYPE_SERVICE
            terms = TermsOfUseFactory.create(**kwargs)

        self.service_specific_terms = terms

    @factory.post_generation
    def pricing_terms(self, create: bool, terms: Optional[TermsOfUse], **kwargs: Any) -> None:
        if not create:
            return

        if not terms and kwargs:
            kwargs["terms_type"] = TermsOfUse.TERMS_TYPE_PRICING
            terms = TermsOfUseFactory.create(**kwargs)

        self.pricing_terms = terms

    @factory.post_generation
    def cancellation_rule(self, create: bool, rule: Optional[ReservationUnitCancellationRule], **kwargs: Any) -> None:
        if not create:
            return

        if not rule and kwargs:
            rule = ReservationUnitCancellationRuleFactory.create(**kwargs)

        self.cancellation_rule = rule

    @factory.post_generation
    def metadata_set(self, create: bool, meta: Optional[ReservationMetadataSet], **kwargs: Any) -> None:
        if not create:
            return

        if not meta and kwargs:
            meta = ReservationMetadataSetFactory.create(**kwargs)

        self.metadata_set = meta


class ReservationUnitTypeFactory(GenericDjangoModelFactory[ReservationUnitType]):
    class Meta:
        model = ReservationUnitType

    name = fuzzy.FuzzyText()


class ReservationUnitCancellationRuleFactory(GenericDjangoModelFactory[ReservationUnitCancellationRule]):
    class Meta:
        model = ReservationUnitCancellationRule

    name = fuzzy.FuzzyText()


class ReservationUnitImageFactory(GenericDjangoModelFactory[ReservationUnitImage]):
    class Meta:
        model = ReservationUnitImage


class ReservationUnitPricingFactory(GenericDjangoModelFactory[ReservationUnitPricing]):
    begins = date(2021, 1, 1)
    pricing_type = PricingType.PAID
    price_unit = PriceUnit.PRICE_UNIT_PER_15_MINS
    lowest_price = 5
    highest_price = 10
    lowest_price_net = Decimal("5") / Decimal("1.10")
    highest_price_net = Decimal("10") / Decimal("1.10")
    tax_percentage = factory.SubFactory("tests.factories.TaxPercentageFactory", value=10.0)
    status = PricingStatus.PRICING_STATUS_ACTIVE

    class Meta:
        model = ReservationUnitPricing


class ReservationUnitPaymentTypeFactory(GenericDjangoModelFactory[ReservationUnitPaymentType]):
    class Meta:
        model = ReservationUnitPaymentType
        django_get_or_create = ["code"]

    code = fuzzy.FuzzyText()
