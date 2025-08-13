from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import BannerNotificationFactory, UserFactory

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_banner_notification__delete__anonymous_user(graphql):
    notification = BannerNotificationFactory.create(draft=True)

    response = graphql(DELETE_MUTATION, variables={"input": {"pk": notification.pk}})

    assert response.error_message(0) == "No permission to delete this banner notification."


def test_banner_notification__delete__regular_user(graphql):
    notification = BannerNotificationFactory.create(draft=True)
    graphql.login_with_regular_user()

    response = graphql(DELETE_MUTATION, variables={"input": {"pk": notification.pk}})

    assert response.error_message(0) == "No permission to delete this banner notification."


def test_banner_notification__delete__no_perms(graphql):
    notification = BannerNotificationFactory.create(draft=True)
    user = UserFactory.create_with_general_role(role=UserRoleChoice.VIEWER)
    graphql.force_login(user)

    response = graphql(DELETE_MUTATION, variables={"input": {"pk": notification.pk}})

    assert response.error_message(0) == "No permission to delete this banner notification."


def test_banner_notification__delete__notification_manager(graphql):
    notification = BannerNotificationFactory.create(draft=True)
    user = UserFactory.create_with_general_role(role=UserRoleChoice.NOTIFICATION_MANAGER)
    graphql.force_login(user)

    response = graphql(DELETE_MUTATION, variables={"input": {"pk": notification.pk}})

    assert response.has_errors is False
