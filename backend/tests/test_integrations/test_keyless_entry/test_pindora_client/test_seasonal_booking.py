from __future__ import annotations

import pytest
import requests
from graphene_django_extensions.testing import parametrize_helper
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_418_IM_A_TEAPOT,
    HTTP_500_INTERNAL_SERVER_ERROR,
)

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import (
    PindoraBadRequestError,
    PindoraClientError,
    PindoraConflictError,
    PindoraNotFoundError,
    PindoraPermissionError,
    PindoraUnexpectedResponseError,
)
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceRequestError

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationSectionFactory,
    RecurringReservationFactory,
    ReservationFactory,
    ReservationUnitOptionFactory,
)
from tests.helpers import ResponseMock, exact, patch_method, use_retries

from .helpers import ErrorParams, default_seasonal_booking_response


def test_pindora_client__get_seasonal_booking():
    application_section = ApplicationSectionFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_seasonal_booking_response(reservation)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.get_seasonal_booking(application_section)

    assert response["access_code"] == "13245#"
    assert response["access_code_keypad_url"] == "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto"
    assert response["access_code_phone_number"] == "+358407089833"
    assert response["access_code_sms_number"] == "+358407089834"
    assert response["access_code_sms_message"] == "a13245"
    assert response["access_code_generated_at"] == reservation.created_at.astimezone(DEFAULT_TIMEZONE)
    assert response["access_code_is_active"] is True

    assert response["reservation_unit_code_validity"] == [
        {
            "reservation_unit_id": reservation.ext_uuid,
            "access_code_valid_minutes_before": 0,
            "access_code_valid_minutes_after": 0,
            "begin": reservation.begin.astimezone(DEFAULT_TIMEZONE),
            "end": reservation.end.astimezone(DEFAULT_TIMEZONE),
        }
    ]


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__get_seasonal_booking__errors(status_code, exception, error_msg):
    application_section = ApplicationSectionFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.get_seasonal_booking(application_section)


@use_retries(attempts=3)
def test_pindora_client__get_seasonal_booking__fails_all_retries():
    application_section = ApplicationSectionFactory.build()

    patch = patch_method(PindoraClient.request, side_effect=requests.ConnectionError("timeout"))

    with patch as magic_mock, pytest.raises(requests.ConnectionError):
        PindoraClient.get_seasonal_booking(application_section)

    assert magic_mock.call_count == 3


@use_retries(attempts=3)
def test_pindora_client__get_seasonal_booking__retry_on_500():
    application_section = ApplicationSectionFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR))

    with patch as magic_mock, pytest.raises(ExternalServiceRequestError):
        PindoraClient.get_seasonal_booking(application_section)

    assert magic_mock.call_count == 3


@use_retries(attempts=3)
def test_pindora_client__get_seasonal_booking__succeeds_after_retry():
    application_section = ApplicationSectionFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_seasonal_booking_response(reservation)

    patch = patch_method(
        PindoraClient.request,
        side_effect=[
            requests.ConnectionError("timeout"),
            ResponseMock(status_code=HTTP_500_INTERNAL_SERVER_ERROR),
            ResponseMock(json_data=data),
        ],
    )

    with patch as magic_mock:
        PindoraClient.get_seasonal_booking(application_section)

    assert magic_mock.call_count == 3


@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__create_seasonal_booking(is_active: bool):
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    reservation = ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_seasonal_booking_response(reservation, access_code_is_active=is_active)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.create_seasonal_booking(application_section, is_active=is_active)

    assert response["access_code"] == "13245#"
    assert response["access_code_keypad_url"] == "https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto"
    assert response["access_code_phone_number"] == "+358407089833"
    assert response["access_code_sms_number"] == "+358407089834"
    assert response["access_code_sms_message"] == "a13245"
    assert response["access_code_generated_at"] == reservation.created_at.astimezone(DEFAULT_TIMEZONE)
    assert response["access_code_is_active"] is is_active

    assert response["reservation_unit_code_validity"] == [
        {
            "reservation_unit_id": reservation.ext_uuid,
            "access_code_valid_minutes_before": 0,
            "access_code_valid_minutes_after": 0,
            "begin": reservation.begin.astimezone(DEFAULT_TIMEZONE),
            "end": reservation.end.astimezone(DEFAULT_TIMEZONE),
        }
    ]


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
        ),
        "409": ErrorParams(
            status_code=HTTP_409_CONFLICT,
            exception=PindoraConflictError,
        ),
        "non 200": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__errors(status_code, exception, error_msg):
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.create_seasonal_booking(application_section)


