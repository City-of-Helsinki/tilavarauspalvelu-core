import pytest

from tests.factories import ReservationFactory, ReservationUnitFactory, UserFactory

from .helpers import UPDATE_WORKING_MEMO_MUTATION, get_working_memo_update_data

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__update__working_memo__general_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    admin = UserFactory.create_with_general_permissions(perms=["can_manage_reservations"])

    graphql.force_login(admin)
    data = get_working_memo_update_data(reservation)
    response = graphql(UPDATE_WORKING_MEMO_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.working_memo == data["workingMemo"]


def test_reservation__update__working_memo__general_commenter(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    admin = UserFactory.create_with_general_permissions(perms=["can_comment_reservations"])

    graphql.force_login(admin)
    data = get_working_memo_update_data(reservation)
    response = graphql(UPDATE_WORKING_MEMO_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.working_memo == data["workingMemo"]


def test_reservation__update__working_memo__unit_commenter(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    admin = UserFactory.create_with_unit_permissions(
        unit=reservation_unit.unit,
        perms=["can_comment_reservations"],
    )

    graphql.force_login(admin)
    data = get_working_memo_update_data(reservation)
    response = graphql(UPDATE_WORKING_MEMO_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.working_memo == data["workingMemo"]


def test_reservation__update__working_memo__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    graphql.login_with_regular_user()
    data = get_working_memo_update_data(reservation)
    response = graphql(UPDATE_WORKING_MEMO_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."

    reservation.refresh_from_db()
    assert reservation.working_memo == ""


def test_reservation__update__working_memo__staff_and_own_reservation(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_general_permissions(perms=["can_manage_purposes"])

    reservation = ReservationFactory.create(reservation_unit=[reservation_unit], user=admin)

    graphql.force_login(admin)
    data = get_working_memo_update_data(reservation)
    response = graphql(UPDATE_WORKING_MEMO_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.working_memo == data["workingMemo"]


def test_reservation__update__working_memo__reserver_staff_user_and_not_own_reservation(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_general_permissions(perms=["can_manage_purposes"])

    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    graphql.force_login(admin)
    data = get_working_memo_update_data(reservation)
    response = graphql(UPDATE_WORKING_MEMO_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."

    reservation.refresh_from_db()
    assert reservation.working_memo == ""
