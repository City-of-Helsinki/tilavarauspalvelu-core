import pytest
from graphene_django_extensions.testing import build_mutation

from tests.factories import UnitFactory
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


UPDATE_MUTATION = build_mutation("updateUnit", "UnitUpdateMutation")


def test_units__update__regular_user(graphql):
    unit = UnitFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {"pk": unit.pk, "descriptionFi": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
