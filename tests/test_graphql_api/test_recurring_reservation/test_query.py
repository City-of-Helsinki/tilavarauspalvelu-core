import freezegun
import pytest

from tests.factories import RecurringReservationFactory
from tests.helpers import UserType

from .helpers import recurring_reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__query(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        name
        description
        beginDate
        endDate
        beginTime
        endTime
        recurrenceInDays
        weekdays
        created
        user
        applicationEventSchedule
        ageGroup {
            minimum
            maximum
        }
        abilityGroup {
            name
        }
        reservationUnit {
            nameFi
        }
    """
    query = recurring_reservations_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": recurring_reservation.pk,
        "name": recurring_reservation.name,
        "description": recurring_reservation.description,
        "beginDate": recurring_reservation.begin_date.isoformat(),
        "endDate": recurring_reservation.end_date.isoformat(),
        "beginTime": recurring_reservation.begin_time.isoformat(),
        "endTime": recurring_reservation.end_time.isoformat(),
        "recurrenceInDays": recurring_reservation.recurrence_in_days,
        "weekdays": [1, 2, 3, 4, 5],
        "created": recurring_reservation.created.isoformat(),
        "user": recurring_reservation.user.email,
        "applicationEventSchedule": recurring_reservation.application_event_schedule.pk,
        "ageGroup": {
            "minimum": recurring_reservation.age_group.minimum,
            "maximum": recurring_reservation.age_group.maximum,
        },
        "abilityGroup": {
            "name": recurring_reservation.ability_group.name,
        },
        "reservationUnit": {
            "nameFi": recurring_reservation.reservation_unit.name_fi,
        },
    }


def test_recurring_reservations__filter__by_user(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(user=recurring_reservation.user.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("reservationUnitNameFi", "FI"),
        ("reservationUnitNameEn", "EN"),
        ("reservationUnitNameSv", "SV"),
    ],
)
def test_recurring_reservations__filter__by_reservation_unit_name(graphql, field, value):
    recurring_reservation = RecurringReservationFactory.create(
        name="1",
        reservation_unit__name_fi="FI",
        reservation_unit__name_en="EN",
        reservation_unit__name_sv="SV",
    )
    RecurringReservationFactory.create(
        name="2",
        reservation_unit__name_fi="foo",
        reservation_unit__name_en="bar",
        reservation_unit__name_sv="baz",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(**{field: value})
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("reservationUnitNameFi", "FI, foo"),
        ("reservationUnitNameEn", "EN, bar"),
        ("reservationUnitNameSv", "SV, baz"),
    ],
)
def test_recurring_reservations__filter__by_reservation_unit_name__multiple(graphql, field, value):
    recurring_reservation_1 = RecurringReservationFactory.create(
        name="1",
        reservation_unit__name_fi="FI",
        reservation_unit__name_en="EN",
        reservation_unit__name_sv="SV",
    )
    recurring_reservation_2 = RecurringReservationFactory.create(
        name="2",
        reservation_unit__name_fi="foo",
        reservation_unit__name_en="bar",
        reservation_unit__name_sv="baz",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(**{field: value})
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__filter__by_reservation_unit(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(reservationUnit=recurring_reservation.reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


def test_recurring_reservations__filter__by_reservation_unit__multiple(graphql):
    recurring_reservation_1 = RecurringReservationFactory.create(name="1")
    recurring_reservation_2 = RecurringReservationFactory.create(name="2")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(
        reservationUnit=[recurring_reservation_1.reservation_unit.pk, recurring_reservation_2.reservation_unit.pk],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__filter__by_unit(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(unit=recurring_reservation.reservation_unit.unit.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


def test_recurring_reservations__filter__by_unit__multiple(graphql):
    recurring_reservation_1 = RecurringReservationFactory.create(name="1")
    recurring_reservation_2 = RecurringReservationFactory.create(name="2")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(
        unit=[recurring_reservation_1.reservation_unit.unit.pk, recurring_reservation_2.reservation_unit.unit.pk],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__filter__by_reservation_unit_type(graphql):
    recurring_reservation = RecurringReservationFactory.create(reservation_unit__reservation_unit_type__name="foo")
    RecurringReservationFactory.create(reservation_unit__reservation_unit_type__name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(
        reservation_unit_type=recurring_reservation.reservation_unit.reservation_unit_type.pk,
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


def test_recurring_reservations__filter__by_reservation_unit_type__multiple(graphql):
    recurring_reservation_1 = RecurringReservationFactory.create(
        name="1",
        reservation_unit__reservation_unit_type__name="foo",
    )
    recurring_reservation_2 = RecurringReservationFactory.create(
        name="2",
        reservation_unit__reservation_unit_type__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(
        reservation_unit_type=[
            recurring_reservation_1.reservation_unit.reservation_unit_type.pk,
            recurring_reservation_2.reservation_unit.reservation_unit_type.pk,
        ],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


@pytest.mark.parametrize(
    "field",
    [
        "reservationUnitNameFi",
        "reservationUnitNameEn",
        "reservationUnitNameSv",
    ],
)
def test_recurring_reservations__order__by_reservation_unit_name(graphql, field):
    recurring_reservation_1 = RecurringReservationFactory.create(
        reservation_unit__name_fi="1",
        reservation_unit__name_en="3",
        reservation_unit__name_sv="2",
    )
    recurring_reservation_2 = RecurringReservationFactory.create(
        reservation_unit__name_fi="4",
        reservation_unit__name_en="6",
        reservation_unit__name_sv="5",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(order_by=field)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


@pytest.mark.parametrize(
    "field",
    [
        "unitNameFi",
        "unitNameEn",
        "unitNameSv",
    ],
)
def test_recurring_reservations__order__by_unit_name(graphql, field):
    recurring_reservation_1 = RecurringReservationFactory.create(
        reservation_unit__unit__name_fi="1",
        reservation_unit__unit__name_en="3",
        reservation_unit__unit__name_sv="2",
    )
    recurring_reservation_2 = RecurringReservationFactory.create(
        reservation_unit__unit__name_fi="4",
        reservation_unit__unit__name_en="6",
        reservation_unit__unit__name_sv="5",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(order_by=field)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__order__by_crated(graphql):
    with freezegun.freeze_time("2023-01-02T12:00:00Z") as frozen_time:
        recurring_reservation_1 = RecurringReservationFactory.create()
        frozen_time.move_to("2023-01-03T12:00:00Z")
        recurring_reservation_2 = RecurringReservationFactory.create()
        frozen_time.move_to("2023-01-01T12:00:00Z")
        recurring_reservation_3 = RecurringReservationFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    query = recurring_reservations_query(order_by="created")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": recurring_reservation_3.pk}
    assert response.node(1) == {"pk": recurring_reservation_1.pk}
    assert response.node(2) == {"pk": recurring_reservation_2.pk}
