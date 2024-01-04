import datetime
from functools import partial
from typing import Any

from applications.choices import ApplicantTypeChoice, WeekdayChoice
from applications.models import Application, ApplicationRound
from common.date_utils import timedelta_to_json
from tests.factories import (
    AbilityGroupFactory,
    AgeGroupFactory,
    CityFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
)
from tests.gql_builders import build_mutation, build_query

applications_query = partial(build_query, "applications", connection=True, order_by="pk")

CREATE_MUTATION = build_mutation(
    "createApplication",
    "ApplicationCreateMutationInput",
)

UPDATE_MUTATION = build_mutation(
    "updateApplication",
    "ApplicationUpdateMutationInput",
)

DECLINE_MUTATION = build_mutation(
    "declineApplication",
    "ApplicationDeclineMutationInput",
)

SEND_MUTATION = build_mutation(
    "sendApplication",
    "ApplicationSendMutationInput",
)

CANCEL_MUTATION = build_mutation(
    "cancelApplication",
    "ApplicationCancelMutationInput",
)


def get_application_create_data(application_round: ApplicationRound, create_events: bool = False) -> dict[str, Any]:
    events: list[dict[str, Any]] = []
    home_city = CityFactory.create()

    if create_events:
        reservation_purpose = ReservationPurposeFactory.create()
        ability_group = AbilityGroupFactory.create()
        age_group = AgeGroupFactory.create()
        reservation_unit = ReservationUnitFactory.create(
            unit__service_sectors=[application_round.service_sector],
            application_rounds=[application_round],
        )

        events = [
            {
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
                "minDuration": timedelta_to_json(datetime.timedelta(hours=1)),
                "maxDuration": timedelta_to_json(datetime.timedelta(hours=2)),
                "eventsPerWeek": 2,
                "biweekly": False,
                "begin": datetime.date(2022, 8, 1).isoformat(),
                "end": datetime.date(2023, 2, 28).isoformat(),
                "purpose": reservation_purpose.id,
                "eventReservationUnits": [
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
        "applicationEvents": events,
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
