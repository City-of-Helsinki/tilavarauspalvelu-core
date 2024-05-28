import pytest
from freezegun import freeze_time

from tests.factories import UserFactory
from users.models import PersonalInfoViewLog
from users.tasks import remove_old_personal_info_view_logs, remove_personal_info_view_logs_older_than

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    "remove_logs_function",
    [
        remove_personal_info_view_logs_older_than,
        remove_old_personal_info_view_logs,
    ],
)
def test_remove_personal_info_view_logs_functions(remove_logs_function):
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
        remove_logs_function()

    assert PersonalInfoViewLog.objects.exists() is False
