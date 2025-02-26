from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingResponse,
)
from utils.date_utils import local_date, local_datetime

from tests.factories import (
    ApplicationSectionFactory,
    RecurringReservationFactory,
    ReservationFactory,
    SuitableTimeRangeFactory,
)
from tests.helpers import patch_method

from .helpers import section_query, sections_query

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__query(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_superuser()

    fields = """
        pk
        extUuid
        name
        numPersons
        reservationsBeginDate
        reservationsEndDate
        reservationMinDuration
        reservationMaxDuration
        appliedReservationsPerWeek
        status
        shouldHaveActiveAccessCode
    """
    query = sections_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1, response
    assert response.node(0) == {
        "pk": section.pk,
        "extUuid": str(section.ext_uuid),
        "name": section.name,
        "numPersons": section.num_persons,
        "reservationsBeginDate": section.reservations_begin_date.isoformat(),
        "reservationsEndDate": section.reservations_end_date.isoformat(),
        "reservationMinDuration": int(section.reservation_min_duration.total_seconds()),
        "reservationMaxDuration": int(section.reservation_max_duration.total_seconds()),
        "appliedReservationsPerWeek": section.applied_reservations_per_week,
        "status": section.status.value,
        "shouldHaveActiveAccessCode": False,
    }


def test_application_section__query__relations(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated()
    option = section.reservation_unit_options.first()
    suitable_time_range = SuitableTimeRangeFactory.create(application_section=section)
    ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_superuser()

    fields = """
        pk
        ageGroup {
            minimum
            maximum
        }
        purpose {
            nameFi
        }
        application {
            additionalInformation
        }
        reservationUnitOptions {
            pk
        }
        suitableTimeRanges {
            priority
            dayOfTheWeek
            beginTime
            endTime
            fulfilled
        }
    """
    query = sections_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "pk": section.pk,
        "ageGroup": {
            "minimum": section.age_group.minimum,
            "maximum": section.age_group.maximum,
        },
        "purpose": {
            "nameFi": section.purpose.name_fi,
        },
        "application": {
            "additionalInformation": section.application.additional_information,
        },
        "reservationUnitOptions": [
            {
                "pk": option.pk,
            },
        ],
        "suitableTimeRanges": [
            {
                "priority": suitable_time_range.priority,
                "dayOfTheWeek": suitable_time_range.day_of_the_week,
                "beginTime": suitable_time_range.begin_time.isoformat(),
                "endTime": suitable_time_range.end_time.isoformat(),
                "fulfilled": suitable_time_range.fulfilled,
            },
        ],
    }


def test_application_section__all_statuses(graphql):
    ApplicationSectionFactory.create_in_status_handled()
    ApplicationSectionFactory.create_in_status_in_allocation()
    ApplicationSectionFactory.create_in_status_unallocated()
    ApplicationSectionFactory.create_in_status_handled()
    ApplicationSectionFactory.create_in_status_in_allocation()
    ApplicationSectionFactory.create_in_status_unallocated()

    query = """
        query {
          applicationSections {
            edges {
              node {
                pk
                status
                application {
                  pk
                  status
                  applicationRound {
                    pk
                    status
                  }
                }
              }
            }
          }
        }
    """

    graphql.login_with_superuser()
    response = graphql(query)

    assert response.has_errors is False, response
    # (1 query for session, doesn't always happen for some reason)
    # 1 query for the user
    # 1 query to count application sections
    # 1 query to fetch application sections with their status annotations
    # 1 query to fetch applications with their status annotations
    # 1 query to fetch units for permission checks for applications
    # 1 query to fetch unit groups for permission checks for applications
    # 1 query to fetch application rounds with their status annotations
    # 1 query to fetch units for permission checks for application rounds
    assert len(response.queries) in {8, 9}, response.query_log


def pindora_response(section: ApplicationSection) -> PindoraSeasonalBookingResponse:
    return PindoraSeasonalBookingResponse(
        access_code="1234",
        access_code_generated_at=local_datetime(2022, 1, 1, 12),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.url",
        access_code_phone_number="123456789",
        access_code_sms_number="123456789",
        access_code_sms_message="123456789",
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=section.reservation_unit_options.first().reservation_unit.uuid,
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
            )
        ],
    )


