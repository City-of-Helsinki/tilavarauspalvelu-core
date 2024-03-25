import datetime
from functools import partial
from typing import Any, NamedTuple

from graphene_django_extensions.testing import build_mutation, build_query

from common.date_utils import local_datetime
from reservation_units.enums import (
    AuthenticationType,
    PriceUnit,
    PricingStatus,
    PricingType,
    ReservationKind,
    ReservationStartInterval,
)
from reservation_units.models import ReservationUnit
from tests.factories import (
    PaymentProductFactory,
    ReservationMetadataSetFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
    ResourceFactory,
    ServiceFactory,
    SpaceFactory,
    TaxPercentageFactory,
    UnitFactory,
)

__all__ = [
    "CREATE_MUTATION",
    "create_reservation_units_for_reservation_state_filtering",
    "create_reservation_units_for_reservation_unit_state_filtering",
    "get_create_draft_input_data",
    "get_create_non_draft_input_data",
    "get_draft_update_input_data",
    "get_non_draft_update_input_data",
    "get_pricing_data",
    "reservation_unit_query",
    "reservation_units_query",
    "UPDATE_MUTATION",
]


reservation_unit_query = partial(build_query, "reservationUnit")
reservation_units_query = partial(build_query, "reservationUnits", connection=True, order_by="pkAsc")

CREATE_MUTATION = build_mutation("createReservationUnit", "ReservationUnitCreateMutation")
UPDATE_MUTATION = build_mutation("updateReservationUnit", "ReservationUnitUpdateMutation")


def get_create_non_draft_input_data() -> dict[str, Any]:
    unit = UnitFactory.create()
    space = SpaceFactory.create(unit=unit)
    service = ServiceFactory.create()
    resource = ResourceFactory.create(space=space)
    reservation_unit_type = ReservationUnitTypeFactory.create()
    rule = ReservationUnitCancellationRuleFactory.create()
    metadata_set = ReservationMetadataSetFactory.create()
    tax_percentage = TaxPercentageFactory.create()

    return {
        "isDraft": False,
        "name": "Name",
        "nameFi": "Name FI",
        "nameEn": "Name EN",
        "nameSv": "Name SV",
        "description": "desc",
        "descriptionFi": "desc FI",
        "descriptionEn": "desc EN",
        "descriptionSv": "desc SV",
        "contactInformation": "contact info",
        "spaces": [space.id],
        "resources": [resource.id],
        "services": [service.id],
        "unit": unit.id,
        "reservationUnitType": reservation_unit_type.id,
        "surfaceArea": 100,
        "minPersons": 1,
        "maxPersons": 10,
        "bufferTimeBefore": 3600,
        "bufferTimeAfter": 3600,
        "cancellationRule": rule.pk,
        "reservationStartInterval": ReservationStartInterval.INTERVAL_60_MINUTES.value.upper(),
        "publishBegins": "2021-05-03T00:00:00+00:00",
        "publishEnds": "2021-05-03T00:00:00+00:00",
        "reservationBegins": "2021-05-03T00:00:00+00:00",
        "reservationEnds": "2021-05-03T00:00:00+00:00",
        "metadataSet": metadata_set.pk,
        "maxReservationsPerUser": 2,
        "requireReservationHandling": True,
        "authentication": AuthenticationType.STRONG.value.upper(),
        "canApplyFreeOfCharge": True,
        "reservationsMinDaysBefore": 1,
        "reservationsMaxDaysBefore": 360,
        "reservationKind": ReservationKind.DIRECT.value.upper(),
        "pricings": [
            {
                "begins": datetime.date.today().strftime("%Y-%m-%d"),
                "pricingType": PricingType.PAID.value.upper(),
                "priceUnit": PriceUnit.PRICE_UNIT_PER_15_MINS.value.upper(),
                "lowestPrice": "10.5",
                "highestPrice": "18.8",
                "taxPercentage": tax_percentage.id,
                "status": PricingStatus.PRICING_STATUS_ACTIVE.value.upper(),
            }
        ],
    }


def get_create_draft_input_data(**overrides: Any) -> dict[str, Any]:
    unit = UnitFactory.create()
    space = SpaceFactory.create(unit=unit)
    service = ServiceFactory.create()
    resource = ResourceFactory.create(space=space)
    reservation_unit_type = ReservationUnitTypeFactory.create()

    return {
        "isDraft": True,
        "name": "Name",
        "nameFi": "Name FI",
        "nameEn": "Name EN",
        "nameSv": "Name SV",
        "description": "desc",
        "descriptionFi": "desc FI",
        "descriptionEn": "desc EN",
        "descriptionSv": "desc SV",
        "spaces": [space.id],
        "resources": [resource.id],
        "services": [service.id],
        "unit": unit.id,
        "reservationUnitType": reservation_unit_type.id,
        **overrides,
    }


