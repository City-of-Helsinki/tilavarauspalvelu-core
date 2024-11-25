from __future__ import annotations

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.models import PersonalInfoViewLog
from tilavarauspalvelu.tasks import remove_old_personal_info_view_logs

from tests.factories import UserFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_remove_personal_info_view_logs_functions():
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

    assert PersonalInfoViewLog.objects.exists() is True

    with freeze_time("2023-02-22 06:00"):
        remove_old_personal_info_view_logs()

    assert PersonalInfoViewLog.objects.exists() is False
