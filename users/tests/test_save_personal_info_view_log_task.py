from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import TestCase

from users.models import PersonalInfoViewLog
from users.tasks import save_personal_info_view_log


class SavePersonalInfoViewLogTaskTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create(
            username="test_user",
            first_name="Test",
            last_name="User",
            email="test.user@localhost",
        )

    def test_save_personal_info_view_log_as_own_user_does_not_save(self):
        save_personal_info_view_log(self.user.id, self.user.id, "first_name")

        assert_that(PersonalInfoViewLog.objects.exists()).is_false()

    def test_save_personal_info_view_log_as_other_user_saves(self):
        other = get_user_model().objects.create(
            username="other_user",
            first_name="Other",
            last_name="User",
            email="other.user@localhost",
        )

        save_personal_info_view_log(self.user.id, other.id, "first_name")

        assert_that(PersonalInfoViewLog.objects.exists()).is_true()
        view_log = PersonalInfoViewLog.objects.first()

        assert_that(view_log.user).is_equal_to(self.user)
        assert_that(view_log.viewer_user).is_equal_to(other)
        assert_that(view_log.viewer_username).is_equal_to(other.username)
        assert_that(view_log.field).is_equal_to("first_name")
        assert_that(view_log.viewer_user_full_name).is_equal_to(other.get_full_name())
