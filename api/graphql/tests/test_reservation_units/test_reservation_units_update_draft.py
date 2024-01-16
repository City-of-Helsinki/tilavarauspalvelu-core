import json

from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.test import override_settings

from actions.reservation_unit import ReservationUnitHaukiExporter
from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from api.graphql.tests.test_reservation_units.conftest import reservation_unit_update_mutation
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from reservation_units.models import ReservationUnit
from terms_of_use.models import TermsOfUse
from tests.factories import (
    OriginHaukiResourceFactory,
    ReservationMetadataSetFactory,
    ReservationUnitFactory,
    TermsOfUseFactory,
)
from tests.helpers import patch_method
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

    def get_valid_update_data(self):
        return {"pk": self.res_unit.pk, "pricings": []}

    def test_update(self):
        data = self.get_valid_update_data()
        data["nameFi"] = "New name"

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None

        self.res_unit.refresh_from_db()
        assert self.res_unit.name_fi == "New name"

    def test_update_with_metadata_set(self):
        metadata_set = ReservationMetadataSetFactory(name="New form")
        data = self.get_valid_update_data()
        data["metadataSetPk"] = metadata_set.pk
        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        self.res_unit.refresh_from_db()
        assert self.res_unit.metadata_set == metadata_set

    def test_update_with_null_metadata_set(self):
        data = self.get_valid_update_data()
        data["metadataSetPk"] = None
        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        self.res_unit.refresh_from_db()
        assert self.res_unit.metadata_set is None

    def test_update_with_terms_of_use_pks(self):
        payment_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT)
        cancellation_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION)
        service_specific_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_SERVICE)
        data = self.get_valid_update_data()
        data["paymentTermsPk"] = payment_terms.pk
        data["cancellationTermsPk"] = cancellation_terms.pk
        data["serviceSpecificTermsPk"] = service_specific_terms.pk

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is None

        self.res_unit.refresh_from_db()

        assert self.res_unit.payment_terms == payment_terms
        assert self.res_unit.cancellation_terms == cancellation_terms
        assert self.res_unit.service_specific_terms == service_specific_terms

    def test_update_with_authentication(self):
        data = self.get_valid_update_data()
        data["authentication"] = "STRONG"

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is None

        self.res_unit.refresh_from_db()
        assert self.res_unit.authentication == "strong"

    def test_update_errors_with_invalid_authentication(self):
        data = self.get_valid_update_data()
        data["authentication"] = "invalid"
        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None

        assert 'Choice "invalid" is not allowed.' in content.get("errors")[0].get("message")
        self.res_unit.refresh_from_db()
        assert self.res_unit.authentication != "invalid"

    def test_update_errors_with_empty_name(self):
        data = self.get_valid_update_data()
        data["nameFi"] = ""

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "nameFi is required for draft reservation units" in content.get("errors")[0].get("message")

        self.res_unit.refresh_from_db()
        assert self.res_unit.name_fi == "Resunit name"

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        data = self.get_valid_update_data()
        data["nameFi"] = "Better name in my opinion."
        response = self.query(reservation_unit_update_mutation(), input_data=data)

        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None

        self.res_unit.refresh_from_db()
        assert self.res_unit.name == "Resunit name"

    @patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
    @patch_method(HaukiResourceHashUpdater.run)
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called_when_resource_id_exists(self):
        self.res_unit.origin_hauki_resource = OriginHaukiResourceFactory(id=1)
        self.res_unit.save()

        data = self.get_valid_update_data()
        response = self.query(reservation_unit_update_mutation(), input_data=data)

        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1
        assert HaukiResourceHashUpdater.run.call_count == 1

    @patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
    @override_settings(HAUKI_EXPORTS_ENABLED=False)
    def test_send_resource_to_hauki_not_called_when_exports_disabled(self):
        data = self.get_valid_update_data()
        response = self.query(reservation_unit_update_mutation(), input_data=data)

        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 0

    def test_contact_information_removal_on_archive(self):
        data = self.get_valid_update_data()
        data["isArchived"] = True
        data["contactInformation"] = "Liu Kang"

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None

        self.res_unit.refresh_from_db()
        assert self.res_unit.is_archived is True
        assert self.res_unit.contact_information == ""

    def test_audit_log_deletion_on_archive(self):
        self.res_unit.name = "Updated"
        self.res_unit.save()

        content_type_id = ContentType.objects.get(app_label="reservation_units", model="reservationunit").id
        log_entry_count = LogEntry.objects.filter(content_type_id=content_type_id, object_id=self.res_unit.pk).count()

        assert log_entry_count > 1

        data = self.get_valid_update_data()
        data["isArchived"] = True
        data["contactInformation"] = "Liu Kang"

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None

        log_entry_count = LogEntry.objects.filter(content_type_id=content_type_id, object_id=self.res_unit.pk).count()
        assert log_entry_count == 1

    def test_update_with_pricing_fields(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["pricingTermsPk"] = self.pricing_term.pk

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservationUnit").get("pk") is not None

        created_unit = ReservationUnit.objects.get(pk=content.get("data").get("updateReservationUnit").get("pk"))
        assert created_unit is not None
        assert created_unit.pricing_terms == self.pricing_term

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

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservationUnit").get("pk") is not None

        updated_unit = ReservationUnit.objects.get(pk=content.get("data").get("updateReservationUnit").get("pk"))
        assert updated_unit is not None
        assert updated_unit.reservation_pending_instructions_fi == data["reservationPendingInstructionsFi"]
        assert updated_unit.reservation_pending_instructions_sv == data["reservationPendingInstructionsSv"]
        assert updated_unit.reservation_pending_instructions_en == data["reservationPendingInstructionsEn"]
        assert updated_unit.reservation_confirmed_instructions_fi == data["reservationConfirmedInstructionsFi"]
        assert updated_unit.reservation_confirmed_instructions_sv == data["reservationConfirmedInstructionsSv"]
        assert updated_unit.reservation_confirmed_instructions_en == data["reservationConfirmedInstructionsEn"]
        assert updated_unit.reservation_cancelled_instructions_fi == data["reservationCancelledInstructionsFi"]
        assert updated_unit.reservation_cancelled_instructions_sv == data["reservationCancelledInstructionsSv"]
        assert updated_unit.reservation_cancelled_instructions_en == data["reservationCancelledInstructionsEn"]
