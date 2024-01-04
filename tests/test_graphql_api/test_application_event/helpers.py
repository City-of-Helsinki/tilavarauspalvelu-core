from datetime import date, timedelta
from functools import partial
from typing import Any

from applications.choices import WeekdayChoice
from applications.models import Application, ApplicationEvent
from common.date_utils import timedelta_to_json
from tests.factories import AbilityGroupFactory, AgeGroupFactory, ReservationPurposeFactory, ReservationUnitFactory
from tests.gql_builders import build_mutation, build_query

events_query = partial(build_query, "applicationEvents", connection=True, order_by="pk")
events_query_no_ordering = partial(build_query, "applicationEvents", connection=True)

CREATE_MUTATION = build_mutation(
    "createApplicationEvent",
    "ApplicationEventCreateMutationInput",
)
UPDATE_MUTATION = build_mutation(
    "updateApplicationEvent",
    "ApplicationEventUpdateMutationInput",
)
DELETE_MUTATION = build_mutation(
    "deleteApplicationEvent",
    "ApplicationEventDeleteMutationInput",
    selections="deleted errors { messages field }",
)
DECLINE_MUTATION = build_mutation(
    "declineApplicationEvent",
    "ApplicationEventDeclineMutationInput",
)


def get_application_event_create_data(application: Application) -> dict[str, Any]:
    # Create required entities
    reservation_purpose = ReservationPurposeFactory.create()
    ability_group = AbilityGroupFactory.create()
    age_group = AgeGroupFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        unit__service_sectors=[application.application_round.service_sector],
        application_rounds=[application.application_round],
    )

    return {
        "name": "App event name",
        "applicationEventSchedules": [
            {
                "day": WeekdayChoice.MONDAY.value,
                "begin": "10:00",
                "end": "16:30",
            },
        ],
        "numPersons": 10,
        "ageGroup": age_group.id,
        "abilityGroup": ability_group.id,
        "minDuration": timedelta_to_json(timedelta(hours=1)),
        "maxDuration": timedelta_to_json(timedelta(hours=2)),
        "application": application.id,
        "eventsPerWeek": 2,
        "biweekly": False,
        "begin": date(2022, 8, 1).isoformat(),
        "end": date(2023, 2, 28).isoformat(),
        "purpose": reservation_purpose.id,
        "eventReservationUnits": [
            {
                "preferredOrder": 0,
                "reservationUnit": reservation_unit.id,
            },
        ],
    }


def get_application_event_update_data(application_event: ApplicationEvent) -> dict[str, Any]:
    # Create required entities
    reservation_unit = ReservationUnitFactory.create(
        unit__service_sectors=[application_event.application.application_round.service_sector],
        application_rounds=[application_event.application.application_round],
    )

    return {
        "pk": application_event.id,
        "name": "App event name",
        "applicationEventSchedules": [
            {
                "day": WeekdayChoice.MONDAY.value,
                "begin": "10:00",
                "end": "16:30",
            },
        ],
        "numPersons": 10,
        "ageGroup": application_event.age_group.id,
        "abilityGroup": application_event.ability_group.id,
        "minDuration": timedelta_to_json(timedelta(hours=1)),
        "maxDuration": timedelta_to_json(timedelta(hours=2)),
        "application": application_event.application.id,
        "eventsPerWeek": 2,
        "biweekly": False,
        "begin": date(2022, 8, 1).isoformat(),
        "end": date(2023, 2, 28).isoformat(),
        "purpose": application_event.purpose.id,
        "eventReservationUnits": [
            {
                "preferredOrder": 0,
                "reservationUnit": reservation_unit.id,
            },
        ],
    }


def get_application_event_delete_data(application_event: ApplicationEvent) -> dict[str, Any]:
    return {"pk": application_event.pk}


def get_application_event_decline_data(application_event: ApplicationEvent) -> dict[str, Any]:
    return {"pk": application_event.pk}
