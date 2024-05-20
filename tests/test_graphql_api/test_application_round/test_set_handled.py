import pytest

from applications.choices import ApplicationRoundStatusChoice
from tests.factories import ApplicationRoundFactory, ReservationUnitFactory, UserFactory, add_unit_permissions

from .helpers import SET_HANDLED_MUTATION, disable_reservation_generation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_celery_synchronous"),
]


def test_application_round__set_handled(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    graphql.login_with_superuser()

    with disable_reservation_generation() as mock:
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert len(mock.method_calls) == 1

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


@pytest.mark.parametrize(
    "status",
    [
        ApplicationRoundStatusChoice.UPCOMING,
        ApplicationRoundStatusChoice.OPEN,
        ApplicationRoundStatusChoice.HANDLED,
        ApplicationRoundStatusChoice.RESULTS_SENT,
    ],
)
def test_application_round__set_handled__wrong_status(graphql, status):
    application_round = ApplicationRoundFactory.create_in_status(status)
    assert application_round.status == status

    graphql.login_with_superuser()

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Application round is not in allocation state."]


def test_application_round__set_handled__general_admin(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


def test_application_round__set_handled__unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()
    application_round = ApplicationRoundFactory.create_in_status_in_allocation(reservation_units=[reservation_unit])
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    unit = reservation_unit.unit
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_handle_applications"])
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


def test_application_round__set_handled__unit_admin__no_perms_to_all_units(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    application_round = ApplicationRoundFactory.create_in_status_in_allocation(
        reservation_units=[reservation_unit_1, reservation_unit_2],
    )
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    unit = reservation_unit_1.unit
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_handle_applications"])
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.error_message() == "No permission to update."


def test_application_round__set_handled__unit_admin__has_perms_to_all_units(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    application_round = ApplicationRoundFactory.create_in_status_in_allocation(
        reservation_units=[reservation_unit_1, reservation_unit_2],
    )
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    admin = UserFactory.create()
    add_unit_permissions(admin, unit=reservation_unit_1.unit, perms=["can_handle_applications"])
    add_unit_permissions(admin, unit=reservation_unit_2.unit, perms=["can_handle_applications"])
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED