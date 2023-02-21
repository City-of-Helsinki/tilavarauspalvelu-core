from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import TestCase
from freezegun import freeze_time

from users.models import PersonalInfoViewLog
from users.tasks import remove_old_personal_info_view_logs
from users.utils.remove_personal_info_view_logs import (
    remove_personal_info_view_logs_older_than,
)


class RemovePersonalInfoViewLogsOlderThanTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.user = get_user_model().objects.create_user(
            username="testuser",
            email="test@localhost",
            first_name="Test",
            last_name="User",
        )

        with freeze_time("2021-02-21 10:00"):
            PersonalInfoViewLog.objects.create(
                user=cls.user,
                viewer_user=cls.user,
                viewer_username=cls.user.username,
                field="some field",
                viewer_user_full_name=cls.user.get_full_name(),
                viewer_user_email=cls.user.email,
            )

    @freeze_time("2023-02-22 06:00")
    def test_remove_personal_info_view_logs_older_than_removes_older_than_two_years(
        self,
    ):
        assert_that(PersonalInfoViewLog.objects.exists()).is_true()

        remove_personal_info_view_logs_older_than()

        assert_that(PersonalInfoViewLog.objects.exists()).is_false()

    @freeze_time("2023-02-22 06:00")
    def test_remove_old_personal_info_view_logs_task_removes_older_than_two_years(self):
        assert_that(PersonalInfoViewLog.objects.exists()).is_true()

        remove_old_personal_info_view_logs()

        assert_that(PersonalInfoViewLog.objects.exists()).is_false()
