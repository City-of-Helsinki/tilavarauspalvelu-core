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
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"pk": unit.pk, "descriptionFi": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    unit.refresh_from_db()
    assert unit.description_fi == "foo"
