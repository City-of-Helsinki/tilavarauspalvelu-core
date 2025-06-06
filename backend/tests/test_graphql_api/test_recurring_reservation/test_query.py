from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import (
    AccessType,
    RejectionReadinessChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraReservationSeriesAccessCodeValidity,
    PindoraReservationSeriesResponse,
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingResponse,
)
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    RecurringReservationFactory,
    ReservationFactory,
    ReservationUnitFactory,
)
from tests.helpers import patch_method

from .helpers import recurring_reservation_query, recurring_reservations_query

if TYPE_CHECKING:
    from tilavarauspalvelu.models import RecurringReservation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__query(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    graphql.login_with_superuser()

    fields = """
        pk
        extUuid
        name
        description
        beginDate
        endDate
        beginTime
        endTime
        recurrenceInDays
        weekdays
        created
        shouldHaveActiveAccessCode
        accessType
    """
    query = recurring_reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": recurring_reservation.pk,
        "extUuid": str(recurring_reservation.ext_uuid),
        "name": recurring_reservation.name,
        "description": recurring_reservation.description,
        "beginDate": recurring_reservation.begin_date.isoformat(),
        "endDate": recurring_reservation.end_date.isoformat(),
        "beginTime": recurring_reservation.begin_time.isoformat(),
        "endTime": recurring_reservation.end_time.isoformat(),
        "recurrenceInDays": recurring_reservation.recurrence_in_days,
        "weekdays": [0],
        "created": recurring_reservation.created.isoformat(),
        "shouldHaveActiveAccessCode": False,
        "accessType": AccessType.UNRESTRICTED.value,
    }


def test_recurring_reservations__query__relations(graphql):
    recurring_reservation = RecurringReservationFactory.create(
        reservations__name="foo",
        age_group__minimum=18,
        age_group__maximum=30,
        ability_group__name="foo",
        rejected_occurrences__rejection_reason=RejectionReadinessChoice.INTERVAL_NOT_ALLOWED,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )
    graphql.login_with_superuser()

    fields = """
        pk
        user {
            email
        }
        ageGroup {
            minimum
            maximum
        }
        abilityGroup {
            nameFi
        }
        reservationUnit {
            nameFi
        }
        reservations {
            pk
            name
        }
        rejectedOccurrences {
            pk
            beginDatetime
            endDatetime
            rejectionReason
            createdAt
        }
        allocatedTimeSlot {
            pk
            beginTime
            endTime
        }
    """
    query = recurring_reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    reservation = recurring_reservation.reservations.first()
    occurrence = recurring_reservation.rejected_occurrences.first()

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": recurring_reservation.pk,
        "user": {
            "email": recurring_reservation.user.email,
        },
        "ageGroup": {
            "minimum": recurring_reservation.age_group.minimum,
            "maximum": recurring_reservation.age_group.maximum,
        },
        "abilityGroup": {
            "nameFi": recurring_reservation.ability_group.name_fi,
        },
        "reservationUnit": {
            "nameFi": recurring_reservation.reservation_unit.name_fi,
        },
        "reservations": [
            {
                "pk": reservation.pk,
                "name": reservation.name,
            }
        ],
        "rejectedOccurrences": [
            {
                "pk": occurrence.pk,
                "beginDatetime": occurrence.begin_datetime.isoformat(),
                "endDatetime": occurrence.end_datetime.isoformat(),
                "rejectionReason": occurrence.rejection_reason,
                "createdAt": occurrence.created_at.isoformat(),
            }
        ],
        "allocatedTimeSlot": {
            "pk": recurring_reservation.allocated_time_slot.pk,
            "beginTime": recurring_reservation.allocated_time_slot.begin_time.isoformat(),
            "endTime": recurring_reservation.allocated_time_slot.end_time.isoformat(),
        },
    }


def pindora_response(series: RecurringReservation) -> PindoraReservationSeriesResponse:
    return PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.uuid,
        access_code="1234",
        access_code_generated_at=local_datetime(2022, 1, 1, 12),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.url",
        access_code_phone_number="123456789",
        access_code_sms_number="123456789",
        access_code_sms_message="123456789",
        reservation_unit_code_validity=[
            PindoraReservationSeriesAccessCodeValidity(
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
            )
        ],
    )


