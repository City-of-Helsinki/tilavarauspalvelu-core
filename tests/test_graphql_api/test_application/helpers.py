import datetime
from functools import partial
from typing import Any

from graphene_django_extensions.testing import build_mutation, build_query

from tests.factories import AgeGroupFactory, CityFactory, ReservationPurposeFactory, ReservationUnitFactory
from tilavarauspalvelu.enums import ApplicantTypeChoice, Priority, Weekday
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
    home_city = CityFactory.create()

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
                "reservationsBeginDate": application_round.reservation_period_begin.isoformat(),
                "reservationsEndDate": application_round.reservation_period_end.isoformat(),
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
        "applicantType": ApplicantTypeChoice.COMPANY.value,
        "organisation": {
            "identifier": "123-identifier",
            "name": "Super organisation",
            "address": {
                "streetAddress": "Testikatu 28",
                "postCode": "33540",
                "city": "Tampere",
            },
        },
        "contactPerson": {
            "firstName": "John",
            "lastName": "Wayne",
            "email": "john@test.com",
            "phoneNumber": "123-123",
        },
        "applicationRound": application_round.pk,
        "applicationSections": sections,
        "billingAddress": {
            "streetAddress": "Laskukatu 1c",
            "postCode": "33540",
            "city": "Tampere",
        },
        "homeCity": home_city.id,
    }


def get_application_update_data(application: Application) -> dict[str, Any]:
    return {
        "pk": application.id,
        "additionalInformation": "This is updated",
    }
