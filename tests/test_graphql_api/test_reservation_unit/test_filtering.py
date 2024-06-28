import datetime

import pytest

from common.date_utils import local_datetime
from reservation_units.enums import ReservationKind, ReservationState, ReservationUnitState
from tests.factories import (
    ApplicationRoundFactory,
    EquipmentFactory,
    KeywordGroupFactory,
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
    UnitFactory,
    UserFactory,
)

from .helpers import (
    create_reservation_units_for_reservation_state_filtering,
    create_reservation_units_for_reservation_unit_state_filtering,
    reservation_units_query,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__filter__by_pk(graphql):
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    query = reservation_units_query(pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_pk__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    query = reservation_units_query(pk=[reservation_unit_1.pk, reservation_unit_2.pk])
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}


def test_reservation_unit__filter__by_tprek_id(graphql):
    reservation_unit = ReservationUnitFactory.create(unit__tprek_id="foo")
    ReservationUnitFactory.create(unit__tprek_id="bar")

    query = reservation_units_query(tprek_id=reservation_unit.unit.tprek_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_tprek_department_id(graphql):
    reservation_unit = ReservationUnitFactory.create(unit__tprek_department_id="foo")
    ReservationUnitFactory.create(unit__tprek_department_id="bar")

    query = reservation_units_query(tprek_department_id=reservation_unit.unit.tprek_department_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_equipment(graphql):
    # given:
    # - There are two reservation units with different equipments
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])

    # when:
    # - The user requests reservation units with a specific equipment
    query = reservation_units_query(fields="nameFi", equipments=[equipment_1.pk])
    response = graphql(query)

    # then:
    # - The response contains only the expected reservation unit
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"nameFi": "fizz"}


def test_reservation_unit__filter__by_equipment__multiple(graphql):
    # given:
    # - There are two reservation units with different equipments, and one with both
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])
    ReservationUnitFactory.create(name="1", equipments=[equipment_1, equipment_2])

    # when:
    # - The user requests reservation units with a multiple equipments
    query = reservation_units_query(fields="nameFi", equipments=[equipment_1.pk, equipment_2.pk])
    response = graphql(query)

    # then:
    # - The response contains only the reservation unit with all equipments
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"nameFi": "1"}


def test_reservation_unit__filter__by_equipment__multiple__none_match(graphql):
    # given:
    # - There are two reservation units with different equipments
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])

    # when:
    # - The user requests reservation units with a multiple equipments
    query = reservation_units_query(fields="nameFi", equipments=[equipment_1.pk, equipment_2.pk])
    response = graphql(query)

    # then:
    # - The response does not contain any reservation units
    assert response.has_errors is False, response
    assert len(response.edges) == 0, response


def test_reservation_unit__filtering__by_unit(graphql):
    reservation_unit = ReservationUnitFactory.create(unit=UnitFactory.create())
    ReservationUnitFactory.create(unit=UnitFactory.create())

    query = reservation_units_query(unit=reservation_unit.unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_unit__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(unit=UnitFactory.create())
    reservation_unit_2 = ReservationUnitFactory.create(unit=UnitFactory.create())
    ReservationUnitFactory.create(unit=UnitFactory.create())

    query = reservation_units_query(unit=[reservation_unit_1.unit.pk, reservation_unit_2.unit.pk])
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}


def test_reservation_unit__filter__by_application_round__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation_unit_3 = ReservationUnitFactory.create()

    application_round_1 = ApplicationRoundFactory.create(reservation_units=[reservation_unit_1])
    application_round_2 = ApplicationRoundFactory.create(reservation_units=[reservation_unit_2])
    ApplicationRoundFactory.create(reservation_units=[reservation_unit_3])

    query = reservation_units_query(applicationRound=[application_round_1.pk, application_round_2.pk])
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}


def test_reservation_unit__filter__by_reservation_unit_type(graphql):
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    query = reservation_units_query(reservationUnitType=reservation_unit.reservation_unit_type.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_reservation_unit_type__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    query = reservation_units_query(
        reservationUnitType=[
            reservation_unit_1.reservation_unit_type.pk,
            reservation_unit_2.reservation_unit_type.pk,
        ]
    )
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}


