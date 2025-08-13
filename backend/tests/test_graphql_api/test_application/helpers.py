from __future__ import annotations

import datetime
from functools import partial
from typing import TYPE_CHECKING, Any

from tilavarauspalvelu.enums import MunicipalityChoice, Priority, ReserveeType, Weekday

from tests.factories import AgeGroupFactory, ReservationPurposeFactory, ReservationUnitFactory
from tests.query_builder import build_mutation, build_query

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application, ApplicationRound

applications_query = partial(build_query, "applications", connection=True, order_by="pkAsc")

CREATE_MUTATION = build_mutation(
    "createApplication",
    "ApplicationCreateMutation",
)

UPDATE_MUTATION = build_mutation(
    "updateApplication",
    "ApplicationUpdateMutation",
)
WORKING_MEMO_MUTATION = build_mutation(
    "updateApplicationWorkingMemo",
    "ApplicationWorkingMemoMutation",
)

DECLINE_MUTATION = build_mutation(
    "declineApplication",
    "ApplicationDeclineMutation",
)

SEND_MUTATION = build_mutation(
    "sendApplication",
    "ApplicationSendMutation",
)

CANCEL_MUTATION = build_mutation(
    "cancelApplication",
    "ApplicationCancelMutation",
)
REJECT_MUTATION = build_mutation(
    "rejectAllApplicationOptions",
    "RejectAllApplicationOptionsMutation",
)
RESTORE_MUTATION = build_mutation(
    "restoreAllApplicationOptions",
    "RestoreAllApplicationOptionsMutation",
)


def get_application_create_data(
    application_round: ApplicationRound,
    *,
    create_sections: bool = False,
) -> dict[str, Any]:
    sections: list[dict[str, Any]] = []

    if create_sections:
        reservation_purpose = ReservationPurposeFactory.create()
        age_group = AgeGroupFactory.create()
        reservation_unit = ReservationUnitFactory.create(
            application_rounds=[application_round],
        )

        sections = [
            {
                "name": "Section name",
                "numPersons": 10,
                "reservationMinDuration": int(datetime.timedelta(hours=1).total_seconds()),
                "reservationMaxDuration": int(datetime.timedelta(hours=2).total_seconds()),
                "appliedReservationsPerWeek": 2,
                "reservationsBeginDate": application_round.reservation_period_begin_date.isoformat(),
                "reservationsEndDate": application_round.reservation_period_end_date.isoformat(),
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
        ]

    return {
        "applicantType": ReserveeType.COMPANY.value,
        "organisationIdentifier": "123-identifier",
        "organisationName": "Super organisation",
        "organisationStreetAddress": "Testikatu 28",
        "organisationPostCode": "33540",
        "organisationCity": "Tampere",
        "contactPersonFirstName": "John",
        "contactPersonLastName": "Wayne",
        "contactPersonEmail": "john@test.com",
        "contactPersonPhoneNumber": "123-123",
        "applicationRound": application_round.pk,
        "applicationSections": sections,
        "billingStreetAddress": "Laskukatu 1c",
        "billingPostCode": "33540",
        "billingCity": "Tampere",
        "municipality": MunicipalityChoice.HELSINKI.value,
    }


def get_application_update_data(application: Application) -> dict[str, Any]:
    return {
        "pk": application.id,
        "additionalInformation": "This is updated",
    }
