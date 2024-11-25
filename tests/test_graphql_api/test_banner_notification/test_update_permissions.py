from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import BannerNotificationFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_banner_notification__update__anonymous_user(graphql):
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")

    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "name": "1",
            "message": "2",
        },
    )

    assert response.error_message() == "No permission to update."


def test_banner_notification__update__regular_user(graphql):
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    graphql.login_with_regular_user()

    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "name": "1",
            "message": "2",
        },
    )

    assert response.error_message() == "No permission to update."


def test_banner_notification__update__no_perms(graphql):
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    graphql.login_user_with_role(role=UserRoleChoice.VIEWER)

    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "name": "1",
            "message": "2",
        },
    )

    assert response.error_message() == "No permission to update."


def test_banner_notification__update__notification_manager(graphql):
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    graphql.login_user_with_role(role=UserRoleChoice.NOTIFICATION_MANAGER)

    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "name": "1",
            "message": "2",
        },
    )

    assert response.has_errors is False
