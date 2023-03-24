import csv
import datetime
import shutil
from pathlib import Path
from typing import Any, List

from assertpy import assert_that
from django.conf import settings
from django.http import FileResponse
from django.test import RequestFactory
from django.test.testcases import TestCase
from django.utils import timezone
from django.utils.timezone import get_default_timezone

from reservations.tests.factories import ReservationMetadataSetFactory
from resources.tests.factories import ResourceFactory
from services.tests.factories import ServiceFactory
from spaces.tests.factories import SpaceFactory
from terms_of_use.models import TermsOfUse
from terms_of_use.tests.factories import TermsOfUseFactory

from ..admin import ReservationUnitAdmin
from ..models import ReservationUnit
from ..utils.export_data import ReservationUnitExporter
from .factories import (
    EquipmentFactory,
    PurposeFactory,
    QualifierFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
)


class ReservationUnitDataExporterTestCase(TestCase):
    export_dir = Path(settings.BASE_DIR) / "exports" / "reservation_unit_exports"
    file_name = f"reservation_units__{timezone.now().strftime('%d-%m-%Y')}.csv"

    @classmethod
    def setUpTestData(cls):
        cls.reservation_unit = ReservationUnitFactory(
            spaces=SpaceFactory.create_batch(3),
            resources=ResourceFactory.create_batch(3),
            qualifiers=QualifierFactory.create_batch(3),
            payment_terms=TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT),
            cancellation_terms=TermsOfUseFactory(
                terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION
            ),
            pricing_terms=TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PRICING),
            cancellation_rule=ReservationUnitCancellationRuleFactory(),
            reservation_begins=datetime.datetime.now(tz=get_default_timezone()),
            reservation_ends=datetime.datetime.now(tz=get_default_timezone())
            + datetime.timedelta(days=30),
            metadata_set=ReservationMetadataSetFactory(),
            services=ServiceFactory.create_batch(3),
            purposes=PurposeFactory.create_batch(3),
            equipments=EquipmentFactory.create_batch(3),
        )
        cls.pricing = ReservationUnitPricingFactory(
            reservation_unit=cls.reservation_unit
        )

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
            ", ".join(self.reservation_unit.spaces.values_list("name_fi", flat=True)),
            ", ".join(
                self.reservation_unit.resources.values_list("name_fi", flat=True)
            ),
            ", ".join(
                self.reservation_unit.qualifiers.all().values_list("name_fi", flat=True)
            ),
            self.reservation_unit.payment_terms.name,
            self.reservation_unit.cancellation_terms.name,
            self.reservation_unit.pricing_terms.name,
            self.reservation_unit.cancellation_rule.name,
            self.pricing.price_unit,
            self.pricing.lowest_price,
            self.pricing.highest_price,
            self.pricing.tax_percentage,
            self.reservation_unit.reservation_begins.astimezone(
                get_default_timezone()
            ).strftime("%d:%m:%Y %H:%M"),
            self.reservation_unit.reservation_ends.astimezone(
                get_default_timezone()
            ).strftime("%d:%m:%Y %H:%M"),
            ", ".join(
                self.reservation_unit.services.all().values_list("name_fi", flat=True)
            ),
            ", ".join(
                self.reservation_unit.purposes.all().values_list("name_fi", flat=True)
            ),
            self.reservation_unit.require_introduction,
            ", ".join(
                self.reservation_unit.equipments.all().values_list("name_fi", flat=True)
            ),
            self.reservation_unit.state.value,
            self.reservation_unit.reservation_state.value,
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
            self.reservation_unit.state.value,
            self.reservation_unit.reservation_state.value,
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
            self.reservation_unit.state.value,
            self.reservation_unit.reservation_state.value,
        ]

        self._test_first_data_line(expected_line)

    def test_if_queryset_given_it_is_used(self):
        ReservationUnitFactory.create_batch(5)

        queryset = ReservationUnit.objects.filter(id=self.reservation_unit.id)

        ReservationUnitExporter.export_reservation_unit_data(queryset=queryset)

        with open(self.export_dir / self.file_name, "r") as data_file:
            data_reader = csv.reader(data_file)
            lines = max([i for i, line in enumerate(data_reader)])

            assert_that(lines).is_equal_to(1)

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
            ", ".join(self.reservation_unit.spaces.values_list("name_fi", flat=True)),
            ", ".join(
                self.reservation_unit.resources.values_list("name_fi", flat=True)
            ),
            ", ".join(
                self.reservation_unit.qualifiers.all().values_list("name_fi", flat=True)
            ),
            self.reservation_unit.payment_terms.name,
            self.reservation_unit.cancellation_terms.name,
            self.reservation_unit.pricing_terms.name,
            self.reservation_unit.cancellation_rule.name,
            self.pricing.price_unit,
            self.pricing.lowest_price,
            self.pricing.highest_price,
            self.pricing.tax_percentage,
            self.reservation_unit.reservation_begins.astimezone(
                get_default_timezone()
            ).strftime("%d:%m:%Y %H:%M"),
            self.reservation_unit.reservation_ends.astimezone(
                get_default_timezone()
            ).strftime("%d:%m:%Y %H:%M"),
            ", ".join(
                self.reservation_unit.services.all().values_list("name_fi", flat=True)
            ),
            ", ".join(
                self.reservation_unit.purposes.all().values_list("name_fi", flat=True)
            ),
            self.reservation_unit.require_introduction,
            ", ".join(
                self.reservation_unit.equipments.all().values_list("name_fi", flat=True)
            ),
            self.reservation_unit.state.value,
            self.reservation_unit.reservation_state.value,
        ]

        self._test_first_data_line(expected_line)


class TestReservationUnitExportFromAdmin(TestCase):
    def test_admin_action_results_file_response(self):
        reservation_unit = ReservationUnitFactory()
        ReservationUnitPricingFactory(reservation_unit=reservation_unit)
        view = ReservationUnitAdmin(ReservationUnit, None)
        request = RequestFactory().get("/admin/reservation_units/reservationunit/")

        response = view.export_to_csv(request, ReservationUnit.objects.all())

        assert_that(response).is_instance_of(FileResponse)
