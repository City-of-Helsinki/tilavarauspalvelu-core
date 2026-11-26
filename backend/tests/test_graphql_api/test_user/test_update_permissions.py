from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import Language

from tests.factories import UserFactory

from .helpers import UPDATE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__update__language__superuser(graphql: GraphQLClient) -> None:
    user = UserFactory.create_superuser(preferred_language=Language.EN.value)

    data = {
        "preferredLanguage": Language.FI.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.preferred_language == Language.FI.value


def test_user__update__language__regular_user(graphql: GraphQLClient) -> None:
    user = UserFactory.create(preferred_language=Language.EN.value)

    data = {
        "preferredLanguage": Language.FI.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.preferred_language == Language.FI.value


def test_user__update__language__admin(graphql: GraphQLClient) -> None:
    user = UserFactory.create_with_general_role(preferred_language=Language.EN.value)

    data = {
        "preferredLanguage": Language.FI.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.preferred_language == Language.FI.value