def test_reservation_unit__filter__by_purpose(graphql):
    reservation_unit = ReservationUnitFactory.create(purposes__name="foo")
    ReservationUnitFactory.create(purposes__name="bar")

    query = reservation_units_query(purposes=reservation_unit.purposes.first().pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_multiple_purposes(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(purposes__name="foo")
    reservation_unit_2 = ReservationUnitFactory.create(purposes__name="bar")
    ReservationUnitFactory.create(purposes__name="baz")

    query = reservation_units_query(
        purposes=[
            reservation_unit_1.purposes.first().pk,
            reservation_unit_2.purposes.first().pk,
        ]
    )
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}


def test_reservation_unit__filter__by_qualifier(graphql):
    reservation_unit = ReservationUnitFactory.create(qualifiers__name="foo")
    ReservationUnitFactory.create(qualifiers__name="bar")

    query = reservation_units_query(qualifiers=reservation_unit.qualifiers.first().pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_qualifiers__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(qualifiers__name="foo")
    reservation_unit_2 = ReservationUnitFactory.create(qualifiers__name="bar")
    ReservationUnitFactory.create(qualifiers__name="baz")

    query = reservation_units_query(
        qualifiers=[
            reservation_unit_1.qualifiers.first().pk,
            reservation_unit_2.qualifiers.first().pk,
        ]
    )
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}


def test_reservation_unit__filter__by_max_persons_gte(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(max_persons=None)
    reservation_unit_2 = ReservationUnitFactory.create(max_persons=201)
    reservation_unit_3 = ReservationUnitFactory.create(max_persons=200)
    ReservationUnitFactory.create(max_persons=199)

    query = reservation_units_query(maxPersonsGte=200)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}
    assert response.node(2) == {"pk": reservation_unit_3.pk}


def test_reservation_unit__filter__by_max_persons_lte(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(max_persons=None)
    ReservationUnitFactory.create(max_persons=201)
    reservation_unit_2 = ReservationUnitFactory.create(max_persons=200)
    reservation_unit_3 = ReservationUnitFactory.create(max_persons=199)

    query = reservation_units_query(maxPersonsLte=200)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}
    assert response.node(2) == {"pk": reservation_unit_3.pk}


def test_reservation_unit__filter__by_min_persons_gte(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(min_persons=None)
    reservation_unit_2 = ReservationUnitFactory.create(min_persons=201)
    reservation_unit_3 = ReservationUnitFactory.create(min_persons=200)
    ReservationUnitFactory.create(min_persons=199)

    query = reservation_units_query(minPersonsGte=200)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}
    assert response.node(2) == {"pk": reservation_unit_3.pk}


def test_reservation_unit__filter__by_min_persons_lte(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(min_persons=None)
    ReservationUnitFactory.create(min_persons=201)
    reservation_unit_2 = ReservationUnitFactory.create(min_persons=200)
    reservation_unit_3 = ReservationUnitFactory.create(min_persons=199)

    query = reservation_units_query(minPersonsLte=200)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}
    assert response.node(2) == {"pk": reservation_unit_3.pk}


def test_reservation_unit__filter__by_keyword_group(graphql):
    keyword_group_1 = KeywordGroupFactory.create()
    keyword_group_2 = KeywordGroupFactory.create()
    reservation_unit = ReservationUnitFactory.create(keyword_groups=[keyword_group_1])
    ReservationUnitFactory.create(keyword_groups=[keyword_group_2])

    query = reservation_units_query(keywordGroups=keyword_group_1.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_multiple_keyword_groups(graphql):
    keyword_group_1 = KeywordGroupFactory.create()
    keyword_group_2 = KeywordGroupFactory.create()
    keyword_group_3 = KeywordGroupFactory.create()
    reservation_unit_1 = ReservationUnitFactory.create(keyword_groups=[keyword_group_1])
    reservation_unit_2 = ReservationUnitFactory.create(keyword_groups=[keyword_group_2])
    ReservationUnitFactory.create(keyword_groups=[keyword_group_3])

    query = reservation_units_query(keywordGroups=[keyword_group_1.pk, keyword_group_2.pk])
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}


def test_reservation_unit__filter__by_name_fi(graphql):
    reservation_unit = ReservationUnitFactory.create(name_fi="foo")
    ReservationUnitFactory.create(name_fi="bar")

    query = reservation_units_query(nameFi="foo")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_surface_area(graphql):
    ReservationUnitFactory.create(surface_area=121)
    reservation_unit_1 = ReservationUnitFactory.create(surface_area=120)
    reservation_unit_2 = ReservationUnitFactory.create(surface_area=90)
    reservation_unit_3 = ReservationUnitFactory.create(surface_area=60)
    ReservationUnitFactory.create(surface_area=59)

    query = reservation_units_query(surfaceAreaGte=60, surfaceAreaLte=120)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}
    assert response.node(2) == {"pk": reservation_unit_3.pk}


