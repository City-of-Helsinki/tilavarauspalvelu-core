from __future__ import annotations

import datetime
from decimal import Decimal
from functools import partial
from typing import TYPE_CHECKING, Any, NamedTuple

from graphene_django_extensions.testing import build_mutation, build_query

from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    PaymentType,
    PriceUnit,
    ReservationKind,
    ReservationStartInterval,
)
from utils.date_utils import local_date, local_datetime

from tests.factories import (
    PaymentProductFactory,
    ReservationMetadataSetFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
    ResourceFactory,
    SpaceFactory,
    TaxPercentageFactory,
    UnitFactory,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

__all__ = [
    "CREATE_MUTATION",
    "UPDATE_MUTATION",
    "create_reservation_units_for_reservation_state_filtering",
    "create_reservation_units_for_reservation_unit_state_filtering",
    "get_create_draft_input_data",
    "get_create_non_draft_input_data",
    "get_draft_update_input_data",
    "get_non_draft_update_input_data",
    "get_pricing_data",
    "reservation_unit_query",
    "reservation_units_query",
]


reservation_unit_query = partial(build_query, "reservationUnit")
reservation_units_query = partial(build_query, "reservationUnits", connection=True, order_by="pkAsc")

reservation_units_all_query = partial(build_query, "reservationUnitsAll", connection=False, order_by="pkAsc")

CREATE_MUTATION = build_mutation("createReservationUnit", "ReservationUnitCreateMutation")
UPDATE_MUTATION = build_mutation("updateReservationUnit", "ReservationUnitUpdateMutation")


def get_create_non_draft_input_data(**overrides: Any) -> dict[str, Any]:
    unit = UnitFactory.create()
    space = SpaceFactory.create(unit=unit)
    resource = ResourceFactory.create(space=space)
    reservation_unit_type = ReservationUnitTypeFactory.create()
    rule = ReservationUnitCancellationRuleFactory.create()
    metadata_set = ReservationMetadataSetFactory.create()
    tax_percentage = TaxPercentageFactory.create()

    today = local_date()

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
        "unit": unit.id,
        "reservationUnitType": reservation_unit_type.id,
        "surfaceArea": 100,
        "minPersons": 1,
        "maxPersons": 10,
        "bufferTimeBefore": 3600,
        "bufferTimeAfter": 3600,
        "cancellationRule": rule.pk,
        "reservationStartInterval": ReservationStartInterval.INTERVAL_60_MINUTES.value.upper(),
        "publishBeginsAt": "2021-05-03T00:00:00+00:00",
        "publishEndsAt": "2021-05-03T00:00:00+00:00",
        "reservationBeginsAt": "2021-05-03T00:00:00+00:00",
        "reservationEndsAt": "2021-05-03T00:00:00+00:00",
        "metadataSet": metadata_set.pk,
        "maxReservationsPerUser": 2,
        "requireReservationHandling": True,
        "authentication": AuthenticationType.STRONG.name,
        "canApplyFreeOfCharge": True,
        "reservationsMinDaysBefore": 1,
        "reservationsMaxDaysBefore": 360,
        "reservationKind": ReservationKind.DIRECT.name,
        "pricings": [
            {
                "begins": today.isoformat(),
                "priceUnit": PriceUnit.PER_15_MINS.name,
                "lowestPrice": "10.5",
                "highestPrice": "18.8",
                "taxPercentage": tax_percentage.id,
                "paymentType": PaymentType.ONLINE_OR_INVOICE,
            }
        ],
        "accessTypes": [
            {
                "beginDate": today.isoformat(),
                "accessType": AccessType.UNRESTRICTED.value,
            },
        ],
        **overrides,
    }


def get_create_draft_input_data(**overrides: Any) -> dict[str, Any]:
    unit = UnitFactory.create()
    space = SpaceFactory.create(unit=unit)
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
        "unit": unit.id,
        "reservationUnitType": reservation_unit_type.id,
        **overrides,
    }


def get_pricing_data(**overrides: Any) -> dict[str, Any]:
    tax_percentage = TaxPercentageFactory.create(value=Decimal("10.0"))

    return {
        "begins": "2022-09-11",
        "priceUnit": PriceUnit.PER_15_MINS.name,
        "lowestPrice": "18.2",
        "highestPrice": "21.5",
        "taxPercentage": tax_percentage.id,
        "paymentType": PaymentType.ONLINE_OR_INVOICE,
        **overrides,
    }


def get_draft_update_input_data(reservation_unit: ReservationUnit, **overrides) -> dict[str, Any]:
    return {
        "pk": reservation_unit.pk,
        "name": "name",
        **overrides,
    }


def get_non_draft_update_input_data(reservation_unit: ReservationUnit, **overrides):
    today = local_date()
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
        "accessTypes": [
            {
                "beginDate": today.isoformat(),
                "accessType": AccessType.UNRESTRICTED.value,
            },
        ],
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
        reservation_begins_at=(now + datetime.timedelta(hours=1)),
    )
    reservable_paid = ReservationUnitFactory.create(
        payment_product=PaymentProductFactory.create(),
        pricings__highest_price=20,
    )
    reservable_free = ReservationUnitFactory.create(
        pricings__lowest_price=0,
        pricings__highest_price=0,
    )
    scheduled_period = ReservationUnitFactory.create(
        reservation_begins_at=(now + datetime.timedelta(days=1)),
        reservation_ends_at=(now + datetime.timedelta(days=2)),
    )
    scheduled_closing = ReservationUnitFactory.create(
        pricings__lowest_price=0,
        pricings__highest_price=0,
        reservation_begins_at=(now - datetime.timedelta(days=1)),
        reservation_ends_at=(now + datetime.timedelta(days=1)),
    )
    closed = ReservationUnitFactory.create(
        reservation_begins_at=(now - datetime.timedelta(days=2)),
        reservation_ends_at=(now - datetime.timedelta(days=1)),
    )
    missing_pricing = ReservationUnitFactory.create()
    missing_payment_product = ReservationUnitFactory.create(
        pricings__highest_price=20,
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
        publish_begins_at=(now + datetime.timedelta(hours=1)),
    )
    published_reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
    )
    scheduled_period = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins_at=(now + datetime.timedelta(days=1)),
        publish_ends_at=(now + datetime.timedelta(days=2)),
    )
    scheduled_hiding = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins_at=(now - datetime.timedelta(days=1)),
        publish_ends_at=(now + datetime.timedelta(days=1)),
    )
    hidden = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins_at=(now - datetime.timedelta(days=2)),
        publish_ends_at=(now - datetime.timedelta(days=1)),
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
