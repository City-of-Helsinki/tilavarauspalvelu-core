import csv
import shutil
from datetime import datetime, time, timedelta
from pathlib import Path
from typing import Any, List

import pytest
from assertpy import assert_that
from django.conf import settings
from django.core.management import call_command
from django.test.testcases import TestCase
from factory.fuzzy import FuzzyInteger

from ..models import PRIORITIES, Application, ApplicationEvent, ApplicationRound
from .factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    EventReservationUnitFactory,
)


class ApplicationDataExporterTestCase(TestCase):
    export_dir = (
        Path(settings.BASE_DIR) / "exports" / f"{datetime.now().strftime('%d-%m-%Y')}"
    )
    application_round_id = None
    random_empty_application_round_id = None

    @classmethod
    def setUpTestData(cls):
        cls.application_event = ApplicationEventFactory(
            min_duration=timedelta(hours=1), max_duration=timedelta(hours=2)
        )
        cls.event_reservation_unit_1 = EventReservationUnitFactory(
            application_event=cls.application_event, priority=PRIORITIES.PRIORITY_HIGH
        )
        cls.event_reservation_unit_2 = EventReservationUnitFactory(
            application_event=cls.application_event, priority=PRIORITIES.PRIORITY_LOW
        )
        cls.event_reservation_unit_3 = EventReservationUnitFactory(
            application_event=cls.application_event, priority=PRIORITIES.PRIORITY_MEDIUM
        )
        cls.event_schedule = ApplicationEventScheduleFactory(
            application_event=cls.application_event,
            day=1,
            priority=PRIORITIES.PRIORITY_HIGH,
        )

        cls.application_round_id = (
            cls.application_event.application.application_round.id
        )

        # Add random ID of application round that does not exist
        # This is to test that no file should be written
        application_round_ids = ApplicationRound.objects.all().values_list(
            "id", flat=True
        )

        # Find random unused ID
        while True:
            potential = FuzzyInteger(0, 100).fuzz()

            if potential not in application_round_ids:
                cls.random_empty_application_round_id = potential

                break

    @staticmethod
    def _get_filename_for_round_and_priority(round: int, priority: str):
        return f"application_data_round_{round}_priority_{priority}.csv"

    @classmethod
    def _test_first_data_line(cls, file_name: str, expected_row: List[Any]):
        with open(cls.export_dir / file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                assert_that(line).is_equal_to(expected_row)

    def tearDown(self) -> None:
        super().tearDown()

        if self.export_dir.is_dir():
            shutil.rmtree(self.export_dir)

    def test_application_export__basic_case(self):
        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__no_time_range(self):
        self.application_event.max_duration = timedelta(hours=1)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__only_one_distinct_duration(self):
        self.application_event.max_duration = timedelta(hours=1)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__minutes_in_duration(self):
        self.application_event.max_duration = timedelta(hours=1, minutes=30)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__only_minutes_in_duration(self):
        self.application_event.min_duration = timedelta(minutes=30)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__multiple_schedules_on_same_day(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=1,
            begin=time(hour=10),
            end=time(hour=12),
            priority=300,
        )

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__multiple_schedules_different_days(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=3,
            begin=time(hour=10),
            end=time(hour=12),
            priority=300,
        )

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__empty_min_duration(self):
        self.application_event.min_duration = None
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__empty_max_duration(self):
        self.application_event.max_duration = None
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__empty_contact_person_email(self):
        self.application_event.application.contact_person.email = None
        self.application_event.application.contact_person.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            "",
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__no_contact_person(self):
        self.application_event.application.contact_person = None
        self.application_event.application.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            "",
            "",
            "",
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__empty_home_city(self):
        self.application_event.application.home_city = None
        self.application_event.application.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            "",
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__empty_purpose(self):
        self.application_event.purpose = None
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            "",
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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

        file_name = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        self._test_first_data_line(file_name, expected_row)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        not_existing_file_low = self.export_dir / not_existing_file_low

        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__medium_priority_time(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            priority=PRIORITIES.PRIORITY_MEDIUM,
        )

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row_high_prio = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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
        expected_row_medium_prio = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            f"{self.event_reservation_unit_2.reservation_unit.name}",
            f"{self.event_reservation_unit_3.reservation_unit.name}",
            f"{self.event_reservation_unit_1.reservation_unit.name}",
            "",
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
        ]

        file_name_high_prio = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        file_name_medium_prio = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        self._test_first_data_line(file_name_high_prio, expected_row_high_prio)
        self._test_first_data_line(file_name_medium_prio, expected_row_medium_prio)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        not_existing_file_low = self.export_dir / not_existing_file_low
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_application_export__low_priority_time(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            priority=PRIORITIES.PRIORITY_LOW,
        )

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row_high_prio = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
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
        expected_row_low_prio = [
            str(application.id),
            application.organisation.name,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            event.name,
            application.application_round.name,
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            f"{self.event_reservation_unit_2.reservation_unit.name}",
            f"{self.event_reservation_unit_3.reservation_unit.name}",
            f"{self.event_reservation_unit_1.reservation_unit.name}",
            "",
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
        ]

        file_name_high_prio = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        file_name_low_prio = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )
        self._test_first_data_line(file_name_high_prio, expected_row_high_prio)
        self._test_first_data_line(file_name_low_prio, expected_row_low_prio)

        # These files should not have been written.
        # Check that they do not exist!
        not_existing_file_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_medium = self.export_dir / not_existing_file_medium
        assert_that(not_existing_file_medium.is_file()).is_false()

    def test_empty_round_does_not_write_file(self):
        call_command("export_applications", self.random_empty_application_round_id)

        file_name_high = self._get_filename_for_round_and_priority(
            self.random_empty_application_round_id, "HIGH"
        )
        file_name_medium = self._get_filename_for_round_and_priority(
            self.random_empty_application_round_id, "MEDIUM"
        )
        file_name_low = self._get_filename_for_round_and_priority(
            self.random_empty_application_round_id, "LOW"
        )

        not_existing_file_high = self.export_dir / file_name_high
        not_existing_file_medium = self.export_dir / file_name_medium
        not_existing_file_low = self.export_dir / file_name_low

        assert_that(not_existing_file_high.is_file()).is_false()
        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_several_rounds_can_be_given_as_arguments(self):
        call_command(
            "export_applications",
            self.application_round_id,
            self.random_empty_application_round_id,
        )

        # Only high priority file should exist
        existing_file_name_high = self._get_filename_for_round_and_priority(
            self.application_round_id, "HIGH"
        )
        not_existing_file_name_medium = self._get_filename_for_round_and_priority(
            self.application_round_id, "MEDIUM"
        )
        not_existing_file_name_low = self._get_filename_for_round_and_priority(
            self.application_round_id, "LOW"
        )

        existing_file = self.export_dir / existing_file_name_high
        not_existing_file_medium = self.export_dir / not_existing_file_name_medium
        not_existing_file_low = self.export_dir / not_existing_file_name_low

        assert_that(existing_file.is_file()).is_true()
        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

        # All of random empty round files should not exist
        empty_file_name_high = self._get_filename_for_round_and_priority(
            self.random_empty_application_round_id, "HIGH"
        )
        empty_file_name_medium = self._get_filename_for_round_and_priority(
            self.random_empty_application_round_id, "MEDIUM"
        )
        empty_file_name_low = self._get_filename_for_round_and_priority(
            self.random_empty_application_round_id, "LOW"
        )

        not_existing_file_high = self.export_dir / empty_file_name_high
        not_existing_file_medium = self.export_dir / empty_file_name_medium
        not_existing_file_low = self.export_dir / empty_file_name_low

        assert_that(not_existing_file_high.is_file()).is_false()
        assert_that(not_existing_file_medium.is_file()).is_false()
        assert_that(not_existing_file_low.is_file()).is_false()

    def test_empty_arguments_throw_error(self):
        with pytest.raises(Exception):
            call_command("export_applications")
