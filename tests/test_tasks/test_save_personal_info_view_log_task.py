import pytest

from tests.factories import UserFactory
from users.models import PersonalInfoViewLog
from users.tasks import save_personal_info_view_log

pytestmark = [
    pytest.mark.django_db,
]


def test_save_personal_info_view_log__as_own_user_does_not_save():
    user = UserFactory.create()

    save_personal_info_view_log(user.id, user.id, "first_name")

    assert PersonalInfoViewLog.objects.exists() is False


def test_save_personal_info_view_log__as_other_user_saves():
    user = UserFactory.create()
    other_user = UserFactory.create()

    save_personal_info_view_log(user.id, other_user.id, "first_name")

    assert PersonalInfoViewLog.objects.exists() is True

    view_log = PersonalInfoViewLog.objects.first()
    assert view_log.user == user
    assert view_log.viewer_user == other_user
    assert view_log.viewer_username == other_user.username
    assert view_log.field == "first_name"
    assert view_log.viewer_user_full_name == other_user.get_full_name()
