import pytest

from spaces.models import Space
from tests.helpers import UserType
from tests.test_graphql_api.test_spaces.helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_create_space(graphql):
    # given:
    # - A superuser is using the system
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to create a space
    response = graphql(CREATE_MUTATION, input_data={"nameFi": "foo"})

    # then:
    # - The response has no errors
    # - The space is created in the database
    assert response.has_errors is False, response
    assert Space.objects.count() == 1


def test_create_space__name_fi_is_required(graphql):
    # given:
    # - A superuser is using the system
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to create a space
    response = graphql(CREATE_MUTATION, input_data={"nameSv": "foo"})

    # then:
    # - The response has errors about nameFi field
    # - The space is not created in the database
    assert response.has_errors is True, response
    assert "nameFi" in response.error_message()
    assert Space.objects.count() == 0


@pytest.mark.parametrize("name", ["", " "])
def test_create_space__name_fi_cannot_be_empty(graphql, name):
    # given:
    # - A superuser is using the system
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to create a space
    response = graphql(CREATE_MUTATION, input_data={"nameFi": name})

    # then:
    # - The response has errors about nameFi field
    # - The space is not created in the database
    assert response.has_errors is True, response
    assert response.field_error_messages() == ["nameFi cannot be empty."]
    assert Space.objects.count() == 0
