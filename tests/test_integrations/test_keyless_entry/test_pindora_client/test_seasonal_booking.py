from __future__ import annotations

import pytest
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_418_IM_A_TEAPOT,
)

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraClientError
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.base_external_service_client import BaseExternalServiceClient

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationSectionFactory,
    RecurringReservationFactory,
    ReservationFactory,
    ReservationUnitOptionFactory,
)
from tests.helpers import ResponseMock, exact, patch_method
from tests.test_integrations.test_keyless_entry.helpers import default_seasonal_booking_response


def test_pindora_client__get_seasonal_booking():
    application_section = ApplicationSectionFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_seasonal_booking_response(reservation)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
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


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__get_seasonal_booking__403():
    application_section = ApplicationSectionFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__get_seasonal_booking__400():
    application_section = ApplicationSectionFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__get_seasonal_booking__404():
    application_section = ApplicationSectionFactory.build()

    msg = f"Seasonal booking '{application_section.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__get_seasonal_booking__not_200():
    application_section = ApplicationSectionFactory.build()

    msg = (
        f"Unexpected response from Pindora when fetching seasonal booking "
        f"'{application_section.ext_uuid}': [418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.get_seasonal_booking(application_section)


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
    )

    data = default_seasonal_booking_response(reservation, access_code_is_active=is_active)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
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


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__403():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__400():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__404():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = f"Seasonal booking '{application_section.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__409():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = f"Seasonal booking '{application_section.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__not_200():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = (
        f"Unexpected response from Pindora when creating seasonal booking '{application_section.ext_uuid}': "
        f"[418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_200_OK),
)
@pytest.mark.django_db
def test_pindora_client__create_seasonal_booking__no_reservations():
    application_section = ApplicationSectionFactory.create()

    msg = f"No confirmed reservations in seasonal booking '{application_section.ext_uuid}'."
    with pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_200_OK),
)
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

    msg = f"No confirmed reservations in seasonal booking '{application_section.ext_uuid}'."
    with pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.create_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT),
)
@pytest.mark.django_db
@pytest.mark.parametrize("is_active", [True, False])
def test_pindora_client__update_seasonal_booking(is_active: bool):
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    PindoraClient.update_seasonal_reservation(application_section, is_active=is_active)

    assert BaseExternalServiceClient.generic.call_count == 1


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
@pytest.mark.django_db
def test_pindora_client__update_seasonal_booking__403():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_seasonal_reservation(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
@pytest.mark.django_db
def test_pindora_client__update_seasonal_booking__400():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_seasonal_reservation(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
@pytest.mark.django_db
def test_pindora_client__update_seasonal_booking__404():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = f"Seasonal booking '{application_section.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_seasonal_reservation(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
@pytest.mark.django_db
def test_pindora_client__update_seasonal_booking__409():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = f"Seasonal booking '{application_section.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_seasonal_reservation(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
@pytest.mark.django_db
def test_pindora_client__update_seasonal_booking__not_204():
    application_section = ApplicationSectionFactory.create()
    reservation_unit_option = ReservationUnitOptionFactory.create(application_section=application_section)
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=reservation_unit_option)
    recurring_reservation = RecurringReservationFactory.create(allocated_time_slot=allocation)

    ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        created_at=local_datetime(),
        user=application_section.application.user,
        state=ReservationStateChoice.CONFIRMED,
    )

    msg = (
        f"Unexpected response from Pindora when updating seasonal booking '{application_section.ext_uuid}': "
        f"[418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.update_seasonal_reservation(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_200_OK),
)
@pytest.mark.django_db
def test_pindora_client__update_seasonal_booking__no_reservations():
    application_section = ApplicationSectionFactory.create()

    msg = f"No confirmed reservations in seasonal booking '{application_section.ext_uuid}'."
    with pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.update_seasonal_reservation(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_200_OK),
)
@pytest.mark.django_db
def test_pindora_client__update_seasonal_booking__no_confirmed_reservations():
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

    msg = f"No confirmed reservations in seasonal booking '{application_section.ext_uuid}'."
    with pytest.raises(PindoraClientError, match=exact(msg)):
        PindoraClient.update_seasonal_reservation(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT),
)
def test_pindora_client__delete_seasonal_booking():
    application_section = ApplicationSectionFactory.build()

    PindoraClient.delete_seasonal_booking(application_section)

    assert BaseExternalServiceClient.generic.call_count == 1


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__delete_seasonal_booking__403():
    application_section = ApplicationSectionFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__delete_seasonal_booking__400():
    application_section = ApplicationSectionFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__delete_seasonal_booking__404():
    application_section = ApplicationSectionFactory.build()

    msg = f"Seasonal booking '{application_section.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_409_CONFLICT),
)
def test_pindora_client__delete_seasonal_booking__409():
    application_section = ApplicationSectionFactory.build()

    msg = f"Seasonal booking '{application_section.ext_uuid}' already exists in Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_seasonal_booking(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__delete_seasonal_booking__non_204():
    application_section = ApplicationSectionFactory.build()

    msg = (
        f"Unexpected response from Pindora when deleting seasonal booking '{application_section.ext_uuid}': "
        f"[418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.delete_seasonal_booking(application_section)


def test_pindora_client__change_seasonal_booking_access_code():
    application_section = ApplicationSectionFactory.build()
    reservation = ReservationFactory.build(created_at=local_datetime())

    data = default_seasonal_booking_response(reservation)

    with patch_method(
        BaseExternalServiceClient.generic,
        return_value=ResponseMock(json_data=data),
    ):
        response = PindoraClient.change_seasonal_booking_access_code(application_section)

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


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_403_FORBIDDEN),
)
def test_pindora_client__change_seasonal_booking_access_code__403():
    application_section = ApplicationSectionFactory.build()

    msg = "Pindora API key is invalid."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_seasonal_booking_access_code(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_400_BAD_REQUEST, text="bad request"),
)
def test_pindora_client__change_seasonal_booking_access_code__400():
    application_section = ApplicationSectionFactory.build()

    msg = "Invalid Pindora API request: bad request."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_seasonal_booking_access_code(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_404_NOT_FOUND),
)
def test_pindora_client__change_seasonal_booking_access_code__404():
    application_section = ApplicationSectionFactory.build()

    msg = f"Seasonal booking '{application_section.ext_uuid}' not found from Pindora."
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_seasonal_booking_access_code(application_section)


@patch_method(
    BaseExternalServiceClient.generic,
    return_value=ResponseMock(status_code=HTTP_418_IM_A_TEAPOT, text="I'm a teapot"),
)
def test_pindora_client__change_seasonal_booking_access_code__non_200():
    application_section = ApplicationSectionFactory.build()

    msg = (
        f"Unexpected response from Pindora when changing access code for seasonal booking "
        f"'{application_section.ext_uuid}': [418] I'm a teapot"
    )
    with pytest.raises(PindoraAPIError, match=exact(msg)):
        PindoraClient.change_seasonal_booking_access_code(application_section)
