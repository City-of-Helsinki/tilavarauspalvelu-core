from typing import Any, NamedTuple

import pytest

from common.choices import BannerNotificationLevel, BannerNotificationTarget
from common.models import BannerNotification
from tests.factories import BannerNotificationFactory, UserFactory
from tests.helpers import parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class InvalidActiveParams(NamedTuple):
    active_from: str | None
    active_until: str | None
    expected: Any


MUTATION_QUERY = """
    mutation ($input: BannerNotificationUpdateMutationInput!) {
      updateBannerNotification(input: $input) {
        %s
        errors {
          field
          messages
        }
      }
    }
    """


def test_user_updates_draft_banner_notification(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to modify the banner notification
    response = graphql(
        MUTATION_QUERY % ("pk name message target level draft",),
        input_data={
            "pk": notification.pk,
            "name": "1",
            "message": "2",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
        },
    )

    # then:
    # - The response contains the modified notification
    assert response.first_query_object == {
        "pk": notification.pk,
        "name": "1",
        "message": "2",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
        "draft": True,
        "errors": None,
    }


def test_user_publishes_draft_banner_notification(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to 'publish' the banner notification
    response = graphql(
        MUTATION_QUERY % ("pk draft activeFrom activeUntil",),
        input_data={
            "pk": notification.pk,
            "draft": False,
            "activeFrom": "2020-01-01T00:00:00+00:00",
            "activeUntil": "2020-01-02T00:00:00+00:00",
        },
    )

    # then:
    # - The response contains the 'published' notification
    assert response.first_query_object == {
        "pk": notification.pk,
        "draft": False,
        "activeFrom": "2020-01-01T02:00:00+02:00",
        "activeUntil": "2020-01-02T02:00:00+02:00",
        "errors": None,
    }


def test_user_tries_to_publish_draft_banner_notification_without_setting_active_period(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to 'publish' the banner notification
    response = graphql(
        MUTATION_QUERY % ("pk draft",),
        input_data={
            "pk": notification.pk,
            "draft": False,
        },
    )

    # then:
    # - The response contains errors about missing active period
    assert response.field_error_messages("activeFrom") == ["Non-draft notifications must set 'active_from'"]
    assert response.field_error_messages("activeUntil") == ["Non-draft notifications must set 'active_until'"]


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Active from before active until": InvalidActiveParams(
                active_from="2022-01-02T00:00:00",
                active_until="2022-01-01T00:00:00",
                expected=[
                    {
                        "field": "activeFrom",
                        "messages": [
                            "'active_from' must be before 'active_until'.",
                        ],
                    },
                ],
            ),
            "Must set 'active_until' if 'active_from' is set": InvalidActiveParams(
                active_from="2022-01-01T00:00:00",
                active_until=None,
                expected=[
                    {
                        "field": "activeUntil",
                        "messages": [
                            "Both 'active_from' and 'active_until' must be either set or null.",
                            "Non-draft notifications must set 'active_until'",
                        ],
                    },
                    {
                        "field": "activeFrom",
                        "messages": [
                            "Both 'active_from' and 'active_until' must be either set or null.",
                        ],
                    },
                ],
            ),
            "Must set 'active_from' if 'active_until' is set": InvalidActiveParams(
                active_from=None,
                active_until="2022-01-01T00:00:00",
                expected=[
                    {
                        "field": "activeUntil",
                        "messages": [
                            "Both 'active_from' and 'active_until' must be either set or null.",
                        ],
                    },
                    {
                        "field": "activeFrom",
                        "messages": [
                            "Both 'active_from' and 'active_until' must be either set or null.",
                            "Non-draft notifications must set 'active_from'",
                        ],
                    },
                ],
            ),
            "Active from same active until": InvalidActiveParams(
                active_from="2022-01-01T00:00:00",
                active_until="2022-01-01T00:00:00",
                expected=[
                    {
                        "field": "activeFrom",
                        "messages": [
                            "'active_from' must be before 'active_until'.",
                        ],
                    },
                ],
            ),
        },
    ),
)
def test_user_tries_to_publish_draft_banner_notification_with_improper_active_period(
    graphql, active_from, active_until, expected
):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to modify the banner notification
    response = graphql(
        MUTATION_QUERY % ("pk draft activeFrom activeUntil",),
        input_data={
            "pk": notification.pk,
            "draft": False,
            "activeFrom": active_from,
            "activeUntil": active_until,
        },
    )

    # then:
    # - The response contains errors about the improper active period
    assert response.field_errors == expected, response


def test_primary_key_is_required_for_updating(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to modify the banner notification
    response = graphql(MUTATION_QUERY % ("pk",), input_data={})

    # then:
    # - The response complains about the improper input
    assert (
        response.error_message()
        == "Variable '$input' of required type 'BannerNotificationUpdateMutationInput!' was not provided."
    )


def test_user_updates_non_existing_banner_notification(graphql):
    # given:
    # - There are no banner notifications in the system
    # - Notification manager is using the system
    assert BannerNotification.objects.count() == 0
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to modify a non-existing banner notification
    response = graphql(
        MUTATION_QUERY % ("pk",),
        input_data={
            "pk": 1,
            "name": "1",
            "message": "2",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
        },
    )

    # then:
    # - The response contains an error about non-existing banner notification
    assert response.field_error_messages("nonFieldErrors") == ["Object does not exist."]
