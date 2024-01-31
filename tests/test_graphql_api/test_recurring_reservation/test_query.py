import datetime

import pytest

from tests.factories import RecurringReservationFactory, ReservationUnitFactory
from tests.helpers import UserType
from tilavarauspalvelu.utils.commons import Language

from .helpers import recurring_reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_recurring_reservations__query__all_fields(graphql):
    # given:
    # - There is a recurring reservation
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to query all fields of recurring reservation
    fields = """
        pk
        name
        description
        beginTime
        endTime
        beginDate
        endDate
        recurrenceInDays
        weekdays
        reservationUnit {
            nameFi
        }
        user {
            firstName
            lastName
        }
        applicationEventSchedule {
            pk
        }
        ageGroup {
            minimum
            maximum
        }
        abilityGroup {
            name
        }
        created
    """
    response = graphql(recurring_reservations_query(fields=fields))

    # then:
    # - The query is successful
    # - The response contains the recurring reservation and its fields
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {
        "pk": recurring.pk,
        "name": recurring.name,
        "description": recurring.description,
        "beginTime": recurring.begin_time.isoformat(),
        "endTime": recurring.end_time.isoformat(),
        "beginDate": recurring.begin_date.isoformat(),
        "endDate": recurring.end_date.isoformat(),
        "recurrenceInDays": recurring.recurrence_in_days,
        "weekdays": recurring.weekdays,
        "reservationUnit": {
            "nameFi": recurring.reservation_unit.name_fi,
        },
        "user": {
            "firstName": recurring.user.first_name,
            "lastName": recurring.user.last_name,
        },
        "applicationEventSchedule": {
            "pk": recurring.application_event_schedule.pk,
        },
        "ageGroup": {
            "minimum": recurring.age_group.minimum,
            "maximum": recurring.age_group.maximum,
        },
        "abilityGroup": {
            "name": recurring.ability_group.name,
        },
        "created": recurring.created.isoformat(),
    }


def test_recurring_reservations__filter__by_name(graphql):
    # given:
    # - There are two recurring reservations with different names
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(name="foo")
    RecurringReservationFactory.create(name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by name
    response = graphql(recurring_reservations_query(name=recurring.name))

    # then:
    # - The response contains only the recurring reservation by the given user
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__filter__by_begin_date(graphql):
    later = datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC)
    earlier = datetime.datetime(2020, 1, 1, tzinfo=datetime.UTC)
    given = datetime.date(2020, 5, 1).isoformat()

    # given:
    # - There are two recurring reservations with different names
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(timestamp=later)
    RecurringReservationFactory.create(timestamp=earlier)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by name
    response = graphql(recurring_reservations_query(begin_date__gte=given))

    # then:
    # - The response contains only the recurring reservation by the given user
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__filter__by_begin_time(graphql):
    later = datetime.datetime(2020, 1, 1, hour=12, tzinfo=datetime.UTC)
    earlier = datetime.datetime(2020, 1, 1, hour=8, tzinfo=datetime.UTC)
    given = datetime.time(10, tzinfo=datetime.UTC).isoformat(timespec="minutes")

    # given:
    # - There are two recurring reservations with different names
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(timestamp=later)
    RecurringReservationFactory.create(timestamp=earlier)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by name
    response = graphql(recurring_reservations_query(begin_time__gte=given))

    # then:
    # - The response contains only the recurring reservation by the given user
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__filter__by_end_date(graphql):
    later = datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC)
    earlier = datetime.datetime(2020, 1, 1, tzinfo=datetime.UTC)
    given = datetime.date(2020, 5, 1).isoformat()

    # given:
    # - There are two recurring reservations with different names
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(timestamp=earlier)
    RecurringReservationFactory.create(timestamp=later)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by name
    response = graphql(recurring_reservations_query(end_date__lte=given))

    # then:
    # - The response contains only the recurring reservation by the given user
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__filter__by_end_time(graphql):
    later = datetime.datetime(2020, 1, 1, hour=12, tzinfo=datetime.UTC)
    earlier = datetime.datetime(2020, 1, 1, hour=8, tzinfo=datetime.UTC)
    given = datetime.time(10, tzinfo=datetime.UTC).isoformat(timespec="minutes")

    # given:
    # - There are two recurring reservations with different names
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(timestamp=earlier)
    RecurringReservationFactory.create(timestamp=later)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by name
    response = graphql(recurring_reservations_query(end_time__lte=given))

    # then:
    # - The response contains only the recurring reservation by the given user
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


