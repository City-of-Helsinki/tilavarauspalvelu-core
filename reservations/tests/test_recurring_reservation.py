from assertpy import assert_that
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase

from reservations.models import RecurringReservation
from reservations.tests.factories import RecurringReservationFactory


class TestRecurringReservationUUIDMigration(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.rec = RecurringReservationFactory()
        cls.rec_too = RecurringReservationFactory()

        migration = MigrationExecutor(connection)
        migration.migrate([("reservations", "0044_recurringreservation_description")])

    def test_uuid_get_value_from_custom_migration(self):
        migration = MigrationExecutor(connection)
        migration.migrate([("reservations", "0045_reservee_stats_field_updates")])

        assert_that(RecurringReservation.objects.filter(uuid__isnull=True).exists()).is_false()
        assert_that(RecurringReservation.objects.exists()).is_true()
