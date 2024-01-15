import pytest

from reservations.choices import CustomerTypeChoice, ReservationTypeChoice
from tests.factories import RecurringReservationFactory, ReservationFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_reservee_name__type__staff():
    reservation = ReservationFactory.create(
        type=ReservationTypeChoice.STAFF,
        recurring_reservation=RecurringReservationFactory.create(name="foo"),
    )
    assert reservation.reservee_name == "foo"


def test_reservation_reservee_name__type__blocked():
    reservation = ReservationFactory.create(type=ReservationTypeChoice.BLOCKED)
    assert reservation.reservee_name == "Closed"


def test_reservation_reservee_name__reservee_type__business():
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="Business Name",
    )
    assert reservation.reservee_name == "Business Name"


def test_reservation_reservee_name__reservee_type__nonprofit():
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.NONPROFIT,
        reservee_organisation_name="Nonprofit Name",
    )
    assert reservation.reservee_name == "Nonprofit Name"


def test_reservation_reservee_name__reservee_type__nonprofit__no_organisation_name():
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.NONPROFIT, reservee_organisation_name="", name="Reservation Name"
    )
    assert reservation.reservee_name == "Reservation Name"


def test_reservation_reservee_name__reservee_type__individual__full_name():
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_first_name="Foo",
        reservee_last_name="Bar",
    )
    assert reservation.reservee_name == "Foo Bar"


def test_reservation_reservee_name__reservee_type__individual__only_first_name():
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_first_name="Foo",
        reservee_last_name="",
    )
    assert reservation.reservee_name == "Foo"


def test_reservation_reservee_name__reservee_type__individual__only_last_name():
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_first_name="",
        reservee_last_name="Bar",
    )
    assert reservation.reservee_name == "Bar"


def test_reservation_reservee_name__reservee_type__individual__no_names():
    reservation = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_first_name="",
        reservee_last_name="",
        name="Reservation Name",
    )
    assert reservation.reservee_name == "Reservation Name"


def test_reservation_reservee_name__reservee_type__none():
    reservation = ReservationFactory.create(
        reservee_type=None,
        name="Reservation Name",
    )
    assert reservation.reservee_name == "Reservation Name"


def test_reservation_reservee_name__user_name():
    reservation = ReservationFactory.create(
        reservee_type=None,
        name="",
    )
    assert reservation.reservee_name == reservation.user.get_full_name()


def test_reservation_reservee_name__unnamed_reservation():
    reservation = ReservationFactory.create(
        reservee_type=None,
        name="",
        user__first_name="",
        user__last_name="",
    )
    assert reservation.reservee_name == "Unnamed reservation"
