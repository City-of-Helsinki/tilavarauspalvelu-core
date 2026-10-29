from __future__ import annotations

import pytest

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import PersonalInfoViewLog
from tilavarauspalvelu.tasks import save_personal_info_view_log_task

from tests.factories import UserFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.django_db,
]


def test_save_personal_info_view_log__as_own_user_does_not_save():
    user = UserFactory.create()

    save_personal_info_view_log_task(user.id, user.id, "first_name")

    assert PersonalInfoViewLog.objects.exists() is False


@patch_method(SentryLogger.log_message)
def test_save_personal_info_view_log__viewer_does_not_exist():
    user = UserFactory.create()
    missing_viewer_user_id = user.id + 1

    save_personal_info_view_log_task(user.id, missing_viewer_user_id, "first_name")

    assert PersonalInfoViewLog.objects.exists() is False

    assert SentryLogger.log_message.call_count == 1


def test_save_personal_info_view_log__as_other_user_saves():
    user = UserFactory.create()
    other_user = UserFactory.create()

    save_personal_info_view_log_task(user.id, other_user.id, "first_name")

    assert PersonalInfoViewLog.objects.exists() is True

    view_log = PersonalInfoViewLog.objects.first()
    assert view_log.user == user
    assert view_log.viewer_user == other_user
    assert view_log.viewer_username == other_user.username
    assert view_log.field == "first_name"
    assert view_log.viewer_user_full_name == other_user.get_full_name()
