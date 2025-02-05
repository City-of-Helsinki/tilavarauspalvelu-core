from __future__ import annotations

import datetime
from functools import partial
from typing import TYPE_CHECKING, Any

from graphene_django_extensions.testing import build_mutation, build_query

from tilavarauspalvelu.enums import Priority, Weekday

from tests.factories import AgeGroupFactory, ReservationPurposeFactory, ReservationUnitFactory

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application, ApplicationSection

sections_query = partial(build_query, "applicationSections", connection=True, order_by="pkAsc")

CREATE_MUTATION = build_mutation(
    "createApplicationSection",
    "ApplicationSectionCreateMutation",
)
UPDATE_MUTATION = build_mutation(
    "updateApplicationSection",
    "ApplicationSectionUpdateMutation",
)
DELETE_MUTATION = build_mutation(
    "deleteApplicationSection",
    "ApplicationSectionDeleteMutation",
    fields="deleted",
)
REJECT_MUTATION = build_mutation(
    "rejectAllSectionOptions",
    "RejectAllSectionOptionsMutation",
)
RESTORE_MUTATION = build_mutation(
    "restoreAllSectionOptions",
    "RestoreAllSectionOptionsMutation",
)


def get_application_section_create_data(application: Application) -> dict[str, Any]:
    # Create required entities
    reservation_purpose = ReservationPurposeFactory.create()
    age_group = AgeGroupFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        application_rounds=[application.application_round],
    )

    return {
        "application": application.id,
        "name": "Section name",
        "numPersons": 10,
        "reservationMinDuration": int(datetime.timedelta(hours=1).total_seconds()),
        "reservationMaxDuration": int(datetime.timedelta(hours=2).total_seconds()),
        "appliedReservationsPerWeek": 2,
        "reservationsBeginDate": application.application_round.reservation_period_begin.isoformat(),
        "reservationsEndDate": application.application_round.reservation_period_end.isoformat(),
        "purpose": reservation_purpose.id,
        "ageGroup": age_group.id,
        "suitableTimeRanges": [
            {
                "priority": Priority.PRIMARY.value,
                "dayOfTheWeek": Weekday.MONDAY.value,
                "beginTime": datetime.time(10, 0).isoformat(),
                "endTime": datetime.time(16, 0).isoformat(),
            },
        ],
        "reservationUnitOptions": [
            {
                "preferredOrder": 0,
                "reservationUnit": reservation_unit.id,
            },
        ],
    }


def get_application_section_update_data(application_section: ApplicationSection) -> dict[str, Any]:
    # Create required entities
    reservation_unit = ReservationUnitFactory.create(
        application_rounds=[application_section.application.application_round],
    )

    return {
        "pk": application_section.id,
        "application": application_section.application.id,
        "name": "Section name",
        "numPersons": 10,
        "reservationMinDuration": int(datetime.timedelta(hours=1).total_seconds()),
        "reservationMaxDuration": int(datetime.timedelta(hours=2).total_seconds()),
        "appliedReservationsPerWeek": 2,
        "reservationsBeginDate": application_section.application.application_round.reservation_period_begin.isoformat(),
        "reservationsEndDate": application_section.application.application_round.reservation_period_end.isoformat(),
        "purpose": application_section.purpose.pk,
        "ageGroup": application_section.age_group.pk,
        "suitableTimeRanges": [
            {
                "priority": Priority.PRIMARY.value,
                "dayOfTheWeek": Weekday.MONDAY.value,
                "beginTime": datetime.time(10, 0).isoformat(),
                "endTime": datetime.time(16, 0).isoformat(),
            },
        ],
        "reservationUnitOptions": [
            {
                "preferredOrder": 0,
                "reservationUnit": reservation_unit.id,
            },
        ],
    }


def get_application_section_delete_data(application_section: ApplicationSection) -> dict[str, Any]:
    return {"pk": application_section.pk}
