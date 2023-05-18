from io import StringIO

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

User = get_user_model()


class EnsureAdminUserTestCase(TestCase):
    def test_account_it_created_with_empty_database(self):
        assert_that(User.objects.count()).is_zero()

        out = StringIO()
        args = []
        kwargs = {
            "username": "admin",
            "email": "admin@example.com",
            "password": "admin",
            "stdout": out,
            "stderr": out,
        }
        call_command("ensure_admin_user", *args, **kwargs)
        assert_that(User.objects.count()).is_equal_to(1)
        assert_that(out.getvalue()).is_equal_to(
            "  Initial user created! You can log in with username and password admin/admin.\n"
        )

    def test_account_it_not_created_when_user_exists(self):
        User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="admin",
        )

        out = StringIO()
        args = []
        kwargs = {
            "username": "admin",
            "email": "admin@example.com",
            "password": "admin",
            "stdout": out,
            "stderr": out,
        }
        call_command("ensure_admin_user", *args, **kwargs)
        assert_that(User.objects.count()).is_equal_to(1)
        assert_that(out.getvalue()).is_equal_to(
            "  User already exists. Initial user creation skipped.\n"
        )
