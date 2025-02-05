from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ApplicationStatusChoice

from tests.factories import ApplicationFactory, ApplicationRoundFactory, ReservationUnitFactory, UserFactory
from tests.factories.application import ApplicationBuilder

from .helpers import SET_HANDLED_MUTATION, disable_reservation_generation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_round__set_handled(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    ApplicationFactory.create_in_status_handled(application_round=application_round)

    graphql.login_with_superuser()

    with disable_reservation_generation() as mock_disable_reservation_generation:
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert len(mock_disable_reservation_generation.method_calls) == 1

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
    assert response.field_error_messages() == ["Application round is not in allocation status."]


def test_application_round__set_handled__general_admin(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    admin = UserFactory.create_with_general_role()
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
    admin = UserFactory.create_with_unit_role(units=[unit])
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
    admin = UserFactory.create_with_unit_role(units=[unit])
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

    admin = UserFactory.create_with_unit_role(units=[reservation_unit_1.unit, reservation_unit_2.unit])
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


@pytest.mark.parametrize(
    ("application_status", "raises_error"),
    [
        # ApplicationStatusChoice.DRAFT is an impossible status when  ApplicationRound status is not UPCOMING or OPEN
        # ApplicationStatusChoice.RECEIVED is an impossible status if ApplicationRound status is IN_ALLOCATION
        (ApplicationStatusChoice.IN_ALLOCATION, True),
        (ApplicationStatusChoice.HANDLED, False),
        # ApplicationStatusChoice.RESULTS_SENT is an impossible status if ApplicationRound status is IN_ALLOCATION
        (ApplicationStatusChoice.EXPIRED, False),
        (ApplicationStatusChoice.CANCELLED, False),
    ],
)
def test_application_round__set_handled__error__has_applications_in_status(graphql, application_status, raises_error):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    application = ApplicationBuilder().with_status(application_status).in_application_round(application_round).create()
    assert application.status == application_status

    graphql.login_with_superuser()

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    if raises_error:
        assert response.has_errors is True, response.errors
        assert response.error_message() == "Mutation was unsuccessful."
        assert response.field_error_messages() == ["Application round has applications still in allocation."]
    else:
        assert response.has_errors is False, response.errors
        application_round.refresh_from_db()
        assert application_round.status == ApplicationRoundStatusChoice.HANDLED