@pytest.mark.parametrize("language", Language.values)
def test_recurring_reservations__filter__by_reservation_unit_name(graphql, language):
    # given:
    # - There are two recurring reservations with different names and translated names
    # - A superuser is using the system
    input_data_1 = {"name_fi": "koirankoppi", "name_sv": "hundkoja", "name_en": "doghouse"}
    input_data_2 = {"name_fi": "norsutarha", "name_sv": "elefantparken", "name_en": "elephant park"}
    reservation_unit_1 = ReservationUnitFactory.create(**input_data_1)
    reservation_unit_2 = ReservationUnitFactory.create(**input_data_2)
    recurring = RecurringReservationFactory.create(reservation_unit=reservation_unit_1)
    RecurringReservationFactory.create(reservation_unit=reservation_unit_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by reservation unit name in the given language
    field = f"name_{language}"
    response = graphql(recurring_reservations_query(**{f"reservation_unit_{field}": input_data_1[field][:-3]}))

    # then:
    # - The response contains only the recurring reservation with the given name
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


@pytest.mark.parametrize("language", Language.values)
def test_recurring_reservations__filter__by_reservation_unit_name__multiple(graphql, language):
    # given:
    # - There are two recurring reservations with different names and translated names
    # - A superuser is using the system
    input_data_1 = {"name_fi": "koirankoppi", "name_sv": "hundkoja", "name_en": "doghouse"}
    input_data_2 = {"name_fi": "norsutarha", "name_sv": "elefantparken", "name_en": "elephant park"}
    reservation_unit_1 = ReservationUnitFactory.create(**input_data_1)
    reservation_unit_2 = ReservationUnitFactory.create(**input_data_2)
    recurring_1 = RecurringReservationFactory.create(reservation_unit=reservation_unit_1)
    recurring_2 = RecurringReservationFactory.create(reservation_unit=reservation_unit_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by reservation unit name in the given language,
    #   with multiple values separated by commas
    field = f"name_{language}"
    value_1 = input_data_1[field][:-3]
    value_2 = input_data_2[field][:-3]
    response = graphql(recurring_reservations_query(**{f"reservation_unit_{field}": f"{value_1}, {value_2}"}))

    # then:
    # - The response contains only the recurring reservations with the given names
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": recurring_1.pk}
    assert response.node(1) == {"pk": recurring_2.pk}


def test_recurring_reservations__filter__by_user(graphql):
    # given:
    # - There are two recurring reservations by different users
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by user
    response = graphql(recurring_reservations_query(user=recurring.user.pk))

    # then:
    # - The response contains only the recurring reservation by the given user
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__filter__by_unit(graphql):
    # given:
    # - There are two recurring reservations with different units
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(reservation_unit__unit__name="foo")
    RecurringReservationFactory.create(reservation_unit__unit__name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by units
    response = graphql(recurring_reservations_query(unit=recurring.reservation_unit.unit.pk))

    # then:
    # - The response contains only the recurring reservation for the given unit
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__filter__by_unit__multiple(graphql):
    # given:
    # - There are two recurring reservations with different units
    # - A superuser is using the system
    recurring_1 = RecurringReservationFactory.create(reservation_unit__unit__name="foo")
    recurring_2 = RecurringReservationFactory.create(reservation_unit__unit__name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by multiple units
    response = graphql(
        recurring_reservations_query(
            unit=[
                recurring_1.reservation_unit.unit.pk,
                recurring_2.reservation_unit.unit.pk,
            ],
        ),
    )

    # then:
    # - The response contains only the recurring reservation for the given units
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": recurring_1.pk}
    assert response.node(1) == {"pk": recurring_2.pk}


def test_recurring_reservations__filter__by_reservation_unit(graphql):
    # given:
    # - There are two recurring reservations with different reservation units
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(reservation_unit__name="foo")
    RecurringReservationFactory.create(reservation_unit__name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by reservation units
    response = graphql(recurring_reservations_query(reservation_unit=recurring.reservation_unit.pk))

    # then:
    # - The response contains only the recurring reservation for the given reservation unit
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__filter__by_reservation_unit__multiple(graphql):
    # given:
    # - There are two recurring reservations with different reservation unit types
    # - A superuser is using the system
    recurring_1 = RecurringReservationFactory.create(reservation_unit__name="foo")
    recurring_2 = RecurringReservationFactory.create(reservation_unit__name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by multiple reservation units
    response = graphql(
        recurring_reservations_query(
            reservation_unit=[
                recurring_1.reservation_unit.pk,
                recurring_2.reservation_unit.pk,
            ],
        ),
    )

    # then:
    # - The response contains only the recurring reservation for the given reservation units
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": recurring_1.pk}
    assert response.node(1) == {"pk": recurring_2.pk}


def test_recurring_reservations__filter__by_reservation_unit_type(graphql):
    # given:
    # - There are two recurring reservations with different reservation unit types
    # - A superuser is using the system
    recurring = RecurringReservationFactory.create(reservation_unit__reservation_unit_type__name="foo")
    RecurringReservationFactory.create(reservation_unit__reservation_unit_type__name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by reservation unit types
    response = graphql(
        recurring_reservations_query(reservation_unit_type=recurring.reservation_unit.reservation_unit_type.pk),
    )

    # then:
    # - The response contains only the recurring reservation for the given reservation unit type
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__filter__by_reservation_unit_type__multiple(graphql):
    # given:
    # - There are two recurring reservations with different reservation unit types
    # - A superuser is using the system
    recurring_1 = RecurringReservationFactory.create(reservation_unit__reservation_unit_type__name="foo")
    recurring_2 = RecurringReservationFactory.create(reservation_unit__reservation_unit_type__name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to filter recurring reservations by multiple reservation unit types
    response = graphql(
        recurring_reservations_query(
            reservation_unit_type=[
                recurring_1.reservation_unit.reservation_unit_type.pk,
                recurring_2.reservation_unit.reservation_unit_type.pk,
            ]
        ),
    )

    # then:
    # - The response contains only the recurring reservation for the given reservation unit types
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": recurring_1.pk}
    assert response.node(1) == {"pk": recurring_2.pk}


@pytest.mark.parametrize(
    ("field", "order"),
    [
        ("pk", [1, 2, 3]),
        ("-pk", [3, 2, 1]),
        ("name", [2, 3, 1]),
        ("-name", [1, 3, 2]),
        ("reservation_unit_name_fi", [2, 3, 1]),
        ("-reservation_unit_name_fi", [1, 3, 2]),
        ("reservation_unit_name_sv", [2, 3, 1]),
        ("-reservation_unit_name_sv", [1, 3, 2]),
        ("reservation_unit_name_en", [2, 3, 1]),
        ("-reservation_unit_name_en", [1, 3, 2]),
        ("unit_name_fi", [2, 3, 1]),
        ("-unit_name_fi", [1, 3, 2]),
        ("unit_name_sv", [2, 3, 1]),
        ("-unit_name_sv", [1, 3, 2]),
        ("unit_name_en", [2, 3, 1]),
        ("-unit_name_en", [1, 3, 2]),
        ("begin_date", [3, 2, 1]),
        ("-begin_date", [1, 2, 3]),
        ("begin_time", [3, 1, 2]),
        ("-begin_time", [2, 1, 3]),
        ("end_date", [3, 2, 1]),
        ("-end_date", [1, 2, 3]),
        ("end_time", [3, 2, 1]),
        ("-end_time", [1, 2, 3]),
        ("created", [1, 2, 3]),
        ("-created", [3, 2, 1]),
    ],
)
def test_recurring_reservations__order(graphql, field, order):
    # given:
    # - There are three recurring reservations with different names, reservation unit, and units
    # - A superuser is using the system
    recurring = {
        1: RecurringReservationFactory.create(
            name="foo",
            reservation_unit__name_fi="foo",
            reservation_unit__name_sv="foo",
            reservation_unit__name_en="foo",
            reservation_unit__unit__name_fi="foo",
            reservation_unit__unit__name_sv="foo",
            reservation_unit__unit__name_en="foo",
            begin_date=datetime.date(2022, 2, 1),
            begin_time=datetime.time(10, tzinfo=datetime.UTC),
            end_date=datetime.date(2022, 2, 1),
            end_time=datetime.time(18, tzinfo=datetime.UTC),
        ),
        2: RecurringReservationFactory.create(
            name="bar",
            reservation_unit__name_fi="bar",
            reservation_unit__name_sv="bar",
            reservation_unit__name_en="bar",
            reservation_unit__unit__name_fi="bar",
            reservation_unit__unit__name_sv="bar",
            reservation_unit__unit__name_en="bar",
            begin_date=datetime.date(2022, 1, 1),
            begin_time=datetime.time(16, tzinfo=datetime.UTC),
            end_date=datetime.date(2022, 1, 1),
            end_time=datetime.time(17, tzinfo=datetime.UTC),
        ),
        3: RecurringReservationFactory.create(
            name="baz",
            reservation_unit__name_fi="baz",
            reservation_unit__name_sv="baz",
            reservation_unit__name_en="baz",
            reservation_unit__unit__name_fi="baz",
            reservation_unit__unit__name_sv="baz",
            reservation_unit__unit__name_en="baz",
            begin_date=datetime.date(2021, 1, 1),
            begin_time=datetime.time(8, tzinfo=datetime.UTC),
            end_date=datetime.date(2021, 1, 1),
            end_time=datetime.time(10, tzinfo=datetime.UTC),
        ),
    }
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to order recurring reservations by the given field
    response = graphql(recurring_reservations_query(order_by=field))

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    ordering = iter(order)
    assert response.node(0) == {"pk": recurring[next(ordering)].pk}
    assert response.node(1) == {"pk": recurring[next(ordering)].pk}
    assert response.node(2) == {"pk": recurring[next(ordering)].pk}
