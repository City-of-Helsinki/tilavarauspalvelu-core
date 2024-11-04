import pytest

from tests.factories import UserFactory
from tilavarauspalvelu.enums import Language

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__update__language(graphql):
    user = UserFactory.create_superuser(preferred_language=Language.EN.value)

    data = {
        "preferredLanguage": Language.FI.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert response.first_query_object["pk"] == user.pk

    user.refresh_from_db()
    assert user.preferred_language == Language.FI.value


def test_user__update__language_not_available(graphql):
    user = UserFactory.create_superuser(preferred_language=Language.EN.value)

    data = {
        "preferredLanguage": "UK",
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_schema_errors is True, response


def test_user__update__pk_user_not_an_input(graphql):
    user = UserFactory.create_superuser(preferred_language=Language.EN.value)
    other_user = UserFactory.create_superuser(preferred_language=Language.EN.value)

    data = {
        "pk": other_user.pk,
        "preferredLanguage": Language.FI.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_schema_errors
