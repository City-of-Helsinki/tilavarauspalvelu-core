import pytest

from tests.factories import UnitFactory
from tests.gql_builders import build_mutation
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


UPDATE_MUTATION = build_mutation(
    "updateUnit",
    "UnitUpdateMutationInput",
)


def test_units__query(graphql):
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {"pk": unit.pk, "descriptionFi": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to mutate"
