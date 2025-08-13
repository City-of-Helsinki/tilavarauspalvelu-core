from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationTarget, UserRoleChoice

from tests.factories import UserFactory
from tests.test_graphql_api.test_banner_notification.helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_banner_notification__create__anonymous_user(graphql):
    input_data = {
        "name": "foo",
        "messageFi": "bar",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
    }

    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "No permission to create banner notifications."


def test_banner_notification__create__regular_user(graphql):
    graphql.login_with_regular_user()

    input_data = {
        "name": "foo",
        "messageFi": "bar",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
    }

    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "No permission to create banner notifications."


def test_banner_notification__create__no_perms(graphql):
    user = UserFactory.create_with_general_role(role=UserRoleChoice.VIEWER)
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "messageFi": "bar",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
    }

    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "No permission to create banner notifications."


def test_banner_notification__create__notification_manager(graphql):
    user = UserFactory.create_with_general_role(role=UserRoleChoice.NOTIFICATION_MANAGER)
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "messageFi": "bar",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
    }

    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False
