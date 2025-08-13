from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import ReservationUnitFactory, UserFactory

from .helpers import UPDATE_MUTATION, get_update_draft_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__update__anonymous_user(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - An anonymous user is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_update_draft_input_data(reservation_unit)

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains errors about missing permissions
    assert response.error_message(0) == "No permission to update a reservation unit"


def test_reservation_unit__update__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_update_draft_input_data(reservation_unit)

    graphql.login_with_regular_user()
    response = graphql(UPDATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to update a reservation unit"


def test_reservation_unit__update__staff_user(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - The given user is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_update_draft_input_data(reservation_unit)

    user = UserFactory.create_with_general_role(role=UserRoleChoice.VIEWER)
    graphql.force_login(user)

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, variables={"input": data})

    # then:
    # - The response contains errors about missing permissions
    assert response.error_message(0) == "No permission to update a reservation unit"


def test_reservation_unit__update__regular_user__with_timeslots(graphql):
    # given:
    # - There is a draft reservation unit with no timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_update_draft_input_data(reservation_unit)
    graphql.login_with_superuser()

    # when:
    # - The user tries to update a reservation unit with new timeslots
    response = graphql(UPDATE_MUTATION, variables={"input": data})

    # then:
    # - The response has no errors
    assert response.has_errors is False, response