def pindora_query(section: ApplicationSection) -> str:
    fields = """
        pindoraInfo {
            accessCode
            accessCodeGeneratedAt
            accessCodeIsActive
            accessCodeKeypadUrl
            accessCodePhoneNumber
            accessCodeSmsNumber
            accessCodeSmsMessage
            accessCodeValidity {
                reservationId
                reservationSeriesId
                accessCodeBeginsAt
                accessCodeEndsAt
            }
        }
    """
    global_id = to_global_id("ApplicationSectionNode", section.pk)
    return section_query(fields=fields, id=global_id)


@freeze_time(local_datetime(2022, 1, 1))
def test_application_section__query__pindora_info(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservations_begin_date=local_date(2022, 1, 1),
        reservations_end_date=local_date(2022, 1, 1),
    )
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    query = pindora_query(section)

    graphql.login_with_superuser()

    with patch_method(PindoraClient.get_seasonal_booking, return_value=pindora_response(section)):
        response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.first_query_object["pindoraInfo"] == {
        "accessCode": "1234",
        "accessCodeGeneratedAt": "2022-01-01T12:00:00+02:00",
        "accessCodeIsActive": True,
        "accessCodeKeypadUrl": "https://keypad.url",
        "accessCodePhoneNumber": "123456789",
        "accessCodeSmsMessage": "123456789",
        "accessCodeSmsNumber": "123456789",
        "accessCodeValidity": [
            {
                "reservationId": reservation.pk,
                "reservationSeriesId": series.pk,
                "accessCodeBeginsAt": "2022-01-01T11:50:00+02:00",
                "accessCodeEndsAt": "2022-01-01T13:05:00+02:00",
            }
        ],
    }


@freeze_time(local_datetime(2022, 1, 1))
@pytest.mark.parametrize("as_reservee", [True, False])
def test_application_section__query__pindora_info__access_code_not_active(graphql, as_reservee):
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservations_begin_date=local_date(2022, 1, 1),
        reservations_end_date=local_date(2022, 1, 1),
    )

    ReservationFactory.create(
        recurring_reservation__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    query = pindora_query(section)

    if as_reservee:
        graphql.force_login(section.application.user)
    else:
        graphql.login_with_superuser()

    response = pindora_response(section)
    response["access_code_is_active"] = False

    with patch_method(PindoraClient.get_seasonal_booking, return_value=response):
        response = graphql(query)

    assert response.has_errors is False, response.errors

    if as_reservee:
        assert response.first_query_object["pindoraInfo"] is None
    else:
        assert response.first_query_object["pindoraInfo"] is not None


@freeze_time(local_datetime(2022, 1, 1))
def test_application_section__query__pindora_info__access_type_not_access_code(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservations_begin_date=local_date(2022, 1, 1),
        reservations_end_date=local_date(2022, 1, 1),
    )

    ReservationFactory.create(
        recurring_reservation__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.PHYSICAL_KEY,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    query = pindora_query(section)

    graphql.login_with_superuser()

    with patch_method(PindoraClient.get_seasonal_booking, return_value=pindora_response(section)):
        response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.first_query_object["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 1))
def test_application_section__query__pindora_info__pindora_call_fails(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservations_begin_date=local_date(2022, 1, 1),
        reservations_end_date=local_date(2022, 1, 1),
    )

    ReservationFactory.create(
        recurring_reservation__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    query = pindora_query(section)

    graphql.login_with_superuser()

    with patch_method(PindoraClient.get_seasonal_booking, side_effect=PindoraAPIError("Error")):
        response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.first_query_object["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 3))
def test_application_section__query__pindora_info__section_past(graphql):
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservations_begin_date=local_date(2022, 1, 1),
        reservations_end_date=local_date(2022, 1, 1),
    )

    ReservationFactory.create(
        recurring_reservation__allocated_time_slot__reservation_unit_option__application_section=section,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    query = pindora_query(section)

    graphql.login_with_superuser()

    with patch_method(PindoraClient.get_seasonal_booking, return_value=pindora_response(section)):
        response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.first_query_object["pindoraInfo"] is None
