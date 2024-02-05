import pytest

from tests.factories import UnitFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_hauki_export"),
]


@pytest.mark.parametrize(
    ("user_type", "expected_errors"),
    [
        (UserType.ANONYMOUS, True),
        (UserType.REGULAR, True),
        (UserType.STAFF, False),
        (UserType.SUPERUSER, False),
    ],
)
def test_reservation_unit__create__draft__permissions(graphql, user_type, expected_errors):
    # given:
    # - There is a unit in the system
    # - The given user is using the system
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(user_type)

    data = {
        "isDraft": True,
        "nameFi": "foo",
        "unitPk": unit.pk,
    }

    # when:
    # - The user tries to create a new reservation unit with timeslots
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about missing permissions
    assert response.has_errors is expected_errors, response
    if expected_errors:
        assert response.error_message() == "No permission to mutate"