@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__no_reservations():
    application_section = ApplicationSectionFactory.create()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK))

    msg = f"No reservations require an access code in seasonal booking '{application_section.ext_uuid}'."
    with patch, pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__no_confirmed_reservations():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.DENIED,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK))

    msg = f"No reservations require an access code in seasonal booking '{application_section.ext_uuid}'."
    with patch, pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@pytest.mark.django_db
def test_pindora_client__reschedule_seasonal_booking():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.reschedule_seasonal_booking(application_section)

    assert patch.call_count == 1


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
@pytest.mark.django_db
def test_pindora_client__reschedule_seasonal_booking__errors(status_code, exception, error_msg):
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.reschedule_seasonal_booking(application_section)


@pytest.mark.django_db
def test_pindora_client__reschedule_seasonal_booking__no_reservations():
    application_section = ApplicationSectionFactory.create()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK))

    msg = f"No confirmed reservations in seasonal booking '{application_section.ext_uuid}'."
    with patch, pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.reschedule_seasonal_booking(application_section)


@pytest.mark.django_db
def test_pindora_client__reschedule_seasonal_booking__no_confirmed_reservations():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.DENIED,
    )

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK))

    msg = f"No confirmed reservations in seasonal booking '{application_section.ext_uuid}'."
    with patch, pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.reschedule_seasonal_booking(application_section)


def test_pindora_client__delete_seasonal_booking():
    application_section = ApplicationSectionFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.delete_seasonal_booking(application_section)

    assert patch.call_count == 1


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__delete_seasonal_booking__errors(status_code, exception, error_msg):
    application_section = ApplicationSectionFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.delete_seasonal_booking(application_section)


def test_pindora_client__change_seasonal_booking_access_code():
    application_section = ApplicationSectionFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_200_OK)) as patch:
        PindoraClient.change_seasonal_booking_access_code(application_section)

    assert patch.call_count == 1


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__change_seasonal_booking_access_code__errors(status_code, exception, error_msg):
    application_section = ApplicationSectionFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.change_seasonal_booking_access_code(application_section)


def test_pindora_client__activate_seasonal_booking_access_code():
    application_section = ApplicationSectionFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.activate_seasonal_booking_access_code(application_section)

    assert patch.call_count == 1


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__activate_seasonal_booking_access_code__errors(status_code, exception, error_msg):
    application_section = ApplicationSectionFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.activate_seasonal_booking_access_code(application_section)


def test_pindora_client__deactivate_seasonal_booking_access_code():
    application_section = ApplicationSectionFactory.build()

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraClient.deactivate_seasonal_booking_access_code(application_section)

    assert patch.call_count == 1


@pytest.mark.parametrize(
    **parametrize_helper({
        "400": ErrorParams(
            status_code=HTTP_400_BAD_REQUEST,
            exception=PindoraBadRequestError,
        ),
        "403": ErrorParams(
            status_code=HTTP_403_FORBIDDEN,
            exception=PindoraPermissionError,
        ),
        "404": ErrorParams(
            status_code=HTTP_404_NOT_FOUND,
            exception=PindoraNotFoundError,
        ),
        "non 204": ErrorParams(
            status_code=HTTP_418_IM_A_TEAPOT,
            exception=PindoraUnexpectedResponseError,
        ),
    })
)
def test_pindora_client__deactivate_seasonal_booking_access_code__errors(status_code, exception, error_msg):
    application_section = ApplicationSectionFactory.build()

    patch = patch_method(PindoraClient.request, return_value=ResponseMock(status_code=status_code))

    with patch, pytest.raises(exception, match=exact(error_msg) if error_msg else None):
        PindoraClient.deactivate_seasonal_booking_access_code(application_section)
