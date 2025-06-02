from __future__ import annotations

from typing import Any, NamedTuple

import pytest
from graphene_django_extensions.testing.utils import parametrize_helper

from tilavarauspalvelu.enums import AccessType, CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice

from tests.factories import ReservationFactory


class Params(NamedTuple):
    fields: dict[str, Any]
    result: str


@pytest.mark.parametrize(
    **parametrize_helper({
        "Type: BLOCKED | All names empty": Params(
            fields={"type": ReservationTypeChoice.BLOCKED},
            result="Closed",
        ),
        "Type: STAFF | All names empty": Params(
            fields={"type": ReservationTypeChoice.STAFF},
            result="",
        ),
        "Type: STAFF | Reservation Series": Params(
            fields={
                "type": ReservationTypeChoice.STAFF,
                "reservation_series__name": "Recurring",
                "name": "Reservation Name",
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
            },
            result="Recurring",
        ),
        "Type: STAFF | Reservation Series has no name": Params(
            fields={
                "type": ReservationTypeChoice.STAFF,
                "reservation_series__name": "",
                "name": "Reservation Name",
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
            },
            result="Reservation Name",
        ),
        "Type: STAFF | name": Params(
            fields={
                "type": ReservationTypeChoice.STAFF,
                "name": "Reservation Name",
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
            },
            result="Reservation Name",
        ),
        "Type: None | Use reservee first and last names": Params(
            fields={
                "type": None,
                "name": "Reservation Name",
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
            },
            result="First Last",
        ),
        "CustomerType: BUSINESS | reservee_organisation_name set": Params(
            fields={
                "reservee_type": CustomerTypeChoice.BUSINESS,
                "reservee_organisation_name": "Organisation",
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
            },
            result="Organisation",
        ),
        "CustomerType: NONPROFIT | reservee_organisation_name set": Params(
            fields={
                "reservee_type": CustomerTypeChoice.BUSINESS,
                "reservee_organisation_name": "Organisation",
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
            },
            result="Organisation",
        ),
        "CustomerType: BUSINESS | reservee_organisation_name not set, fallback to reservation name": Params(
            fields={
                "reservee_type": CustomerTypeChoice.BUSINESS,
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
                "name": "Fallback",
            },
            result="Fallback",
        ),
        "CustomerType: INDIVIDUAL | Use Reservee First and Last names": Params(
            fields={
                "reservee_type": CustomerTypeChoice.INDIVIDUAL,
                "reservee_organisation_name": "Organisation",
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
            },
            result="First Last",
        ),
        "CustomerType: INDIVIDUAL | Only First name": Params(
            fields={
                "reservee_type": CustomerTypeChoice.INDIVIDUAL,
                "reservee_first_name": "First",
                "reservee_last_name": "",
            },
            result="First",
        ),
        "CustomerType: INDIVIDUAL | No names, fallback to Fallback to Reservation name": Params(
            fields={
                "reservee_type": CustomerTypeChoice.INDIVIDUAL,
                "name": "Reservation Name",
            },
            result="Reservation Name",
        ),
        "CustomerType: None | Use Reservee First and Last names": Params(
            fields={
                "reservee_type": None,
                "reservee_organisation_name": "Organisation",
                "reservee_first_name": "First",
                "reservee_last_name": "Last",
            },
            result="First Last",
        ),
        "CustomerType: None | Fallback to Reservation name": Params(
            fields={"name": "Reservation Name"},
            result="Reservation Name",
        ),
        "CustomerType: None | Fallback to User name": Params(
            fields={
                "user__first_name": "User First",
                "user__last_name": "User Last",
            },
            result="User First User Last",
        ),
    })
)
def test_reservation__reservee_name(fields: dict[str, Any], result: str):
    fields.setdefault("type", None)
    fields.setdefault("reservee_type", None)
    fields.setdefault("reservee_organisation_name", "")
    fields.setdefault("reservee_first_name", "")
    fields.setdefault("reservee_last_name", "")
    fields.setdefault("name", "")
    fields.setdefault("user__first_name", "")
    fields.setdefault("user__last_name", "")

    reservation = ReservationFactory.build(**fields)
    assert reservation.reservee_name == result


def test_reservation__access_code_should_be_active():
    reservation = ReservationFactory.build(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )
    assert reservation.access_code_should_be_active is True


def test_reservation__access_code_should_be_active__not_access_code():
    reservation = ReservationFactory.build(
        access_type=AccessType.UNRESTRICTED,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )
    assert reservation.access_code_should_be_active is False


def test_reservation__access_code_should_be_active__blocked():
    reservation = ReservationFactory.build(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
    )
    assert reservation.access_code_should_be_active is False


def test_reservation__access_code_should_be_active__not_confirmed():
    reservation = ReservationFactory.build(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CREATED,
        type=ReservationTypeChoice.NORMAL,
    )
    assert reservation.access_code_should_be_active is False


def test_reservation__is_access_code_is_active_correct__active_when_should_be():
    reservation = ReservationFactory.build(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
    )
    assert reservation.is_access_code_is_active_correct is True


def test_reservation__is_access_code_is_active_correct__active_when_should_not_be():
    reservation = ReservationFactory.build(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
    )
    assert reservation.is_access_code_is_active_correct is False


def test_reservation__is_access_code_is_active_correct__inactive_when_should_not_be():
    reservation = ReservationFactory.build(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
    )
    assert reservation.is_access_code_is_active_correct is False


def test_reservation__is_access_code_is_active_correct__inactive_when_should_be():
    reservation = ReservationFactory.build(
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
    )
    assert reservation.is_access_code_is_active_correct is True
