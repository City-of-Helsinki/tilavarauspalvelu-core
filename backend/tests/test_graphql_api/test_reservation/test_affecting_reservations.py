from __future__ import annotations

import datetime
from functools import partial

import pytest
from graphene_django_extensions.testing import build_query

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.models import ReservationUnitHierarchy
from utils.date_utils import DEFAULT_TIMEZONE

from tests.factories import ReservationFactory, ReservationUnitFactory, SpaceFactory, UnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

affecting_reservations_query = partial(build_query, "affectingReservations", order_by="pkAsc")


def test_reservation__affecting__time_and_state(graphql):
    start_date = datetime.date(2023, 1, 2)
    end_date = datetime.date(2023, 1, 3)

    unit = UnitFactory.create()
    parent_space = SpaceFactory.create(unit=unit)
    reservation_unit = ReservationUnitFactory.create(unit=unit, spaces=[parent_space])

    # Not affecting, since cancelled
    ReservationFactory.create(
        reservation_units=[reservation_unit],
        begin=datetime.datetime(2023, 1, 2, hour=12, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 2, hour=13, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CANCELLED,
    )

    # Not affecting, since denied
    ReservationFactory.create(
        reservation_units=[reservation_unit],
        begin=datetime.datetime(2023, 1, 2, hour=13, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 2, hour=14, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.DENIED,
    )

    # Not affecting, since outside the range (last hour before start date)
    ReservationFactory.create(
        reservation_units=[reservation_unit],
        begin=datetime.datetime(2023, 1, 1, hour=23, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE) - datetime.timedelta(seconds=1),
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since inside the range (first hour)
    reservation_1 = ReservationFactory.create(
        reservation_units=[reservation_unit],
        begin=datetime.datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 2, hour=1, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since inside the range (last hour)
    reservation_2 = ReservationFactory.create(
        reservation_units=[reservation_unit],
        begin=datetime.datetime(2023, 1, 3, hour=23, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 4, hour=0, tzinfo=DEFAULT_TIMEZONE) - datetime.timedelta(seconds=1),
        state=ReservationStateChoice.CREATED,
    )

    # Not affecting, since outside the range (first hour after end date)
    ReservationFactory.create(
        reservation_units=[reservation_unit],
        begin=datetime.datetime(2023, 1, 4, hour=0, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 4, hour=1, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CREATED,
    )

    graphql.login_with_superuser()

    ReservationUnitHierarchy.refresh()

    query = affecting_reservations_query(
        for_units=[unit.pk],
        begin_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
    )
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == [
        {"pk": reservation_1.pk},
        {"pk": reservation_2.pk},
    ]


def test_reservation__affecting__for_unit(graphql):
    unit = UnitFactory.create()
    other_unit = UnitFactory.create()

    parent_space = SpaceFactory.create(unit=unit)
    child_space = SpaceFactory.create(unit=unit, parent=parent_space)
    other_space = SpaceFactory.create(unit=other_unit)
    unique_space = SpaceFactory.create(unit=other_unit)

    # Not affecting, since space not in hierarchy, and unit not in `for_units`
    ReservationFactory.create(
        reservation_units=[ReservationUnitFactory.create(unit=other_unit, spaces=[unique_space])],
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since space in hierarchy, and unit in `for_units`
    reservation_2 = ReservationFactory.create(
        reservation_units=[ReservationUnitFactory.create(unit=unit, spaces=[parent_space])],
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since space in hierarchy (child), and unit in `for_units`
    reservation_3 = ReservationFactory.create(
        reservation_units=[ReservationUnitFactory.create(unit=unit, spaces=[child_space])],
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since space in hierarchy, even if reservation unit's unit not in `for_units`
    reservation_4 = ReservationFactory.create(
        reservation_units=[ReservationUnitFactory.create(unit=other_unit, spaces=[parent_space])],
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since space in hierarchy (child), even if reservation unit's unit not in `for_units`
    reservation_5 = ReservationFactory.create(
        reservation_units=[ReservationUnitFactory.create(unit=other_unit, spaces=[child_space])],
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since in reservation unit's unit in `for_units`, even if space not in the hierarchy with the rest
    reservation_6 = ReservationFactory.create(
        reservation_units=[ReservationUnitFactory.create(unit=unit, spaces=[other_space])],
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since there is a reservation in a reservation unit that includes `other space` (reservation_6),
    # and that reservation unit belongs to a unit in `for_units`, even if this reservation's reservation unit does not.
    reservation_7 = ReservationFactory.create(
        reservation_units=[ReservationUnitFactory.create(unit=other_unit, spaces=[other_space])],
        state=ReservationStateChoice.CREATED,
    )

    graphql.login_with_superuser()

    ReservationUnitHierarchy.refresh()

    query = affecting_reservations_query(for_units=[unit.pk])
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == [
        {"pk": reservation_2.pk},
        {"pk": reservation_3.pk},
        {"pk": reservation_4.pk},
        {"pk": reservation_5.pk},
        {"pk": reservation_6.pk},
        {"pk": reservation_7.pk},
    ]


def test_reservation__affecting__for_reservation_unit(graphql):
    parent_space = SpaceFactory.create()
    child_space = SpaceFactory.create(parent=parent_space)
    other_space = SpaceFactory.create()

    reservation_unit_1 = ReservationUnitFactory.create(spaces=[parent_space])
    reservation_unit_2 = ReservationUnitFactory.create(spaces=[parent_space])
    reservation_unit_3 = ReservationUnitFactory.create(spaces=[child_space])
    reservation_unit_4 = ReservationUnitFactory.create(spaces=[other_space])

    # Affecting, since space in hierarchy, and reservation unit in `for_reservation_units`
    reservation_1 = ReservationFactory.create(
        reservation_units=[reservation_unit_1],
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since space in hierarchy, even if reservation unit not in `for_reservation_units`
    reservation_2 = ReservationFactory.create(
        reservation_units=[reservation_unit_2],
        state=ReservationStateChoice.CREATED,
    )

    # Affecting, since space in hierarchy (child), even if reservation unit not in `for_reservation_units`
    reservation_3 = ReservationFactory.create(
        reservation_units=[reservation_unit_3],
        state=ReservationStateChoice.CREATED,
    )

    # Not affecting, since space not in hierarchy
    ReservationFactory.create(
        reservation_units=[reservation_unit_4],
        state=ReservationStateChoice.CREATED,
    )

    graphql.login_with_superuser()

    ReservationUnitHierarchy.refresh()

    query = affecting_reservations_query(for_reservation_units=[reservation_unit_1.pk])
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == [
        {"pk": reservation_1.pk},
        {"pk": reservation_2.pk},
        {"pk": reservation_3.pk},
    ]


def test_reservation__affecting__affected_reservation_units(graphql):
    parent_space = SpaceFactory.create()
    other_space = SpaceFactory.create()

    reservation_unit_1 = ReservationUnitFactory.create(spaces=[parent_space])
    reservation_unit_2 = ReservationUnitFactory.create(spaces=[parent_space, other_space])
    reservation_unit_3 = ReservationUnitFactory.create(spaces=[other_space])

    reservation_1 = ReservationFactory.create(
        reservation_units=[reservation_unit_1],
        state=ReservationStateChoice.CREATED,
    )
    reservation_2 = ReservationFactory.create(
        reservation_units=[reservation_unit_2],
        state=ReservationStateChoice.CREATED,
    )
    ReservationFactory.create(
        reservation_units=[reservation_unit_3],
        state=ReservationStateChoice.CREATED,
    )

    ReservationUnitHierarchy.refresh()

    graphql.login_with_superuser()

    fields = "pk affectedReservationUnits"
    query = affecting_reservations_query(fields=fields, for_reservation_units=[reservation_unit_1.pk])
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == [
        {
            "pk": reservation_1.pk,
            "affectedReservationUnits": [
                reservation_unit_1.pk,
                reservation_unit_2.pk,
            ],
        },
        {
            "pk": reservation_2.pk,
            "affectedReservationUnits": [
                reservation_unit_1.pk,
                reservation_unit_2.pk,
                reservation_unit_3.pk,
            ],
        },
    ]
