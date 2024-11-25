from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import BannerNotificationFactory

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_banner_notification__delete__anonymous_user(graphql):
    notification = BannerNotificationFactory.create(draft=True)

    response = graphql(
        DELETE_MUTATION,
        input_data={
            "pk": notification.pk,
        },
    )

    assert response.error_message() == "No permission to delete."


def test_banner_notification__delete__regular_user(graphql):
    notification = BannerNotificationFactory.create(draft=True)
    graphql.login_with_regular_user()

    response = graphql(
        DELETE_MUTATION,
        input_data={
            "pk": notification.pk,
        },
    )

    assert response.error_message() == "No permission to delete."


def test_banner_notification__delete__no_perms(graphql):
    notification = BannerNotificationFactory.create(draft=True)
    graphql.login_user_with_role(role=UserRoleChoice.VIEWER)

    response = graphql(
        DELETE_MUTATION,
        input_data={
            "pk": notification.pk,
        },
    )

    assert response.error_message() == "No permission to delete."


def test_banner_notification__delete__notification_manager(graphql):
    notification = BannerNotificationFactory.create(draft=True)
    graphql.login_user_with_role(role=UserRoleChoice.NOTIFICATION_MANAGER)

    response = graphql(
        DELETE_MUTATION,
        variables={
            "input": {
                "pk": notification.pk,
            }
        },
    )

    assert response.has_errors is False