def test_reservation_unit__filter__by_rank(graphql):
    ReservationUnitFactory.create(rank=1)
    reservation_unit_1 = ReservationUnitFactory.create(rank=2)
    reservation_unit_2 = ReservationUnitFactory.create(rank=3)
    reservation_unit_3 = ReservationUnitFactory.create(rank=4)
    ReservationUnitFactory.create(rank=5)

    query = reservation_units_query(rankGte=2, rankLte=4)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}
    assert response.node(2) == {"pk": reservation_unit_3.pk}


def test_reservation_unit__filter__by_reservation_unit_type_rank(graphql):
    type_1 = ReservationUnitTypeFactory(rank=1)
    type_2 = ReservationUnitTypeFactory(rank=2)
    type_3 = ReservationUnitTypeFactory(rank=3)
    type_4 = ReservationUnitTypeFactory(rank=4)
    type_5 = ReservationUnitTypeFactory(rank=5)

    ReservationUnitFactory.create(reservation_unit_type=type_1)
    reservation_unit_1 = ReservationUnitFactory.create(reservation_unit_type=type_2)
    reservation_unit_2 = ReservationUnitFactory.create(reservation_unit_type=type_3)
    reservation_unit_3 = ReservationUnitFactory.create(reservation_unit_type=type_4)
    ReservationUnitFactory.create(reservation_unit_type=type_5)

    query = reservation_units_query(typeRankGte=2, typeRankLte=4)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}
    assert response.node(2) == {"pk": reservation_unit_3.pk}


def test_reservation_unit__filter__application_rounds__by_active(graphql):
    reservation_unit = ReservationUnitFactory.create()

    application_round = ApplicationRoundFactory.create_in_status_open(reservation_units=[reservation_unit])
    ApplicationRoundFactory.create_in_status_in_allocation(reservation_units=[reservation_unit])

    query = reservation_units_query(
        fields="applicationRounds { pk }",
        application_rounds__active=True,
    )
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "applicationRounds": [
            {"pk": application_round.pk},
        ],
    }


def test_reservation_unit__filter__by_is_draft(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    ReservationUnitFactory.create(is_draft=False)

    query = reservation_units_query(is_draft=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


def test_reservation_unit__filter__by_is_visible(graphql):
    now = local_datetime()

    # No publish times -> VISIBLE
    reservation_unit_1 = ReservationUnitFactory.create(
        publish_begins=None,
        publish_ends=None,
    )

    # Publish begins before today -> VISIBLE
    reservation_unit_2 = ReservationUnitFactory.create(
        publish_begins=now - datetime.timedelta(days=5),
        publish_ends=now + datetime.timedelta(days=10),
    )

    # Publish begins after today -> NOT VISIBLE
    reservation_unit_3 = ReservationUnitFactory.create(
        publish_begins=now + datetime.timedelta(days=5),
        publish_ends=now + datetime.timedelta(days=10),
    )

    # Publish begins before today, ends null -> VISIBLE
    reservation_unit_4 = ReservationUnitFactory.create(
        publish_begins=now - datetime.timedelta(days=5),
        publish_ends=None,
    )

    # Publish begins null, ends after today -> VISIBLE
    reservation_unit_5 = ReservationUnitFactory.create(
        publish_begins=None,
        publish_ends=now + datetime.timedelta(days=5),
    )

    # Publish begins null, ends before today -> NOT VISIBLE
    reservation_unit_6 = ReservationUnitFactory.create(
        publish_begins=None,
        publish_ends=now - datetime.timedelta(days=1),
    )

    # Archived -> NEVER SHOWN
    ReservationUnitFactory.create(
        publish_begins=now - datetime.timedelta(days=5),
        publish_ends=now + datetime.timedelta(days=10),
        is_archived=True,
    )

    query = reservation_units_query(isVisible=True)
    response = graphql(query)

    assert len(response.edges) == 4
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}
    assert response.node(2) == {"pk": reservation_unit_4.pk}
    assert response.node(3) == {"pk": reservation_unit_5.pk}

    query = reservation_units_query(isVisible=False)
    response = graphql(query)

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_3.pk}
    assert response.node(1) == {"pk": reservation_unit_6.pk}