def pindora_query(series: RecurringReservation) -> str:
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
    global_id = to_global_id("RecurringReservationNode", series.pk)
    return recurring_reservation_query(fields=fields, id=global_id)


@freeze_time(local_datetime(2022, 1, 1))
def test_recurring_reservations__query__pindora_info(graphql):
    series = RecurringReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    reservation = ReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()

    query = pindora_query(series)

    with patch_method(PindoraClient.get_reservation_series, return_value=pindora_response(series)):
        response = graphql(query)

    assert response.has_errors is False, response

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
def test_recurring_reservations__query__pindora_info__access_code_not_active(graphql, as_reservee):
    series = RecurringReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    if as_reservee:
        graphql.force_login(series.user)
    else:
        graphql.login_with_superuser()

    query = pindora_query(series)

    response = pindora_response(series)
    response["access_code_is_active"] = False

    with patch_method(PindoraClient.get_reservation_series, return_value=response):
        response = graphql(query)

    assert response.has_errors is False, response

    if as_reservee:
        assert response.first_query_object["pindoraInfo"] is None
    else:
        assert response.first_query_object["pindoraInfo"] is not None


@freeze_time(local_datetime(2022, 1, 1))
def test_recurring_reservations__query__pindora_info__access_type_not_access_code(graphql):
    series = RecurringReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.PHYSICAL_KEY,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()

    query = pindora_query(series)

    with patch_method(PindoraClient.get_reservation_series, return_value=pindora_response(series)):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 1))
def test_recurring_reservations__query__pindora_info__pindora_call_fails(graphql):
    series = RecurringReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()

    query = pindora_query(series)

    with patch_method(PindoraClient.get_reservation_series, side_effect=PindoraAPIError("Error")):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 3))
def test_recurring_reservations__query__pindora_info__reservation_past(graphql):
    series = RecurringReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    ReservationFactory.create(
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()

    query = pindora_query(series)

    with patch_method(PindoraClient.get_reservation_series, return_value=pindora_response(series)):
        response = graphql(query)

    assert response.has_errors is False, response

    assert response.first_query_object["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 1))
def test_recurring_reservations__query__pindora_info__in_application_section(graphql):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    section = ApplicationSectionFactory.create(application__application_round=application_round)
    reservation_unit = ReservationUnitFactory.create()
    series = RecurringReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
        allocated_time_slot__reservation_unit_option__application_section=section,
        reservation_unit=reservation_unit,
    )
    reservation = ReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.force_login(series.user)

    query = pindora_query(series)

    response = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation_unit.uuid,
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
            ),
        ],
    )

    with patch_method(PindoraClient.get_seasonal_booking, return_value=response):
        response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.first_query_object["pindoraInfo"] == {
        "accessCode": "12345",
        "accessCodeGeneratedAt": "2022-01-01T00:00:00+02:00",
        "accessCodeIsActive": True,
        "accessCodeKeypadUrl": "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        "accessCodePhoneNumber": "+358407089833",
        "accessCodeSmsMessage": "a12345",
        "accessCodeSmsNumber": "+358407089834",
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
def test_recurring_reservations__query__pindora_info__in_application_section__not_sent(graphql):
    section = ApplicationSectionFactory.create(
        application__application_round__sent_date=None,
    )
    reservation_unit = ReservationUnitFactory.create()
    series = RecurringReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
        allocated_time_slot__reservation_unit_option__application_section=section,
        reservation_unit=reservation_unit,
    )
    ReservationFactory.create(
        begin=local_datetime(2022, 1, 1, 12),
        end=local_datetime(2022, 1, 1, 13),
        recurring_reservation=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.force_login(series.user)

    query = pindora_query(series)

    response = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a12345",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation_unit.uuid,
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
            ),
        ],
    )

    with patch_method(PindoraClient.get_seasonal_booking, return_value=response):
        response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.first_query_object["pindoraInfo"] is None
