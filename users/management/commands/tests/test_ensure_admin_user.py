from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

User = get_user_model()


class EnsureAdminUserTestCase(TestCase):
    def test_account_it_created_with_empty_database(self):
        assert not User.objects.exists()

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
        assert User.objects.count() == 1
        assert out.getvalue() == "  Initial user created! You can log in with username and password admin/admin.\n"

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
        assert User.objects.count() == 1
        assert out.getvalue() == "  User already exists. Initial user creation skipped.\n"
