from datetime import datetime

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import get_default_timezone


class UserStrMethodTestCase(TestCase):
    def test_last_login_displays_if_has_logged(self):
        user = get_user_model().objects.create(
            username="test",
            first_name="First",
            last_name="Last",
            email="test@localhost",
            last_login=datetime(2023, 5, 16, 15, 0, tzinfo=get_default_timezone()),
        )

        assert_that(user.__str__()).is_equal_to(
            "Last First (test@localhost) - 16.05.2023 15:00"
        )

    def test_last_login_does_not_display_if_has_not_logged(self):
        user = get_user_model().objects.create(
            username="test",
            first_name="First",
            last_name="Last",
            email="test@localhost",
        )

        assert_that(user.__str__()).is_equal_to("Last First (test@localhost)")
