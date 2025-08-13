from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import BannerNotificationFactory, UserFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_banner_notification__update__anonymous_user(graphql):
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")

    input_data = {
        "pk": notification.pk,
        "name": "1",
        "messageFi": "2",
    }

    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "No permission to update this banner notification."


def test_banner_notification__update__regular_user(graphql):
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    graphql.login_with_regular_user()

    input_data = {
        "pk": notification.pk,
        "name": "1",
        "messageFi": "2",
    }

    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "No permission to update this banner notification."


def test_banner_notification__update__no_perms(graphql):
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    user = UserFactory.create_with_general_role(role=UserRoleChoice.VIEWER)
    graphql.force_login(user)

    input_data = {
        "pk": notification.pk,
        "name": "1",
        "messageFi": "2",
    }

    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "No permission to update this banner notification."


def test_banner_notification__update__notification_manager(graphql):
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    user = UserFactory.create_with_general_role(role=UserRoleChoice.NOTIFICATION_MANAGER)
    graphql.force_login(user)

    input_data = {
        "pk": notification.pk,
        "name": "1",
        "messageFi": "2",
    }

    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False
