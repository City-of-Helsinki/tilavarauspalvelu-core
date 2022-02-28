import csv
from datetime import datetime, time, timedelta
from pathlib import Path

import pytest
from assertpy import assert_that
from django.conf import settings
from django.core.management import call_command
from django.test.testcases import TestCase
from factory.fuzzy import FuzzyInteger

from ..models import ApplicationRound
from .factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    EventReservationUnitFactory,
)


class ApplicationDataExporterTestCase(TestCase):
    export_dir = Path(settings.BASE_DIR) / "exports"
    file_name = ""
    application_round_id = None
    random_empty_application_round_id = None

    @classmethod
    def setUpTestData(cls):
        cls.application_event = ApplicationEventFactory(
            min_duration=timedelta(hours=1), max_duration=timedelta(hours=2)
        )
        cls.event_reservation_unit_1 = EventReservationUnitFactory(
            application_event=cls.application_event, priority=300
        )
        cls.event_reservation_unit_2 = EventReservationUnitFactory(
            application_event=cls.application_event, priority=100
        )
        cls.event_reservation_unit_3 = EventReservationUnitFactory(
            application_event=cls.application_event, priority=200
        )
        cls.event_schedule = ApplicationEventScheduleFactory(
            application_event=cls.application_event, day=1
        )

        cls.application_round_id = (
            cls.application_event.application.application_round.id
        )
        cls.file_name = (
            f"application_data_round_{cls.application_round_id}"
            f"_{datetime.now().strftime('%d-%m-%Y')}.csv"
        )

        # Add random ID of application round that does not exist
        # This is to test that no file should be written
        application_round_ids = ApplicationRound.objects.all().values_list(
            "id", flat=True
        )

        # Find random unused ID
        while True:
            potential = FuzzyInteger(0, 100)

            if potential not in application_round_ids:
                cls.random_empty_application_round_id = potential

                break

    def tearDown(self) -> None:
        super().tearDown()

        data_file = self.export_dir / self.file_name

        if data_file.is_file():
            data_file.unlink()

    def test_application_export__basic_case(self):
        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "1 h - 2 h",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "12:00 - 14:00",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_application_export__no_time_range(self):
        self.application_event.max_duration = timedelta(hours=1)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "1 h",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "12:00 - 14:00",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_application_export__only_one_distinct_duration(self):
        self.application_event.max_duration = timedelta(hours=1)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "1 h",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "12:00 - 14:00",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_application_export__minutes_in_duration(self):
        self.application_event.max_duration = timedelta(hours=1, minutes=30)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "1 h - 1 h 30 min",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "12:00 - 14:00",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_application_export__only_minutes_in_duration(self):
        self.application_event.min_duration = timedelta(minutes=30)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "30 min - 2 h",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "12:00 - 14:00",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_application_export__multiple_schedules_on_same_day(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=1,
            begin=time(hour=10),
            end=time(hour=12),
        )

        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "1 h - 2 h",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "10:00 - 12:00, 12:00 - 14:00",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_application_export__multiple_schedules_different_days(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=3,
            begin=time(hour=10),
            end=time(hour=12),
        )

        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "1 h - 2 h",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "12:00 - 14:00",
                    "",
                    "10:00 - 12:00",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_application_export__empty_min_duration(self):
        self.application_event.min_duration = None
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "2 h",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "12:00 - 14:00",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_application_export__empty_max_duration(self):
        self.application_event.max_duration = None
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                expected_row = [
                    self.application_event.application.organisation.name,
                    str(self.application_event.events_per_week),
                    "1 h",
                    f"{self.event_reservation_unit_2.reservation_unit.name}",
                    f"{self.event_reservation_unit_3.reservation_unit.name}",
                    f"{self.event_reservation_unit_1.reservation_unit.name}",
                    "",
                    "12:00 - 14:00",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]

                assert_that(line).is_equal_to(expected_row)

    def test_empty_round_does_not_write_file(self):
        call_command("export_applications", 2)

        not_existing_file = (
            self.export_dir
            / f"application_data_round_2_{datetime.now().strftime('%d-%m-%Y')}.csv"
        )

        assert_that(not_existing_file.is_file()).is_false()

    def test_several_rounds_can_be_given_as_arguments(self):
        call_command("export_applications", self.application_round_id, 2)

        existing_file = self.export_dir / self.file_name
        not_existing_file = (
            self.export_dir
            / f"application_data_round_2_{datetime.now().strftime('%d-%m-%Y')}.csv"
        )

        assert_that(existing_file.is_file()).is_true()
        assert_that(not_existing_file.is_file()).is_false()

    def test_empty_arguments_throw_error(self):
        with pytest.raises(Exception):
            call_command("export_applications")
