from collections.abc import Iterable
from typing import Any

import factory
from factory import fuzzy

from applications.models import ApplicationRound, ApplicationRoundTimeSlot
from reservation_units.models import (
    Equipment,
    Purpose,
    Qualifier,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
)
from reservations.models import ReservationMetadataSet
from resources.models import Resource
from services.models import Service
from spaces.models import Space
from terms_of_use.models import TermsOfUse

from ._base import GenericDjangoModelFactory
from .application_round import ApplicationRoundFactory
from .application_round_time_slot import ApplicationRoundTimeSlotFactory
from .equipment import EquipmentFactory
from .purpose import PurposeFactory
from .qualifier import QualifierFactory
from .reservation_metadata import ReservationMetadataSetFactory
from .reservation_unit_cancellation_rule import ReservationUnitCancellationRuleFactory
from .reservation_unit_payment_type import ReservationUnitPaymentTypeFactory
from .reservation_unit_pricing import ReservationUnitPricingFactory
from .resource import ResourceFactory
from .service import ServiceFactory
from .space import SpaceFactory
from .terms_of_use import TermsOfUseFactory

__all__ = [
    "ReservationUnitFactory",
]


class ReservationUnitFactory(GenericDjangoModelFactory[ReservationUnit]):
    class Meta:
        model = ReservationUnit

    sku = fuzzy.FuzzyText()
    name = fuzzy.FuzzyText()
    reservation_unit_type = factory.SubFactory("tests.factories.ReservationUnitTypeFactory")
    origin_hauki_resource = None
    unit = factory.SubFactory("tests.factories.UnitFactory")

    @factory.post_generation
    def spaces(self, create: bool, spaces: Iterable[Space] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not spaces and kwargs:
            self.spaces.add(SpaceFactory.create(**kwargs))

        for space in spaces or []:
            self.spaces.add(space)

    @factory.post_generation
    def resources(self, create: bool, resources: Iterable[Resource] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not resources and kwargs:
            self.resources.add(ResourceFactory.create(**kwargs))

        for resource in resources or []:
            self.resources.add(resource)

    @factory.post_generation
    def services(self, create: bool, services: Iterable[Service] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not services and kwargs:
            self.services.add(ServiceFactory.create(**kwargs))

        for service in services or []:
            self.services.add(service)

    @factory.post_generation
    def purposes(self, create: bool, purposes: Iterable[Purpose] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not purposes and kwargs:
            self.purposes.add(PurposeFactory.create(**kwargs))

        for purpose in purposes or []:
            self.purposes.add(purpose)

    @factory.post_generation
    def equipments(self, create: bool, equipments: Iterable[Equipment] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not equipments and kwargs:
            self.equipments.add(EquipmentFactory.create(**kwargs))

        for equipment in equipments or []:
            self.equipments.add(equipment)

    @factory.post_generation
    def qualifiers(self, create: bool, qualifiers: Iterable[Qualifier] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not qualifiers and kwargs:
            self.qualifiers.add(QualifierFactory.create(**kwargs))

        for qualifier in qualifiers or []:
            self.qualifiers.add(qualifier)

    @factory.post_generation
    def pricings(self, create: bool, pricings: Iterable[ReservationUnitPricing] | None, **kwargs: Any) -> None:
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
        payment_types: Iterable[ReservationUnitPaymentType] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not payment_types and kwargs:
            self.payment_types.add(ReservationUnitPaymentTypeFactory.create(**kwargs))

        for payment_type in payment_types or []:
            self.payment_types.add(payment_type)

    @factory.post_generation
    def application_rounds(
        self,
        create: bool,
        application_rounds: Iterable[ApplicationRound] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not application_rounds and kwargs:
            self.application_rounds.add(ApplicationRoundFactory.create(**kwargs))

        for payment_type in application_rounds or []:
            self.application_rounds.add(payment_type)

    @factory.post_generation
    def application_round_timeslots(
        self,
        create: bool,
        application_round_timeslots: Iterable[ApplicationRoundTimeSlot] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not application_round_timeslots and kwargs:
            kwargs["reservation_unit"] = self
            ApplicationRoundTimeSlotFactory.create(**kwargs)

    # TODO: These should be SubFactories but some test might be expecting None for the respective fields

    @factory.post_generation
    def payment_terms(self, create: bool, terms: TermsOfUse | None, **kwargs: Any) -> None:
        if not create:
            return

        if not terms and kwargs:
            kwargs["terms_type"] = TermsOfUse.TERMS_TYPE_PAYMENT
            terms = TermsOfUseFactory.create(**kwargs)

        self.payment_terms = terms

    @factory.post_generation
    def cancellation_terms(self, create: bool, terms: TermsOfUse | None, **kwargs: Any) -> None:
        if not create:
            return

        if not terms and kwargs:
            kwargs["terms_type"] = TermsOfUse.TERMS_TYPE_CANCELLATION
            terms = TermsOfUseFactory.create(**kwargs)

        self.cancellation_terms = terms

    @factory.post_generation
    def service_specific_terms(self, create: bool, terms: TermsOfUse | None, **kwargs: Any) -> None:
        if not create:
            return

        if not terms and kwargs:
            kwargs["terms_type"] = TermsOfUse.TERMS_TYPE_SERVICE
            terms = TermsOfUseFactory.create(**kwargs)

        self.service_specific_terms = terms

    @factory.post_generation
    def pricing_terms(self, create: bool, terms: TermsOfUse | None, **kwargs: Any) -> None:
        if not create:
            return

        if not terms and kwargs:
            kwargs["terms_type"] = TermsOfUse.TERMS_TYPE_PRICING
            terms = TermsOfUseFactory.create(**kwargs)

        self.pricing_terms = terms

    @factory.post_generation
    def cancellation_rule(self, create: bool, rule: ReservationUnitCancellationRule | None, **kwargs: Any) -> None:
        if not create:
            return

        if not rule and kwargs:
            rule = ReservationUnitCancellationRuleFactory.create(**kwargs)

        self.cancellation_rule = rule

    @factory.post_generation
    def metadata_set(self, create: bool, meta: ReservationMetadataSet | None, **kwargs: Any) -> None:
        if not create:
            return

        if not meta and kwargs:
            meta = ReservationMetadataSetFactory.create(**kwargs)

        self.metadata_set = meta
