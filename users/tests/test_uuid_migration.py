from assertpy import assert_that
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase

from users.models import User


class TVPUUIDMigrationTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.user = User.objects.create_user(
            first_name="John", last_name="Doe", email="j.d@localhost", username="jodo"
        )
        cls.tvp_uuid = cls.user.tvp_uuid

        migration = MigrationExecutor(connection)
        migration.migrate([("users", "0004_personalinfoviewlog")])

    def test_tvp_uuid_get_value_from_custom_migration(self):
        migration = MigrationExecutor(connection)
        migration.migrate([("users", "0005_user_tvp_uuid")])

        self.user.refresh_from_db()
        assert_that(self.user.tvp_uuid).is_not_equal_to(self.tvp_uuid)
