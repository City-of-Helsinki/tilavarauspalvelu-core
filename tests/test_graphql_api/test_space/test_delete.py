import pytest

from applications.enums import ApplicationRoundStatusChoice
from tests.factories import ApplicationRoundFactory, SpaceFactory
from tilavarauspalvelu.models import Space

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_delete_space(graphql):
    # given:
    # - There is a space
    # - A superuser is using the system
    space = SpaceFactory.create()
    graphql.login_with_superuser()
    pk = space.pk

    # when:
    # - User tries to delete the space
    response = graphql(DELETE_MUTATION, input_data={"pk": pk})

    # then:
    # - Response contains no errors
    # - Response implies the space was deleted
    # - Space is not found in the database
    assert response.has_errors is False, response
    assert response.first_query_object["deleted"] is True
    assert Space.objects.filter(pk=pk).exists() is False


@pytest.mark.parametrize(
    "status",
    [
        ApplicationRoundStatusChoice.UPCOMING,
        ApplicationRoundStatusChoice.OPEN,
        ApplicationRoundStatusChoice.IN_ALLOCATION,
        ApplicationRoundStatusChoice.HANDLED,
    ],
)
def test_space_not_deleted_because_in_active_application_round(graphql, status):
    # given:
    # - There is a space
    # - The space is in an active (not sent) application round
    # - A superuser is using the system
    space = SpaceFactory.create()
    ApplicationRoundFactory.create_in_status(status=status, reservation_units__spaces=[space])
    graphql.login_with_superuser()
    pk = space.pk

    # when:
    # - User tries to delete the space
    response = graphql(DELETE_MUTATION, input_data={"pk": pk})

    # then:
    # - Response contains no errors
    # - The space is still in the database
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Space occurs in active application round."]
    assert Space.objects.filter(pk=pk).exists() is True
