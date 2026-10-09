from __future__ import annotations

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.models import PersonalInfoViewLog
from tilavarauspalvelu.tasks import remove_old_personal_info_view_logs_task

from tests.factories import UserFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_remove_old_personal_info_view_logs__removes_logs_older_than_two_years_and_keeps_newer():
    user = UserFactory.create()
    with freeze_time("2021-02-21 10:00"):
        PersonalInfoViewLog.objects.create(
            user=user,
            viewer_user=user,
            viewer_username=user.username,
            field="some field",
            viewer_user_full_name=user.get_full_name(),
            viewer_user_email=user.email,
        )
    with freeze_time("2021-02-23 10:00"):
        new_log = PersonalInfoViewLog.objects.create(
            user=user,
            viewer_user=user,
            viewer_username=user.username,
            field="some field",
            viewer_user_full_name=user.get_full_name(),
            viewer_user_email=user.email,
        )

    assert PersonalInfoViewLog.objects.count() == 2

    with freeze_time("2023-02-22 06:00"):
        remove_old_personal_info_view_logs_task()

    assert list(PersonalInfoViewLog.objects.all()) == [new_log]
