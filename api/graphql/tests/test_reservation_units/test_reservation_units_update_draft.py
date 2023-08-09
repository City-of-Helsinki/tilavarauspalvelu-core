import json
from unittest import mock

from assertpy import assert_that
from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.test import override_settings

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from reservation_units.models import ReservationUnit
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import ReservationMetadataSetFactory
from terms_of_use.models import TermsOfUse
from terms_of_use.tests.factories import TermsOfUseFactory
from tilavarauspalvelu.utils.auditlog_util import AuditLogger


@override_settings(AUDIT_LOGGING_ENABLED=True)
class ReservationUnitUpdateDraftTestCase(ReservationUnitMutationsTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        AuditLogger.register(ReservationUnit)
        cls.res_unit = ReservationUnitFactory(
            is_draft=True,
            name="Resunit name",
            contact_information="Sonya Blade",
            unit=cls.unit,
        )

    def get_update_query(self):
        return """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input){
                    pk
                }
            }
            """

    def get_valid_update_data(self):
        return {"pk": self.res_unit.pk, "pricings": []}

    def test_update(self):
        data = self.get_valid_update_data()
        data["nameFi"] = "New name"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_fi).is_equal_to("New name")

    def test_update_with_metadata_set(self):
        metadata_set = ReservationMetadataSetFactory(name="New form")
        data = self.get_valid_update_data()
        data["metadataSetPk"] = metadata_set.pk
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.metadata_set).is_equal_to(metadata_set)

    def test_update_with_null_metadata_set(self):
        data = self.get_valid_update_data()
        data["metadataSetPk"] = None
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.metadata_set).is_none()

    def test_update_with_terms_of_use_pks(self):
        payment_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT)
        cancellation_terms = TermsOfUseFactory(
            terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION
        )
        service_specific_terms = TermsOfUseFactory(
            terms_type=TermsOfUse.TERMS_TYPE_SERVICE
        )
        data = self.get_valid_update_data()
        data["paymentTermsPk"] = payment_terms.pk
        data["cancellationTermsPk"] = cancellation_terms.pk
        data["serviceSpecificTermsPk"] = service_specific_terms.pk

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.res_unit.refresh_from_db()

        assert_that(self.res_unit.payment_terms).is_equal_to(payment_terms)
        assert_that(self.res_unit.cancellation_terms).is_equal_to(cancellation_terms)
        assert_that(self.res_unit.service_specific_terms).is_equal_to(
            service_specific_terms
        )

    def test_update_with_authentication(self):
        data = self.get_valid_update_data()
        data["authentication"] = "STRONG"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.authentication).is_equal_to("strong")

    def test_update_errors_with_invalid_authentication(self):
        data = self.get_valid_update_data()
        data["authentication"] = "invalid"
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(content.get("errors")[0].get("message")).contains(
            'Choice "invalid" is not allowed.'
        )
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.authentication).is_not_equal_to("invalid")

    def test_update_errors_with_empty_name(self):
        data = self.get_valid_update_data()
        data["nameFi"] = ""

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "nameFi is required for draft reservation units"
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_fi).is_not_empty()

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        data = self.get_valid_update_data()
        data["nameFi"] = "Better name in my opinion."
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name).is_equal_to("Resunit name")

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called_when_resource_id_exists(
        self, send_resource_mock
    ):
        self.res_unit.hauki_resource_id = "1"
        self.res_unit.save()

        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(1)

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=False)
    def test_send_resource_to_hauki_not_called_when_exports_disabled(
        self, send_resource_mock
    ):
        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(0)

    def test_contact_information_removal_on_archive(self):
        data = self.get_valid_update_data()
        data["isArchived"] = True
        data["contactInformation"] = "Liu Kang"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.is_archived).is_equal_to(True)
        assert_that(self.res_unit.contact_information).is_equal_to("")

    def test_audit_log_deletion_on_archive(self):
        self.res_unit.name = "Updated"
        self.res_unit.save()

        content_type_id = ContentType.objects.get(
            app_label="reservation_units", model="reservationunit"
        ).id
        log_entry_count = LogEntry.objects.filter(
            content_type_id=content_type_id, object_id=self.res_unit.pk
        ).count()

        print(
            LogEntry.objects.filter(
                content_type_id=content_type_id, object_id=self.res_unit.pk
            ).all()
        )

        assert_that(log_entry_count).is_greater_than(1)

        data = self.get_valid_update_data()
        data["isArchived"] = True
        data["contactInformation"] = "Liu Kang"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        log_entry_count = LogEntry.objects.filter(
            content_type_id=content_type_id, object_id=self.res_unit.pk
        ).count()
        assert_that(log_entry_count).is_equal_to(1)

    def test_update_with_pricing_fields(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["pricingTermsPk"] = self.pricing_term.pk

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("updateReservationUnit").get("pk")
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_terms).is_equal_to(self.pricing_term)

    def test_update_with_instructions(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["reservationPendingInstructionsFi"] = "Pending instructions updated fi"
        data["reservationPendingInstructionsSv"] = "Pending instructions updated sv"
        data["reservationPendingInstructionsEn"] = "Pending instructions updated en"
        data["reservationConfirmedInstructionsFi"] = "Confirmed instructions updated fi"
        data["reservationConfirmedInstructionsSv"] = "Confirmed instructions updated sv"
        data["reservationConfirmedInstructionsEn"] = "Confirmed instructions updated en"
        data["reservationCancelledInstructionsFi"] = "Cancelled instructions updated fi"
        data["reservationCancelledInstructionsSv"] = "Cancelled instructions updated sv"
        data["reservationCancelledInstructionsEn"] = "Cancelled instructions updated en"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservationUnit").get("pk")
        ).is_not_none()

        updated_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("updateReservationUnit").get("pk")
        )
        assert_that(updated_unit).is_not_none()
        assert_that(updated_unit.reservation_pending_instructions_fi).is_equal_to(
            data["reservationPendingInstructionsFi"]
        )
        assert_that(updated_unit.reservation_pending_instructions_sv).is_equal_to(
            data["reservationPendingInstructionsSv"]
        )
        assert_that(updated_unit.reservation_pending_instructions_en).is_equal_to(
            data["reservationPendingInstructionsEn"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_fi).is_equal_to(
            data["reservationConfirmedInstructionsFi"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_sv).is_equal_to(
            data["reservationConfirmedInstructionsSv"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_en).is_equal_to(
            data["reservationConfirmedInstructionsEn"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_fi).is_equal_to(
            data["reservationCancelledInstructionsFi"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_sv).is_equal_to(
            data["reservationCancelledInstructionsSv"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_en).is_equal_to(
            data["reservationCancelledInstructionsEn"]
        )
