from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time
from undine.relay import to_global_id

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
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
    ReservationFactory,
    ReservationSeriesFactory,
    ReservationUnitFactory,
)
from tests.helpers import patch_method

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationSeries

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def pindora_response(series: ReservationSeries) -> PindoraReservationSeriesResponse:
    return PindoraReservationSeriesResponse(
        reservation_unit_id=series.reservation_unit.ext_uuid,
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


PINDORA_QUERY = """
    query ($id: ID!) {
        node(id: $id) {
            ... on ReservationSeriesNode {
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
            }
        }
    }
"""


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation_series__query__pindora_info(graphql):
    series = ReservationSeriesFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    reservation = ReservationFactory.create(
        begins_at=local_datetime(2022, 1, 1, 12),
        ends_at=local_datetime(2022, 1, 1, 13),
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()

    global_id = to_global_id("ReservationSeriesNode", series.pk)

    with patch_method(PindoraClient.get_reservation_series, return_value=pindora_response(series)):
        response = graphql(PINDORA_QUERY, variables={"id": global_id})

    assert response.has_errors is False, response

    assert response.results["pindoraInfo"] == {
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
def test_reservation_series__query__pindora_info__access_code_not_active(graphql, as_reservee):
    series = ReservationSeriesFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    if as_reservee:
        graphql.force_login(series.user)
    else:
        graphql.login_with_superuser()

    global_id = to_global_id("ReservationSeriesNode", series.pk)

    response = pindora_response(series)
    response["access_code_is_active"] = False

    with patch_method(PindoraClient.get_reservation_series, return_value=response):
        response = graphql(PINDORA_QUERY, variables={"id": global_id})

    assert response.has_errors is False, response

    if as_reservee:
        assert response.results["pindoraInfo"] is None
    else:
        assert response.results["pindoraInfo"] is not None


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation_series__query__pindora_info__access_type_not_access_code(graphql):
    series = ReservationSeriesFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.PHYSICAL_KEY,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()

    global_id = to_global_id("ReservationSeriesNode", series.pk)

    with patch_method(PindoraClient.get_reservation_series, return_value=pindora_response(series)):
        response = graphql(PINDORA_QUERY, variables={"id": global_id})

    assert response.has_errors is False, response

    assert response.results["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation_series__query__pindora_info__pindora_call_fails(graphql):
    series = ReservationSeriesFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()

    global_id = to_global_id("ReservationSeriesNode", series.pk)

    with patch_method(PindoraClient.get_reservation_series, side_effect=PindoraAPIError("Error")):
        response = graphql(PINDORA_QUERY, variables={"id": global_id})

    assert response.has_errors is False, response

    assert response.results["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 3))
def test_reservation_series__query__pindora_info__reservation_past(graphql):
    series = ReservationSeriesFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
    )
    ReservationFactory.create(
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()

    global_id = to_global_id("ReservationSeriesNode", series.pk)

    with patch_method(PindoraClient.get_reservation_series, return_value=pindora_response(series)):
        response = graphql(PINDORA_QUERY, variables={"id": global_id})

    assert response.has_errors is False, response

    assert response.results["pindoraInfo"] is None


@freeze_time(local_datetime(2022, 1, 1))
def test_reservation_series__query__pindora_info__in_application_section(graphql):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    section = ApplicationSectionFactory.create(application__application_round=application_round)
    reservation_unit = ReservationUnitFactory.create()
    series = ReservationSeriesFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
        allocated_time_slot__reservation_unit_option__application_section=section,
        reservation_unit=reservation_unit,
    )
    reservation = ReservationFactory.create(
        begins_at=local_datetime(2022, 1, 1, 12),
        ends_at=local_datetime(2022, 1, 1, 13),
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.force_login(series.user)

    global_id = to_global_id("ReservationSeriesNode", series.pk)

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
                reservation_unit_id=reservation_unit.ext_uuid,
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
            ),
        ],
    )

    with patch_method(PindoraClient.get_seasonal_booking, return_value=response):
        response = graphql(PINDORA_QUERY, variables={"id": global_id})

    assert response.has_errors is False, response.errors

    assert response.results["pindoraInfo"] == {
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
def test_reservation_series__query__pindora_info__in_application_section__not_sent(graphql):
    section = ApplicationSectionFactory.create(
        application__application_round__sent_at=None,
    )
    reservation_unit = ReservationUnitFactory.create()
    series = ReservationSeriesFactory.create(
        begin=local_datetime(2022, 1, 1, 10),
        end=local_datetime(2022, 1, 1, 12),
        allocated_time_slot__reservation_unit_option__application_section=section,
        reservation_unit=reservation_unit,
    )
    ReservationFactory.create(
        begins_at=local_datetime(2022, 1, 1, 12),
        ends_at=local_datetime(2022, 1, 1, 13),
        reservation_series=series,
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.force_login(series.user)

    global_id = to_global_id("ReservationSeriesNode", series.pk)

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
                reservation_unit_id=reservation_unit.ext_uuid,
                access_code_valid_minutes_before=10,
                access_code_valid_minutes_after=5,
                begin=local_datetime(2022, 1, 1, 12),
                end=local_datetime(2022, 1, 1, 13),
            ),
        ],
    )

    with patch_method(PindoraClient.get_seasonal_booking, return_value=response):
        response = graphql(PINDORA_QUERY, variables={"id": global_id})

    assert response.has_errors is False, response.errors

    assert response.results["pindoraInfo"] is None
