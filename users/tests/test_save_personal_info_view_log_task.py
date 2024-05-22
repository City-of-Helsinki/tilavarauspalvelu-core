from django.test import TestCase

from tests.factories import UserFactory
from users.models import PersonalInfoViewLog
from users.tasks import save_personal_info_view_log


class SavePersonalInfoViewLogTaskTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = UserFactory.create(
            username="test_user",
            first_name="Test",
            last_name="User",
            email="test.user@localhost",
        )

    def test_save_personal_info_view_log_as_own_user_does_not_save(self):
        save_personal_info_view_log(self.user.id, self.user.id, "first_name")

        assert PersonalInfoViewLog.objects.exists() is False

    def test_save_personal_info_view_log_as_other_user_saves(self):
        other = UserFactory.create(
            username="other_user",
            first_name="Other",
            last_name="User",
            email="other.user@localhost",
        )

        save_personal_info_view_log(self.user.id, other.id, "first_name")

        assert PersonalInfoViewLog.objects.exists() is True
        view_log = PersonalInfoViewLog.objects.first()

        assert view_log.user == self.user
        assert view_log.viewer_user == other
        assert view_log.viewer_username == other.username
        assert view_log.field == "first_name"
        assert view_log.viewer_user_full_name == other.get_full_name()
