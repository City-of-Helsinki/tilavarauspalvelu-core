import json
from typing import Any

from assertpy import assert_that
from django.test import override_settings

from actions.reservation_unit import ReservationUnitHaukiExporter
from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from reservation_units.models import PaymentType, ReservationUnit
from tests.helpers import patch_method


class ReservationUnitCreateAsDraftTestCase(ReservationUnitMutationsTestCaseBase):
    def get_valid_data(self) -> dict[str, Any]:
        return {
            "isDraft": True,
            "nameFi": "Resunit name",
            "nameEn": "English name",
            "descriptionFi": "desc",
            "unitPk": self.unit.pk,
        }

    def get_create_query(self):
        return """
        mutation createReservationUnit($input: ReservationUnitCreateMutationInput!) {
            createReservationUnit(input: $input){
                pk
                errors {
                    messages field
                }
            }
        }
        """

    def test_create(self):
        response = self.query(self.get_create_query(), input_data=self.get_valid_data())
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")

    @patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
    @override_settings(HAUKI_EXPORT_ENABLED=True)
    def test_send_resource_to_hauki_is_not_called(self):
        response = self.query(self.get_create_query(), input_data=self.get_valid_data())
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None
        assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 0

    def test_create_errors_on_empty_name(self):
        data = self.get_valid_data()
        data["nameFi"] = ""
        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

    def test_create_with_minimum_fields_success(self):
        data = self.get_valid_data()
        data["nameEn"] = None
        data["descriptionFi"] = None
        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")

    def test_create_without_is_draft_with_name_and_unit_fails(self):
        data = self.get_valid_data()
        data["isDraft"] = None
        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_data())

        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

    def test_create_with_payment_types(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_data()
        data["paymentTypes"] = ["ON_SITE", "INVOICE"]
        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("createReservationUnit").get("pk") is not None

        created_unit = ReservationUnit.objects.get(pk=content.get("data").get("createReservationUnit").get("pk"))
        unit_payment_type_codes = [ptype.code for ptype in created_unit.payment_types.all()]
        assert created_unit is not None
        assert_that(unit_payment_type_codes).contains_only(PaymentType.ON_SITE.value, PaymentType.INVOICE.value)

    def test_create_with_instructions(self):
        data = self.get_valid_data()
        data["reservationPendingInstructionsFi"] = "Pending instructions fi"
        data["reservationPendingInstructionsSv"] = "Pending instructions sv"
        data["reservationPendingInstructionsEn"] = "Pending instructions en"
        data["reservationConfirmedInstructionsFi"] = "Confirmed instructions fi"
        data["reservationConfirmedInstructionsSv"] = "Confirmed instructions sv"
        data["reservationConfirmedInstructionsEn"] = "Confirmed instructions en"
        data["reservationCancelledInstructionsFi"] = "Cancelled instructions fi"
        data["reservationCancelledInstructionsSv"] = "Cancelled instructions sv"
        data["reservationCancelledInstructionsEn"] = "Cancelled instructions en"

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")

        assert res_unit.reservation_pending_instructions_fi == data["reservationPendingInstructionsFi"]
        assert res_unit.reservation_pending_instructions_sv == data["reservationPendingInstructionsSv"]
        assert res_unit.reservation_pending_instructions_en == data["reservationPendingInstructionsEn"]
        assert res_unit.reservation_confirmed_instructions_fi == data["reservationConfirmedInstructionsFi"]
        assert res_unit.reservation_confirmed_instructions_sv == data["reservationConfirmedInstructionsSv"]
        assert res_unit.reservation_confirmed_instructions_en == data["reservationConfirmedInstructionsEn"]
        assert res_unit.reservation_cancelled_instructions_fi == data["reservationCancelledInstructionsFi"]
        assert res_unit.reservation_cancelled_instructions_sv == data["reservationCancelledInstructionsSv"]
        assert res_unit.reservation_cancelled_instructions_en == data["reservationCancelledInstructionsEn"]
