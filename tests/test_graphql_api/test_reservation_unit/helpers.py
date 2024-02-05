import datetime
from functools import partial
from typing import Any

from reservation_units.enums import PriceUnit, PricingStatus, PricingType, ReservationKind, ReservationStartInterval
from tests.factories import (
    ReservationMetadataSetFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitTypeFactory,
    ResourceFactory,
    ServiceFactory,
    SpaceFactory,
    TaxPercentageFactory,
    UnitFactory,
)
from tests.gql_builders import build_mutation, build_query

TIMESLOTS_QUERY = build_query(
    "reservationUnits",
    connection=True,
    fields="applicationRoundTimeSlots {weekday closed reservableTimes{begin end}}",
)

reservation_units_query = partial(build_query, "reservationUnits", connection=True)

reservation_unit_by_pk_query = partial(build_query, "reservationUnitByPk")

CREATE_MUTATION = build_mutation(
    "createReservationUnit",
    "ReservationUnitCreateMutationInput",
)

UPDATE_MUTATION = build_mutation(
    "updateReservationUnit",
    "ReservationUnitUpdateMutationInput",
)


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
        "nameFi": "Name FI",
        "nameEn": "Name EN",
        "nameSv": "Name SV",
        "descriptionFi": "desc FI",
        "descriptionEn": "desc EN",
        "descriptionSv": "desc SV",
        "contactInformation": "contact info",
        "spacePks": [space.id],
        "resourcePks": [resource.id],
        "servicePks": [service.id],
        "unitPk": unit.id,
        "reservationUnitTypePk": reservation_unit_type.id,
        "surfaceArea": 100,
        "minPersons": 1,
        "maxPersons": 10,
        "bufferTimeBefore": 3600,
        "bufferTimeAfter": 3600,
        "cancellationRulePk": rule.pk,
        "reservationStartInterval": ReservationStartInterval.INTERVAL_60_MINUTES.value.upper(),
        "publishBegins": "2021-05-03T00:00:00+00:00",
        "publishEnds": "2021-05-03T00:00:00+00:00",
        "reservationBegins": "2021-05-03T00:00:00+00:00",
        "reservationEnds": "2021-05-03T00:00:00+00:00",
        "metadataSetPk": metadata_set.pk,
        "maxReservationsPerUser": 2,
        "requireReservationHandling": True,
        "authentication": "STRONG",
        "canApplyFreeOfCharge": True,
        "reservationsMinDaysBefore": 1,
        "reservationsMaxDaysBefore": 360,
        "reservationKind": ReservationKind.DIRECT,
        "pricings": [
            {
                "begins": datetime.date.today().strftime("%Y-%m-%d"),
                "pricingType": PricingType.PAID,
                "priceUnit": PriceUnit.PRICE_UNIT_PER_15_MINS,
                "lowestPrice": 10.5,
                "highestPrice": 18.8,
                "taxPercentagePk": tax_percentage.id,
                "status": PricingStatus.PRICING_STATUS_ACTIVE,
            }
        ],
    }
