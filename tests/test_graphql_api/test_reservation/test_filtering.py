from __future__ import annotations

import datetime

import pytest
from django.utils import timezone
from freezegun import freeze_time

from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice, ReservationTypeChoice, UserRoleChoice
from utils.date_utils import DEFAULT_TIMEZONE

from tests.factories import (
    PaymentOrderFactory,
    RecurringReservationFactory,
    ReservationFactory,
    ReservationUnitFactory,
    UnitFactory,
    UnitGroupFactory,
    UnitRoleFactory,
    UserFactory,
)
from tests.test_graphql_api.test_reservation.helpers import reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__filter__by_reservation_type(graphql):
    # given:
    # - There is a reservation in a certain state
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit], type=ReservationTypeChoice.NORMAL)
    graphql.login_with_superuser()

    # when:
    # - User tries to filter reservations by said type
    query = reservations_query(reservation_type=ReservationTypeChoice.NORMAL)
    response = graphql(query)

    # then:
    # - The reservation is returned without errors
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_reservation_type__multiple(graphql):
    # given:
    # - There are reservations in a different states
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    reservation_1 = ReservationFactory.create(reservation_units=[reservation_unit], type=ReservationTypeChoice.NORMAL)
    reservation_2 = ReservationFactory.create(reservation_units=[reservation_unit], type=ReservationTypeChoice.STAFF)
    ReservationFactory.create(reservation_units=[reservation_unit], type=ReservationTypeChoice.BEHALF)
    graphql.login_with_superuser()

    # when:
    # - User tries to filter reservations by some of those states
    query = reservations_query(reservation_type=[ReservationTypeChoice.NORMAL, ReservationTypeChoice.STAFF])
    response = graphql(query)

    # then:
    # - The reservation is returned without errors, and contains those in the selected states
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_state(graphql):
    reservation = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING)
    ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    graphql.login_with_superuser()
    query = reservations_query(state=reservation.state)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_state__multiple(graphql):
    reservation_1 = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING)
    reservation_2 = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    graphql.login_with_superuser()
    query = reservations_query(state=[reservation_1.state, reservation_2.state])
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_order_status(graphql):
    reservation_1 = ReservationFactory.create()
    payment_order_1 = PaymentOrderFactory.create(reservation=reservation_1, status=OrderStatus.PAID)
    reservation_2 = ReservationFactory.create()
    PaymentOrderFactory.create(reservation=reservation_2, status=OrderStatus.REFUNDED)

    graphql.login_with_superuser()
    query = reservations_query(order_status=payment_order_1.status)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_1.pk}


def test_reservation__filter__by_order_status__multiple(graphql):
    reservation_1 = ReservationFactory.create()
    payment_order_1 = PaymentOrderFactory.create(reservation=reservation_1, status=OrderStatus.PAID)
    reservation_2 = ReservationFactory.create()
    payment_order_2 = PaymentOrderFactory.create(reservation=reservation_2, status=OrderStatus.REFUNDED)

    graphql.login_with_superuser()
    query = reservations_query(
        order_status=[payment_order_1.status, payment_order_2.status],
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_requested(graphql):
    reservation_1 = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING)
    reservation_2 = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED, handled_at=timezone.localtime())
    ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    graphql.login_with_superuser()
    query = reservations_query(requested=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_not_requested(graphql):
    ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING)
    ReservationFactory.create(state=ReservationStateChoice.CONFIRMED, handled_at=timezone.localtime())
    reservation_3 = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    graphql.login_with_superuser()
    query = reservations_query(requested=False)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_3.pk}


def test_reservation__filter__by_only_with_permission__regular_user(graphql):
    user = graphql.login_with_regular_user()

    ReservationFactory.create(user=user)  # Own reservation
    ReservationFactory.create()  # Other user's reservation

    query = reservations_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 0


