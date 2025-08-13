from __future__ import annotations

import pytest
import requests
from freezegun import freeze_time
from rest_framework.status import (
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
    PindoraConflictError,
    PindoraNotFoundError,
    PindoraPermissionError,
    PindoraUnexpectedResponseError,
)
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraAccessCodeModifyResponse,
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingResponse,
)
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceRequestError

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationSectionFactory,
    ReservationFactory,
    ReservationSeriesFactory,
    ReservationUnitOptionFactory,
)
from tests.helpers import ResponseMock, exact, parametrize_helper, patch_method, use_retries
from tests.test_integrations.test_keyless_entry.helpers import (
    ErrorParams,
    default_access_code_modify_response,
    default_seasonal_booking_response,
)


def test_pindora_client__get_seasonal_booking():
    application_section = ApplicationSectionFactory.build()
    ReservationFactory.build(created_at=local_datetime())

    data = default_seasonal_booking_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.get_seasonal_booking(application_section)

    assert response["access_code"] == "13245#"


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
    ReservationFactory.build(created_at=local_datetime())

    data = default_seasonal_booking_response()

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
    reservation_series = ReservationSeriesFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        reservation_series=reservation_series,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_seasonal_booking_response(access_code_is_active=is_active)

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraClient.create_seasonal_booking(application_section, is_active=is_active)

    assert response["access_code"] == "13245#"


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
    reservation_series = ReservationSeriesFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        reservation_series=reservation_series,
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

    data = default_seasonal_booking_response()
    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    with patch as mock:
        PindoraClient.create_seasonal_booking(application_section)

    assert mock.call_args.kwargs["json"]["series"] == []


@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__no_confirmed_reservations():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    reservation_series = ReservationSeriesFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        reservation_series=reservation_series,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.DENIED,
    )

    data = default_seasonal_booking_response()
    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    with patch as mock:
        PindoraClient.create_seasonal_booking(application_section)

    assert mock.call_args.kwargs["json"]["series"] == []


@pytest.mark.django_db
def test_pindora_client__reschedule_seasonal_booking():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    reservation_series = ReservationSeriesFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        reservation_series=reservation_series,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
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
    reservation_series = ReservationSeriesFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        reservation_series=reservation_series,
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

    data = default_access_code_modify_response()
    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    with patch as mock:
        PindoraClient.reschedule_seasonal_booking(application_section)

    assert mock.call_args.kwargs["json"]["series"] == []


@pytest.mark.django_db
def test_pindora_client__reschedule_seasonal_booking__no_confirmed_reservations():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    reservation_series = ReservationSeriesFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        reservation_series=reservation_series,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.DENIED,
    )

    data = default_access_code_modify_response()
    patch = patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data))

    with patch as mock:
        PindoraClient.reschedule_seasonal_booking(application_section)

    assert mock.call_args.kwargs["json"]["series"] == []


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

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
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


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__get_seasonal_booking__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    section_data = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_seasonal_booking_response(section_data, ext_uuid=section.ext_uuid)

    response = PindoraClient.get_seasonal_booking(section)

    assert response == section_data

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__get_seasonal_booking__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.get_seasonal_booking(section)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@patch_method(PindoraClient._mock_create_access_code, return_value="12345")
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    response = PindoraClient.create_seasonal_booking(section)

    assert response == PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__pindora_mock__already_exists(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    section_data = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_seasonal_booking_response(section_data, ext_uuid=section.ext_uuid)

    with pytest.raises(PindoraConflictError):
        PindoraClient.create_seasonal_booking(section)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__reschedule_seasonal_booking__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    section_data = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 10),
                end=local_datetime(2024, 1, 1, 11),
            )
        ],
    )

    PindoraClient._cache_seasonal_booking_response(section_data, ext_uuid=section.ext_uuid)

    response = PindoraClient.reschedule_seasonal_booking(section)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )

    cached_response = PindoraClient._get_cached_seasonal_booking_response(ext_uuid=section.ext_uuid)

    assert cached_response["reservation_unit_code_validity"] == [
        PindoraSeasonalBookingAccessCodeValidity(
            reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
            access_code_valid_minutes_before=0,
            access_code_valid_minutes_after=0,
            begin=local_datetime(2024, 1, 1, 12),
            end=local_datetime(2024, 1, 1, 13),
        )
    ]

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__reschedule_seasonal_booking__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.reschedule_seasonal_booking(section)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@patch_method(PindoraClient._mock_create_access_code, return_value="54321")
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__change_seasonal_booking_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    section_data = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_seasonal_booking_response(section_data, ext_uuid=section.ext_uuid)

    response = PindoraClient.change_seasonal_booking_access_code(section)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )

    cached_response = PindoraClient._get_cached_seasonal_booking_response(ext_uuid=section.ext_uuid)

    assert cached_response["access_code"] == "54321"

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__change_seasonal_booking_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.change_seasonal_booking_access_code(section)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__activate_seasonal_booking_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    section_data = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_seasonal_booking_response(section_data, ext_uuid=section.ext_uuid)

    PindoraClient.activate_seasonal_booking_access_code(section)

    cached_response = PindoraClient._get_cached_seasonal_booking_response(ext_uuid=section.ext_uuid)

    assert cached_response["access_code_is_active"] is True

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__activate_seasonal_booking_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.activate_seasonal_booking_access_code(section)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__deactivate_seasonal_booking_access_code__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    section_data = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_seasonal_booking_response(section_data, ext_uuid=section.ext_uuid)

    PindoraClient.deactivate_seasonal_booking_access_code(section)

    cached_response = PindoraClient._get_cached_seasonal_booking_response(ext_uuid=section.ext_uuid)

    assert cached_response["access_code_is_active"] is False

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__deactivate_seasonal_booking_access_code__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.deactivate_seasonal_booking_access_code(section)

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__delete_seasonal_booking__pindora_mock(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    reservation = ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    section_data = PindoraSeasonalBookingResponse(
        access_code="12345",
        access_code_keypad_url="",
        access_code_phone_number="",
        access_code_sms_number="",
        access_code_sms_message="",
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=reservation.reservation_series.reservation_unit.ext_uuid,
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
                begin=local_datetime(2024, 1, 1, 12),
                end=local_datetime(2024, 1, 1, 13),
            )
        ],
    )

    PindoraClient._cache_seasonal_booking_response(section_data, ext_uuid=section.ext_uuid)

    PindoraClient.delete_seasonal_booking(section)

    cached_response = PindoraClient._get_cached_seasonal_booking_response(ext_uuid=section.ext_uuid)

    assert cached_response is None

    assert PindoraClient.request.call_count == 0


@patch_method(PindoraClient.request)
@freeze_time(local_datetime(2024, 1, 1, 12))
@pytest.mark.django_db
def test_pindora_client__delete_seasonal_booking__pindora_mock__not_found(settings):
    settings.PINDORA_MOCK_ENABLED = True

    section = ApplicationSectionFactory.create()
    ReservationFactory.create(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        created_at=local_datetime(),
        reservation_series__allocated_time_slot__reservation_unit_option__application_section=section,
    )

    with pytest.raises(PindoraNotFoundError):
        PindoraClient.delete_seasonal_booking(section)

    assert PindoraClient.request.call_count == 0
