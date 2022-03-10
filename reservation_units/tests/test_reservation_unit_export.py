import csv
import shutil
from pathlib import Path
from typing import Any, List

from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from django.utils import timezone

from ..utils.export_data import ReservationUnitExporter
from .factories import ReservationUnitFactory


class ReservationUnitDataExporterTestCase(TestCase):
    export_dir = Path(settings.BASE_DIR) / "exports" / "reservation_unit_exports"
    file_name = f"reservation_units__{timezone.now().strftime('%d-%m-%Y')}.csv"

    @classmethod
    def setUpTestData(cls):
        cls.reservation_unit = ReservationUnitFactory()

    def tearDown(self) -> None:
        super().tearDown()

        if self.export_dir.is_dir():
            shutil.rmtree(self.export_dir)

    @classmethod
    def _test_first_data_line(cls, expected_row: List[Any]):
        with open(cls.export_dir / cls.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)

            for i, line in enumerate(data_reader):

                # Do not test header rows
                if i <= 2:
                    continue

                assert_that(line).is_equal_to(expected_row)

    def test_basic_case(self):
        ReservationUnitExporter.export_reservation_unit_data()

        expected_line = [
            self.reservation_unit.id,
            self.reservation_unit.name,
            self.reservation_unit.name_fi,
            self.reservation_unit.name_en,
            self.reservation_unit.name_sv,
            self.reservation_unit.description,
            self.reservation_unit.description_fi,
            self.reservation_unit.description_en,
            self.reservation_unit.description_sv,
            self.reservation_unit.reservation_unit_type.name,
            self.reservation_unit.terms_of_use,
            self.reservation_unit.terms_of_use_fi,
            self.reservation_unit.terms_of_use_en,
            self.reservation_unit.terms_of_use_sv,
            self.reservation_unit.service_specific_terms,
            self.reservation_unit.unit.name,
            self.reservation_unit.contact_information,
            self.reservation_unit.is_draft,
            self.reservation_unit.publish_begins,
            self.reservation_unit.publish_ends,
        ]

        self._test_first_data_line(expected_line)

    def test_missing_reservation_unit_type(self):
        self.reservation_unit.reservation_unit_type = None
        self.reservation_unit.save()

        ReservationUnitExporter.export_reservation_unit_data()

        expected_line = [
            self.reservation_unit.id,
            self.reservation_unit.name,
            self.reservation_unit.name_fi,
            self.reservation_unit.name_en,
            self.reservation_unit.name_sv,
            self.reservation_unit.description,
            self.reservation_unit.description_fi,
            self.reservation_unit.description_en,
            self.reservation_unit.description_sv,
            "",
            self.reservation_unit.terms_of_use,
            self.reservation_unit.terms_of_use_fi,
            self.reservation_unit.terms_of_use_en,
            self.reservation_unit.terms_of_use_sv,
            self.reservation_unit.service_specific_terms,
            self.reservation_unit.unit.name,
            self.reservation_unit.contact_information,
            self.reservation_unit.is_draft,
            self.reservation_unit.publish_begins,
            self.reservation_unit.publish_ends,
        ]

        self._test_first_data_line(expected_line)

    def test_missing_unit(self):
        self.reservation_unit.unit = None
        self.reservation_unit.save()

        ReservationUnitExporter.export_reservation_unit_data()

        expected_line = [
            self.reservation_unit.id,
            self.reservation_unit.name,
            self.reservation_unit.name_fi,
            self.reservation_unit.name_en,
            self.reservation_unit.name_sv,
            self.reservation_unit.description,
            self.reservation_unit.description_fi,
            self.reservation_unit.description_en,
            self.reservation_unit.description_sv,
            self.reservation_unit.reservation_unit_type.name,
            self.reservation_unit.terms_of_use,
            self.reservation_unit.terms_of_use_fi,
            self.reservation_unit.terms_of_use_en,
            self.reservation_unit.terms_of_use_sv,
            self.reservation_unit.service_specific_terms,
            "",
            self.reservation_unit.contact_information,
            self.reservation_unit.is_draft,
            self.reservation_unit.publish_begins,
            self.reservation_unit.publish_ends,
        ]

        self._test_first_data_line(expected_line)
