import pytest
from django.utils import timezone

from merchants.models import OrderStatus
from reservations.choices import ReservationStateChoice, ReservationTypeChoice
from tests.factories import (
    PaymentOrderFactory,
    RecurringReservationFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ServiceSectorFactory,
    UnitFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.helpers import UserType
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
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit], type=ReservationTypeChoice.NORMAL)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter reservations by said type
    response = graphql(reservations_query(reservation_type=ReservationTypeChoice.NORMAL.value))

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
    reservation_1 = ReservationFactory.create(reservation_unit=[reservation_unit], type=ReservationTypeChoice.NORMAL)
    reservation_2 = ReservationFactory.create(reservation_unit=[reservation_unit], type=ReservationTypeChoice.STAFF)
    ReservationFactory.create(reservation_unit=[reservation_unit], type=ReservationTypeChoice.BEHALF)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter reservations by some of those states
    response = graphql(
        reservations_query(
            reservation_type=[
                ReservationTypeChoice.NORMAL.value,
                ReservationTypeChoice.STAFF.value,
            ]
        )
    )

    # then:
    # - The reservation is returned without errors, and contains those in the selected states
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_state(graphql):
    reservation = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING)
    ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(state=reservation.state.value.upper())
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_state__multiple(graphql):
    reservation_1 = ReservationFactory.create(state=ReservationStateChoice.REQUIRES_HANDLING)
    reservation_2 = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(state=[reservation_1.state.value.upper(), reservation_2.state.value.upper()])
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

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(order_status=payment_order_1.status.value.upper())
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_1.pk}


def test_reservation__filter__by_order_status__multiple(graphql):
    reservation_1 = ReservationFactory.create()
    payment_order_1 = PaymentOrderFactory.create(reservation=reservation_1, status=OrderStatus.PAID)
    reservation_2 = ReservationFactory.create()
    payment_order_2 = PaymentOrderFactory.create(reservation=reservation_2, status=OrderStatus.REFUNDED)

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(
        order_status=[payment_order_1.status.value.upper(), payment_order_2.status.value.upper()],
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

    graphql.login_user_based_on_type(UserType.SUPERUSER)
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

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(requested=False)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_3.pk}


def test_reservation__filter__by_only_with_permission__regular_user(graphql):
    user = graphql.login_user_based_on_type(UserType.REGULAR)

    reservation = ReservationFactory.create(user=user)
    ReservationFactory.create()

    query = reservations_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_only_with_permission__unit_admin(graphql):
    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_view_reservations"])
    reservation_1 = ReservationFactory.create(user=admin)
    reservation_2 = ReservationFactory.create(reservation_unit=[reservation_unit])
    ReservationFactory.create()

    graphql.force_login(admin)
    query = reservations_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_only_with_permission__unit_group_admin(graphql):
    unit_group = UnitGroupFactory.create()
    unit = UnitFactory.create(unit_groups=[unit_group])
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    admin = UserFactory.create_with_unit_group_permissions(unit_group=unit_group, perms=["can_view_reservations"])
    reservation_1 = ReservationFactory.create(user=admin)
    reservation_2 = ReservationFactory.create(reservation_unit=[reservation_unit])
    ReservationFactory.create()

    graphql.force_login(admin)
    query = reservations_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_only_with_permission__service_sector_admin(graphql):
    sector = ServiceSectorFactory.create()
    unit = UnitFactory.create(service_sectors=[sector])
    reservation_unit = ReservationUnitFactory.create(unit=unit)
    admin = UserFactory.create_with_service_sector_permissions(service_sector=sector, perms=["can_view_reservations"])
    reservation_1 = ReservationFactory.create(user=admin)
    reservation_2 = ReservationFactory.create(reservation_unit=[reservation_unit])
    ReservationFactory.create()

    graphql.force_login(admin)
    query = reservations_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_user(graphql):
    reservation = ReservationFactory.create()
    ReservationFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)
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
        reservation_unit__name_fi="koirankoppi",
        reservation_unit__name_en="doghouse",
        reservation_unit__name_sv="hundkoja",
    )

    graphql.login_user_based_on_type(UserType.SUPERUSER)
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
        reservation_unit__name_fi="koirankoppi",
        reservation_unit__name_en="doghouse",
        reservation_unit__name_sv="hundkoja",
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit__name_fi="norsutarha",
        reservation_unit__name_en="elephant park",
        reservation_unit__name_sv="elefantparken",
    )

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(**{field: search})
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_unit(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])
    ReservationFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(unit=reservation_unit.unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_unit__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation_1 = ReservationFactory.create(reservation_unit=[reservation_unit_1])
    reservation_2 = ReservationFactory.create(reservation_unit=[reservation_unit_2])

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(unit=[reservation_unit_1.unit.pk, reservation_unit_2.unit.pk])
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_price_lte(graphql):
    reservation = ReservationFactory.create(price=30)
    ReservationFactory.create(price=50)

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(price_lte=30)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_price_gte(graphql):
    reservation = ReservationFactory.create(price=50)
    ReservationFactory.create(price=20)

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(price_gte=30)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_recurring_reservation(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        recurring_reservation=recurring_reservation,
        reservation_unit=[recurring_reservation.reservation_unit],
    )

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(recurring_reservation=recurring_reservation.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_reservation_unit(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(reservation_unit=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_reservation_unit__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation_1 = ReservationFactory.create(reservation_unit=[reservation_unit_1])
    reservation_2 = ReservationFactory.create(reservation_unit=[reservation_unit_2])

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(reservation_unit=[reservation_unit_1.pk, reservation_unit_2.pk])
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}


def test_reservation__filter__by_reservation_unit_type(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(reservation_unit_type=reservation_unit.reservation_unit_type.pk)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_reservation_unit_type__multiple(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation_1 = ReservationFactory.create(reservation_unit=[reservation_unit_1])
    reservation_2 = ReservationFactory.create(reservation_unit=[reservation_unit_2])

    graphql.login_user_based_on_type(UserType.SUPERUSER)
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
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=str(reservation.pk))
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__name(graphql):
    reservation = ReservationFactory.create(name="foo")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_id(graphql):
    reservation = ReservationFactory.create(reservee_id="foo")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.reservee_id)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_email(graphql):
    reservation = ReservationFactory.create(reservee_email="foo@email.com")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.reservee_email)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_first_name(graphql):
    reservation = ReservationFactory.create(reservee_first_name="foo")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.reservee_first_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_last_name(graphql):
    reservation = ReservationFactory.create(reservee_last_name="foo")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.reservee_last_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__reservee_organisation_name(graphql):
    reservation = ReservationFactory.create(reservee_organisation_name="foo")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.reservee_organisation_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__user_email(graphql):
    reservation = ReservationFactory.create(user__email="foo@email.com")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.user.email)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__user_first_name(graphql):
    reservation = ReservationFactory.create(user__first_name="foo")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.user.first_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__user_last_name(graphql):
    reservation = ReservationFactory.create(user__last_name="foo")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=reservation.user.last_name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__recurring_reservation_name(graphql):
    reservation = ReservationFactory.create()
    recurring_reservation = RecurringReservationFactory.create(reservations=[reservation], name="foo")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search=recurring_reservation.name)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation.pk}


def test_reservation__filter__by_text_search__email_pattern(graphql):
    reservation_1 = ReservationFactory.create(reservee_email="foo@email.com")
    reservation_2 = ReservationFactory.create(user__email="bar@email.com")

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = reservations_query(text_search="@email.com")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
