import csv
import shutil
from datetime import datetime, time, timedelta
from pathlib import Path
from typing import Any, List

import pytest
from assertpy import assert_that
from django.conf import settings
from django.core.management import call_command
from django.http import FileResponse
from django.test import RequestFactory
from django.test.testcases import TestCase
from factory.fuzzy import FuzzyChoice, FuzzyInteger

from ..admin import ApplicationRoundAdmin
from ..models import (
    PRIORITIES,
    Application,
    ApplicationEvent,
    ApplicationRound,
    ApplicationStatus,
)
from .factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    ApplicationStatusFactory,
    EventReservationUnitFactory,
)


class ApplicationDataExportTestCaseBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.application_event = ApplicationEventFactory(
            min_duration=timedelta(hours=1),
            max_duration=timedelta(hours=2),
            num_persons=10,
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

        cls.application_status = ApplicationStatusFactory(
            application=cls.application_event.application,
            status=FuzzyChoice(
                choices=[
                    # Exclude DRAFT status, as these will not be present in exports
                    ApplicationStatus.IN_REVIEW,
                    ApplicationStatus.REVIEW_DONE,
                    ApplicationStatus.CANCELLED,
                ]
            ),
        )

        cls.application_round_id = (
            cls.application_event.application.application_round.id
        )

        # Add random ID of application round that does not exist
        # This is to test that no file should be written
        application_round_ids = ApplicationRound.objects.all().values_list(
            "id", flat=True
        )

        cls.space_2_name = (
            f"{cls.event_reservation_unit_2.reservation_unit.name}, "
            f"{cls.event_reservation_unit_2.reservation_unit.unit.name}"
        )
        cls.space_3_name = (
            f"{cls.event_reservation_unit_3.reservation_unit.name}, "
            f"{cls.event_reservation_unit_3.reservation_unit.unit.name}"
        )
        cls.space_1_name = (
            f"{cls.event_reservation_unit_1.reservation_unit.name}, "
            f"{cls.event_reservation_unit_1.reservation_unit.unit.name}"
        )

        # Find random unused ID
        while True:
            potential = FuzzyInteger(0, 100).fuzz()

            if potential not in application_round_ids:
                cls.random_empty_application_round_id = potential

                break


class ApplicationDataExporterTestCase(ApplicationDataExportTestCaseBase):
    export_dir = Path(settings.BASE_DIR) / "exports" / "applications"
    application_round_id = None
    random_empty_application_round_id = None

    @staticmethod
    def _get_filename_for_round(round: int):
        return (
            f"application_data_round_{round}_{datetime.now().strftime('%d-%m-%Y')}.csv"
        )

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

    def test_basic_case(self):
        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_no_time_range(self):
        self.application_event.max_duration = timedelta(hours=1)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_only_one_distinct_duration(self):
        self.application_event.max_duration = timedelta(hours=1)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_minutes_in_duration(self):
        self.application_event.max_duration = timedelta(hours=1, minutes=30)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 1 h 30 min",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_only_minutes_in_duration(self):
        self.application_event.min_duration = timedelta(minutes=30)
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "30 min - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_multiple_schedules_on_same_day(self):
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
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "10:00 - 12:00, 12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_multiple_schedules_different_days(self):
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
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "10:00 - 12:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_min_duration(self):
        self.application_event.min_duration = None
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_max_duration(self):
        self.application_event.max_duration = None
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_contact_person_email(self):
        self.application_event.application.contact_person.email = None
        self.application_event.application.contact_person.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            "",
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_no_contact_person(self):
        self.application_event.application.contact_person = None
        self.application_event.application.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            "",
            "",
            "",
            "",
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_no_organisation_default_to_contact_person(self):
        self.application_event.application.organisation = None
        self.application_event.application.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            f"{application.contact_person.first_name} {application.contact_person.last_name}",
            "",
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_no_organisation_and_no_contact_person(self):
        self.application_event.application.organisation = None
        self.application_event.application.contact_person = None
        self.application_event.application.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            "",
            "",
            "",
            "",
            "",
            "",
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_home_city(self):
        self.application_event.application.home_city = None
        self.application_event.application.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            "muu",
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_purpose(self):
        self.application_event.purpose = None
        self.application_event.save()

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            "",
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_event_begin_time(self):
        event: ApplicationEvent = self.application_event
        event.begin = None
        event.save()

        call_command("export_applications", self.application_round_id)

        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            f"{event.end.day}.{event.end.month}.{event.end.year}",
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_event_end_time(self):
        event: ApplicationEvent = self.application_event
        event.end = None
        event.save()

        call_command("export_applications", self.application_round_id)

        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            f"{event.begin.day}.{event.begin.month}.{event.begin.year}",
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_event_end_and_begin_time(self):
        event: ApplicationEvent = self.application_event
        event.begin = None
        event.end = None
        event.save()

        call_command("export_applications", self.application_round_id)

        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            "",
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_medium_priority_time(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            priority=PRIORITIES.PRIORITY_MEDIUM,
        )

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_low_priority_time(self):
        ApplicationEventScheduleFactory(
            application_event=self.application_event,
            day=2,
            priority=PRIORITIES.PRIORITY_LOW,
        )

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)

    def test_empty_round_does_not_write_file(self):
        call_command("export_applications", self.random_empty_application_round_id)

        file_name = self._get_filename_for_round(self.application_round_id)

        not_existing_file = self.export_dir / file_name

        assert_that(not_existing_file.is_file()).is_false()

    def test_draft_applications_in_round_does_not_write_file(self):
        self.application_status.status = ApplicationStatus.DRAFT
        self.application_status.save()

        call_command("export_applications", self.application_round_id)

        file_name = self._get_filename_for_round(self.application_round_id)

        not_existing_file = self.export_dir / file_name

        assert_that(not_existing_file.is_file()).is_false()

    def test_several_rounds_can_be_given_as_arguments(self):
        call_command(
            "export_applications",
            self.application_round_id,
            self.random_empty_application_round_id,
        )

        existing_file_name = self._get_filename_for_round(self.application_round_id)
        empty_file_name = self._get_filename_for_round(
            self.random_empty_application_round_id
        )

        existing_file = self.export_dir / existing_file_name
        not_existing_file_high = self.export_dir / empty_file_name

        assert_that(existing_file.is_file()).is_true()
        assert_that(not_existing_file_high.is_file()).is_false()

    def test_empty_arguments_throw_error(self):
        with pytest.raises(Exception):
            call_command("export_applications")

    def test_spaces_columns_are_added_dynamically(self):
        event_resunit = EventReservationUnitFactory(
            application_event=self.application_event, priority=PRIORITIES.PRIORITY_HIGH
        )

        call_command("export_applications", self.application_round_id)

        event: ApplicationEvent = self.application_event
        application: Application = event.application

        expected_row = [
            str(application.id),
            ApplicationStatus.get_verbose_status(self.application_status.status),
            application.organisation.name,
            application.organisation.identifier,
            application.contact_person.first_name,
            application.contact_person.last_name,
            application.contact_person.email,
            application.contact_person.phone_number,
            str(event.id),
            event.name,
            (
                f"{event.begin.day}.{event.begin.month}.{event.begin.year}"
                f" - {event.end.day}.{event.end.month}.{event.end.year}"
            ),
            application.home_city.name,
            event.purpose.name,
            str(event.age_group),
            str(event.num_persons),
            application.applicant_type,
            str(event.events_per_week),
            "1 h - 2 h",
            self.space_2_name,
            self.space_3_name,
            self.space_1_name,
            f"{event_resunit.reservation_unit.name}, {event_resunit.reservation_unit.unit.name}",
            "",
            "12:00 - 14:00",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        file_name = self._get_filename_for_round(self.application_round_id)
        self._test_first_data_line(file_name, expected_row)


class TestReservationUnitExportFromAdmin(ApplicationDataExportTestCaseBase):
    def test_admin_action_results_file_response(self):
        view = ApplicationRoundAdmin(ApplicationRound, None)
        request = RequestFactory().get("/admin/applications/applicationround/")

        response = view.export_to_csv(request, ApplicationRound.objects.all())

        assert_that(response).is_instance_of(FileResponse)