@pytest.mark.parametrize(
    ("kind", "units"),
    [
        (ReservationKind.DIRECT.value, [1, 3]),
        (ReservationKind.SEASON.value, [2, 3]),
        (ReservationKind.DIRECT_AND_SEASON.value, [3]),
    ],
    ids=[
        ReservationKind.DIRECT.value,
        ReservationKind.SEASON.value,
        ReservationKind.DIRECT_AND_SEASON.value,
    ],
)
def test_reservation_unit__filter__by_reservation_kind(graphql, kind, units):
    reservation_units = {
        1: ReservationUnitFactory.create(reservation_kind=ReservationKind.DIRECT),
        2: ReservationUnitFactory.create(reservation_kind=ReservationKind.SEASON),
        3: ReservationUnitFactory.create(reservation_kind=ReservationKind.DIRECT_AND_SEASON),
    }

    query = reservation_units_query(reservationKind=kind)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == len(units)

    for i, unit in enumerate(units):
        assert response.node(i) == {"pk": reservation_units[unit].pk}


def test_reservation_unit__filter__only_with_permission__general_admin(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    user = UserFactory.create_with_general_permissions(
        perms=["can_manage_reservations"],
    )
    graphql.force_login(user)

    query = reservation_units_query(onlyWithPermission=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}


def test_reservation_unit__filter__only_with_permission__unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitFactory.create()

    user = UserFactory.create_with_unit_permissions(
        unit=reservation_unit.unit,
        perms=["can_manage_reservations"],
    )
    graphql.force_login(user)

    query = reservation_units_query(onlyWithPermission=True)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_unit.pk}


# Reservation state


def test_reservation_unit__filter__by_reservation_state__reservable(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.RESERVABLE)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": reservation_units.reservable_paid.pk}
    assert response.node(1) == {"pk": reservation_units.reservable_free.pk}


def test_reservation_unit__filter__by_reservation_state__scheduled_reservation(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.SCHEDULED_RESERVATION)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_units.scheduled_reservation.pk}


def test_reservation_unit__filter__by_reservation_state__scheduled_period(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.SCHEDULED_PERIOD)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_units.scheduled_period.pk}


def test_reservation_unit__filter__by_reservation_state__scheduled_closing(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.SCHEDULED_CLOSING)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_units.scheduled_closing.pk}


def test_reservation_unit__filter__by_reservation_state__reservation_closed(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.RESERVATION_CLOSED)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {"pk": reservation_units.closed.pk}
    assert response.node(1) == {"pk": reservation_units.missing_pricing.pk}
    assert response.node(2) == {"pk": reservation_units.missing_payment_product.pk}


def test_reservation_unit__filter__by_reservation_state__multiple(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(
        reservation_state=[ReservationState.SCHEDULED_RESERVATION, ReservationState.RESERVABLE],
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {"pk": reservation_units.scheduled_reservation.pk}
    assert response.node(1) == {"pk": reservation_units.reservable_paid.pk}
    assert response.node(2) == {"pk": reservation_units.reservable_free.pk}


# Reservation unit state


def test_reservation_unit__filter__by_reservation_unit_state__archived(graphql):
    graphql.login_with_superuser()

    create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.ARCHIVED)
    response = graphql(query)

    # Archived reservation units are always hidden
    assert response.has_errors is False
    assert len(response.edges) == 0


def test_reservation_unit__filter__by_reservation_unit_state__draft(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.DRAFT)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.draft.pk}


def test_reservation_unit__filter__by_reservation_unit_state__scheduled_publishing(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.SCHEDULED_PUBLISHING)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.scheduled_publishing.pk}


def test_reservation_unit__filter__by_reservation_unit_state__published(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.PUBLISHED)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.published.pk}


def test_reservation_unit__filter__by_reservation_unit_state__scheduled_period(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.SCHEDULED_PERIOD)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.scheduled_period.pk}


def test_reservation_unit__filter__by_reservation_unit_state__scheduled_hiding(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.SCHEDULED_HIDING)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.scheduled_hiding.pk}


def test_reservation_unit__filter__by_reservation_unit_state__hidden(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.HIDDEN)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.hidden.pk}


def test_reservation_unit__filter__by_reservation_unit_state__multiple(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(
        state=[
            ReservationUnitState.DRAFT,
            ReservationUnitState.SCHEDULED_PUBLISHING,
        ],
    )
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_units.draft.pk}
    assert response.node(1) == {"pk": reservation_units.scheduled_publishing.pk}


def test_reservation_unit__filter__by_reservation_unit_state__scheduled_publishing__when_begin_after_end(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    now = local_datetime()
    reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=(now + datetime.timedelta(days=2)),
        publish_ends=(now + datetime.timedelta(days=1)),
    )

    query = reservation_units_query(state=ReservationUnitState.SCHEDULED_PUBLISHING)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_units.scheduled_publishing.pk}
    assert response.node(1) == {"pk": reservation_unit.pk}