def get_pricing_data(**overrides: Any) -> dict[str, Any]:
    return {
        "begins": "2022-09-11",
        "pricingType": PricingType.PAID.value.upper(),
        "priceUnit": PriceUnit.PRICE_UNIT_PER_15_MINS.value.upper(),
        "lowestPrice": "18.2",
        "highestPrice": "21.5",
        "taxPercentage": 2,
        "status": PricingStatus.PRICING_STATUS_ACTIVE.value.upper(),
        **overrides,
    }


def get_draft_update_input_data(reservation_unit: ReservationUnit, **overrides) -> dict[str, Any]:
    return {
        "pk": reservation_unit.pk,
        "name": "name",
        **overrides,
    }


def get_non_draft_update_input_data(reservation_unit: ReservationUnit, **overrides):
    return {
        "pk": reservation_unit.pk,
        "name": "name",
        "nameFi": "name",
        "nameEn": "name",
        "nameSv": "name",
        "descriptionFi": "description",
        "descriptionEn": "description",
        "descriptionSv": "description",
        "pricings": [get_pricing_data()],
        **overrides,
    }


class ReservationStateFiltering(NamedTuple):
    scheduled_reservation: ReservationUnit
    reservable_paid: ReservationUnit
    reservable_free: ReservationUnit
    scheduled_period: ReservationUnit
    scheduled_closing: ReservationUnit
    closed: ReservationUnit
    missing_pricing: ReservationUnit
    missing_payment_product: ReservationUnit


def create_reservation_units_for_reservation_state_filtering() -> ReservationStateFiltering:
    now = local_datetime()

    scheduled_reservation = ReservationUnitFactory.create(
        reservation_begins=(now + datetime.timedelta(hours=1)),
    )
    reservable_paid = ReservationUnitFactory.create(
        payment_product=PaymentProductFactory.create(),
        pricings__pricing_type=PricingType.PAID,
    )
    reservable_free = ReservationUnitFactory.create(
        pricings__pricing_type=PricingType.FREE,
    )
    scheduled_period = ReservationUnitFactory.create(
        reservation_begins=(now + datetime.timedelta(days=1)),
        reservation_ends=(now + datetime.timedelta(days=2)),
    )
    scheduled_closing = ReservationUnitFactory.create(
        pricings__pricing_type=PricingType.FREE,
        reservation_begins=(now - datetime.timedelta(days=1)),
        reservation_ends=(now + datetime.timedelta(days=1)),
    )
    closed = ReservationUnitFactory.create(
        reservation_begins=(now - datetime.timedelta(days=2)),
        reservation_ends=(now - datetime.timedelta(days=1)),
    )
    missing_pricing = ReservationUnitFactory.create()
    missing_payment_product = ReservationUnitFactory.create(
        pricings__pricing_type=PricingType.PAID,
    )

    return ReservationStateFiltering(
        scheduled_reservation=scheduled_reservation,
        reservable_paid=reservable_paid,
        reservable_free=reservable_free,
        scheduled_period=scheduled_period,
        scheduled_closing=scheduled_closing,
        closed=closed,
        missing_pricing=missing_pricing,
        missing_payment_product=missing_payment_product,
    )


class ReservationUnitStateFiltering(NamedTuple):
    archived: ReservationUnit
    draft: ReservationUnit
    scheduled_publishing: ReservationUnit
    published: ReservationUnit
    scheduled_period: ReservationUnit
    scheduled_hiding: ReservationUnit
    hidden: ReservationUnit


def create_reservation_units_for_reservation_unit_state_filtering() -> ReservationUnitStateFiltering:
    now = local_datetime()
    archived_reservation_unit = ReservationUnitFactory.create(
        is_archived=True,
    )
    draft_reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=True,
    )
    scheduled_publishing_reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=(now + datetime.timedelta(hours=1)),
    )
    published_reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
    )
    scheduled_period = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=(now + datetime.timedelta(days=1)),
        publish_ends=(now + datetime.timedelta(days=2)),
    )
    scheduled_hiding = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=(now - datetime.timedelta(days=1)),
        publish_ends=(now + datetime.timedelta(days=1)),
    )
    hidden = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=(now - datetime.timedelta(days=2)),
        publish_ends=(now - datetime.timedelta(days=1)),
    )

    return ReservationUnitStateFiltering(
        archived=archived_reservation_unit,
        draft=draft_reservation_unit,
        scheduled_publishing=scheduled_publishing_reservation_unit,
        published=published_reservation_unit,
        scheduled_period=scheduled_period,
        scheduled_hiding=scheduled_hiding,
        hidden=hidden,
    )