def test_reservation__filter__by_only_with_permission__unit_admin(graphql):
    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    admin = UserFactory.create_with_unit_role(units=[unit])

    ReservationFactory.create(user=admin)  # Own reservation, different unit
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    ReservationFactory.create()  # Other user's reservation, different unit

    graphql.force_login(admin)
    query = reservations_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_only_with_permission__unit_admin__reserver(graphql):
    unit = UnitFactory.create()

    reservation_unit = ReservationUnitFactory.create(unit=unit)

    admin = UserFactory.create_with_unit_role(role=UserRoleChoice.RESERVER, units=[unit])

    # Own reservation, own unit
    reservation = ReservationFactory.create(user=admin, reservation_units=[reservation_unit])
    # Own reservation, different unit
    ReservationFactory.create(user=admin)
    # Other user's reservation, own unit
    ReservationFactory.create(reservation_units=[reservation_unit])
    # Other user's reservation, different unit
    ReservationFactory.create()

    graphql.force_login(admin)
    query = reservations_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_only_with_permission__unit_group_admin(graphql):
    unit_group = UnitGroupFactory.create()
    unit = UnitFactory.create(unit_groups=[unit_group])
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    admin = UserFactory.create_with_unit_role(unit_groups=[unit_group])

    ReservationFactory.create(user=admin)  # Own reservation, different unit
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    ReservationFactory.create()  # Other user's reservation, different unit

    graphql.force_login(admin)
    query = reservations_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_only_with_handling_permission__regular_user(graphql):
    user = graphql.login_with_regular_user()

    ReservationFactory.create(user=user)  # Own reservation
    ReservationFactory.create()  # Other user's reservation

    query = reservations_query(only_with_handling_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 0


def test_reservation__filter__by_only_with_handling_permission__unit_admin(graphql):
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    reservation_unit_1 = ReservationUnitFactory.create(unit=unit_1)
    reservation_unit_2 = ReservationUnitFactory.create(unit=unit_2)

    admin = UserFactory.create_with_unit_role(units=[unit_1], role=UserRoleChoice.RESERVER)
    UnitRoleFactory.create(user=admin, units=[unit_2], role=UserRoleChoice.ADMIN)

    # Reservation for the admin
    ReservationFactory.create(user=admin)
    # Reservation for the unit the admin has manage permissions for
    reservation = ReservationFactory.create(reservation_units=[reservation_unit_2])
    # Reservation for the unit the admin has view permissions for
    ReservationFactory.create(reservation_units=[reservation_unit_1])
    # Reservation for another unit
    ReservationFactory.create()

    graphql.force_login(admin)
    query = reservations_query(only_with_handling_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_only_with_handling_permission__unit_group_admin(graphql):
    unit_group_1 = UnitGroupFactory.create()
    unit_group_2 = UnitGroupFactory.create()
    unit_1 = UnitFactory.create(unit_groups=[unit_group_1])
    unit_2 = UnitFactory.create(unit_groups=[unit_group_2])
    reservation_unit_1 = ReservationUnitFactory.create(unit=unit_1)
    reservation_unit_2 = ReservationUnitFactory.create(unit=unit_2)

    admin = UserFactory.create_with_unit_role(unit_groups=[unit_group_1], role=UserRoleChoice.RESERVER)
    UnitRoleFactory.create(user=admin, unit_groups=[unit_group_2], role=UserRoleChoice.ADMIN)

    # Reservation for the admin
    ReservationFactory.create(user=admin)
    # Reservation for the unit group the admin has manage permissions for
    reservation = ReservationFactory.create(reservation_units=[reservation_unit_2])
    # Reservation for the unit group the admin has view permissions for
    ReservationFactory.create(reservation_units=[reservation_unit_1])
    # Reservation for another unit
    ReservationFactory.create()

    graphql.force_login(admin)
    query = reservations_query(only_with_handling_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_user(graphql):
    reservation = ReservationFactory.create()
    ReservationFactory.create()

    graphql.login_with_superuser()
    query = reservations_query(user=reservation.user.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


@pytest.mark.parametrize(
    ("field", "search"),
    [
        ("reservation_unit_name_fi", "koi"),
        ("reservation_unit_name_en", "dog"),
        ("reservation_unit_name_sv", "hun"),
    ],
)
def test_reservation__filter__by_reservation_unit_name(graphql, field, search):
    reservation = ReservationFactory.create(
        reservation_units__name_fi="koirankoppi",
        reservation_units__name_en="doghouse",
        reservation_units__name_sv="hundkoja",
    )

    graphql.login_with_superuser()
    query = reservations_query(**{field: search})
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


@pytest.mark.parametrize(
    ("field", "search"),
    [
        ("reservation_unit_name_fi", "koi, nors"),
        ("reservation_unit_name_en", "dog, elep"),
        ("reservation_unit_name_sv", "hun, elef"),
    ],
)
def test_reservation__filter__by_reservation_unit_name__multiple_values(graphql, field, search):
    reservation_1 = ReservationFactory.create(
        reservation_units__name_fi="koirankoppi",
        reservation_units__name_en="doghouse",
        reservation_units__name_sv="hundkoja",
    )
    reservation_2 = ReservationFactory.create(
        reservation_units__name_fi="norsutarha",
        reservation_units__name_en="elephant park",
        reservation_units__name_sv="elefantparken",
    )

    graphql.login_with_superuser()
    query = reservations_query(**{field: search})
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_unit(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    ReservationFactory.create()

    graphql.login_with_superuser()
    query = reservations_query(unit=reservation_unit.unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_unit__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation_1 = ReservationFactory.create(reservation_units=[reservation_unit_1])
    reservation_2 = ReservationFactory.create(reservation_units=[reservation_unit_2])

    graphql.login_with_superuser()
    query = reservations_query(unit=[reservation_unit_1.unit.pk, reservation_unit_2.unit.pk])
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_price_lte(graphql):
    reservation = ReservationFactory.create(price=30)
    ReservationFactory.create(price=50)

    graphql.login_with_superuser()
    query = reservations_query(price_lte=30)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_price_gte(graphql):
    reservation = ReservationFactory.create(price=50)
    ReservationFactory.create(price=20)

    graphql.login_with_superuser()
    query = reservations_query(price_gte=30)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_recurring_reservation(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        reservation_units=[recurring_reservation.reservation_unit],
    )

    graphql.login_with_superuser()
    query = reservations_query(recurring_reservation=recurring_reservation.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_is_recurring(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        reservation_units=[recurring_reservation.reservation_unit],
    )
    ReservationFactory.create(recurring_reservation=None)

    graphql.login_with_superuser()
    query = reservations_query(is_recurring=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_reservation_unit(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])

    graphql.login_with_superuser()
    query = reservations_query(reservation_units=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_reservation_units__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation_1 = ReservationFactory.create(reservation_units=[reservation_unit_1])
    reservation_2 = ReservationFactory.create(reservation_units=[reservation_unit_2])

    graphql.login_with_superuser()
    query = reservations_query(reservation_units=[reservation_unit_1.pk, reservation_unit_2.pk])
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_reservation_unit_type(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])

    graphql.login_with_superuser()
    query = reservations_query(reservation_unit_type=reservation_unit.reservation_unit_type.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_reservation_unit_type__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation_1 = ReservationFactory.create(reservation_units=[reservation_unit_1])
    reservation_2 = ReservationFactory.create(reservation_units=[reservation_unit_2])

    graphql.login_with_superuser()
    query = reservations_query(
        reservation_unit_type=[
            reservation_unit_1.reservation_unit_type.pk,
            reservation_unit_2.reservation_unit_type.pk,
        ],
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_text_search__pk(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])

    graphql.login_with_superuser()
    query = reservations_query(text_search=str(reservation.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__name(graphql):
    reservation = ReservationFactory.create(name="foo")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_id(graphql):
    reservation = ReservationFactory.create(reservee_id="foo")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.reservee_id)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_email(graphql):
    reservation = ReservationFactory.create(reservee_email="foo@email.com")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.reservee_email)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_first_name(graphql):
    reservation = ReservationFactory.create(reservee_first_name="foo")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.reservee_first_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_last_name(graphql):
    reservation = ReservationFactory.create(reservee_last_name="foo")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.reservee_last_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_organisation_name(graphql):
    reservation = ReservationFactory.create(reservee_organisation_name="foo")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.reservee_organisation_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__user_email(graphql):
    reservation = ReservationFactory.create(user__email="foo@email.com")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.user.email)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__user_first_name(graphql):
    reservation = ReservationFactory.create(user__first_name="foo")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.user.first_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__user_last_name(graphql):
    reservation = ReservationFactory.create(user__last_name="foo")

    graphql.login_with_superuser()
    query = reservations_query(text_search=reservation.user.last_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__recurring_reservation_name(graphql):
    reservation = ReservationFactory.create(recurring_reservation__name="foo")
    recurring_reservation = reservation.recurring_reservation

    graphql.login_with_superuser()
    query = reservations_query(text_search=recurring_reservation.name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__email_pattern(graphql):
    reservation_1 = ReservationFactory.create(reservee_email="foo@email.com")
    reservation_2 = ReservationFactory.create(user__email="bar@email.com")

    graphql.login_with_superuser()
    query = reservations_query(text_search="@email.com")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


@freeze_time("2021-01-01", tz_offset=2)  # UTC+2
def test_reservation__filter__by_begin_and_end_dates_is_timezone_aware(graphql):
    assert str(DEFAULT_TIMEZONE) == "Europe/Helsinki"

    # 2021-01-01
    reservation_1 = ReservationFactory.create(
        begin=datetime.datetime(2021, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2021, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE),
    )
    # 2021-01-02 - 2021-01-03
    reservation_2 = ReservationFactory.create(
        begin=datetime.datetime(2021, 1, 2, 12, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2021, 1, 3, 0, tzinfo=DEFAULT_TIMEZONE),
    )
    # 2021-01-03 - 2021-01-04
    reservation_3 = ReservationFactory.create(
        begin=datetime.datetime(2021, 1, 3, 12, tzinfo=datetime.UTC),  # 2021-01-03 14:00 local time
        end=datetime.datetime(2021, 1, 3, 22, tzinfo=datetime.UTC),  # 2021-01-04 00:00 local time
    )

    graphql.login_with_superuser()

    response = graphql(reservations_query(begin_date=None, end_date=None))
    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_3.pk}

    response = graphql(reservations_query(begin_date="2021-01-01", end_date=None))
    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_3.pk}

    response = graphql(reservations_query(begin_date=None, end_date="2021-01-01"))
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_1.pk}

    response = graphql(reservations_query(begin_date="2021-01-01", end_date="2021-01-01"))
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_1.pk}

    response = graphql(reservations_query(begin_date="2021-01-02", end_date=None))
    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_2.pk}
    assert response.node(1) == {"pk": reservation_3.pk}

    response = graphql(reservations_query(begin_date=None, end_date="2021-01-02"))
    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}

    response = graphql(reservations_query(begin_date="2021-01-02", end_date="2021-01-02"))
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_2.pk}

    response = graphql(reservations_query(begin_date="2021-01-03", end_date=None))
    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_2.pk}
    assert response.node(1) == {"pk": reservation_3.pk}

    response = graphql(reservations_query(begin_date="2021-01-04", end_date=None))
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_3.pk}


def test_reservation__filter__by_created_at(graphql):
    ReservationFactory.create(created_at=datetime.datetime(2024, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE))
    reservation_1 = ReservationFactory.create(created_at=datetime.datetime(2024, 1, 2, 12, tzinfo=DEFAULT_TIMEZONE))
    reservation_2 = ReservationFactory.create(created_at=datetime.datetime(2024, 1, 2, 16, tzinfo=DEFAULT_TIMEZONE))
    ReservationFactory.create(created_at=datetime.datetime(2024, 1, 3, 12, tzinfo=DEFAULT_TIMEZONE))

    lte = datetime.date(2024, 1, 2).isoformat()
    gte = datetime.date(2024, 1, 2).isoformat()

    graphql.login_with_superuser()
    query = reservations_query(created_at_gte=gte, created_at_lte=lte)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_applying_for_free_of_charge(graphql):
    reservation_1 = ReservationFactory.create(applying_for_free_of_charge=True)
    reservation_2 = ReservationFactory.create(applying_for_free_of_charge=False)

    graphql.login_with_superuser()
    query = reservations_query(applying_for_free_of_charge=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_1.pk}

    query = reservations_query(applying_for_free_of_charge=False)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_2.pk}
