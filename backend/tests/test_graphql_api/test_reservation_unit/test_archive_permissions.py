import pytest

from tests.factories import ReservationUnitFactory, SpaceFactory, UnitFactory, UserFactory

from .helpers import ARCHIVE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__archive__general_admin(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.has_errors is False, response


def test_reservation_unit__archive__unit_admin(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.has_errors is False, response


def test_reservation_unit__archive__unit_admin__different_unit(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])

    unit = UnitFactory.create()

    user = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(user)

    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.error_message(0) == "No permission to archive this reservation unit"


def test_reservation_unit__archive__regular_user(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])

    graphql.login_with_regular_user()

    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.error_message(0) == "No permission to archive this reservation unit"


def test_reservation_unit__archive__anonymous_user(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(is_draft=False, spaces=[space])

    data = {"pk": reservation_unit.pk}

    response = graphql(ARCHIVE_MUTATION, variables={"input": data})
    assert response.error_message(0) == "No permission to archive this reservation unit"
