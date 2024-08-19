import pytest

from spaces.models import Space

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_create_space(graphql):
    # given:
    # - A superuser is using the system
    graphql.login_with_superuser()

    # when:
    # - User tries to create a space
    response = graphql(CREATE_MUTATION, input_data={"name": "foo"})

    # then:
    # - The response has no errors
    # - The space is created in the database
    assert response.has_errors is False, response
    assert Space.objects.count() == 1


def test_create_space__name_is_required(graphql):
    # given:
    # - A superuser is using the system
    graphql.login_with_superuser()

    # when:
    # - User tries to create a space
    response = graphql(CREATE_MUTATION, input_data={"nameSv": "foo"})

    # then:
    # - The response has errors about name field
    # - The space is not created in the database
    assert response.error_message().startswith("Variable '$input'")
    assert Space.objects.count() == 0


@pytest.mark.parametrize("value", ["", " "])
def test_create_space__name_cannot_be_empty(graphql, value):
    # given:
    # - A superuser is using the system
    graphql.login_with_superuser()

    # when:
    # - User tries to create a space
    response = graphql(CREATE_MUTATION, input_data={"name": value})

    # then:
    # - The response has errors about nameFi field
    # - The space is not created in the database
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("name") == ["This field may not be blank."]
    assert Space.objects.count() == 0
