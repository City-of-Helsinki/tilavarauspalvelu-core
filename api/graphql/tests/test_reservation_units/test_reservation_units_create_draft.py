import json
from typing import Any, Dict
from unittest import mock

from assertpy import assert_that
from django.test import override_settings

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from reservation_units.models import PaymentType, PricingType, ReservationUnit


class ReservationUnitCreateAsDraftTestCase(ReservationUnitMutationsTestCaseBase):
    def get_valid_data(self) -> Dict[str, Any]:
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
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORT_ENABLED=True)
    def test_send_resource_to_hauki_is_not_called(self, send_resource_mock):
        response = self.query(self.get_create_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(0)

    def test_create_errors_on_empty_name(self):
        data = self.get_valid_data()
        data["nameFi"] = ""
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_create_with_minimum_fields_success(self):
        data = self.get_valid_data()
        data["nameEn"] = None
        data["descriptionFi"] = None
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))

    def test_create_without_is_draft_with_name_and_unit_fails(self):
        data = self.get_valid_data()
        data["isDraft"] = None
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_data())

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    # TODO: Deprecated
    def test_create_with_pricing_fields(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_data()
        data["pricingType"] = "PAID"
        data["pricingTermsPk"] = self.pricing_term.pk
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("createReservationUnit").get("pk")
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_type).is_equal_to(PricingType.PAID)
        assert_that(created_unit.pricing_terms).is_equal_to(self.pricing_term)

    def test_create_with_payment_types(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_data()
        data["pricingType"] = "PAID"
        data["paymentTypes"] = ["ON_SITE", "INVOICE"]
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("createReservationUnit").get("pk")
        )
        unit_payment_type_codes = list(
            map(lambda ptype: ptype.code, created_unit.payment_types.all())
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_type).is_equal_to(PricingType.PAID)

        assert_that(unit_payment_type_codes).contains_only(
            PaymentType.ON_SITE.value, PaymentType.INVOICE.value
        )

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
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(res_unit.reservation_pending_instructions_fi).is_equal_to(
            data["reservationPendingInstructionsFi"]
        )
        assert_that(res_unit.reservation_pending_instructions_sv).is_equal_to(
            data["reservationPendingInstructionsSv"]
        )
        assert_that(res_unit.reservation_pending_instructions_en).is_equal_to(
            data["reservationPendingInstructionsEn"]
        )
        assert_that(res_unit.reservation_confirmed_instructions_fi).is_equal_to(
            data["reservationConfirmedInstructionsFi"]
        )
        assert_that(res_unit.reservation_confirmed_instructions_sv).is_equal_to(
            data["reservationConfirmedInstructionsSv"]
        )
        assert_that(res_unit.reservation_confirmed_instructions_en).is_equal_to(
            data["reservationConfirmedInstructionsEn"]
        )
        assert_that(res_unit.reservation_cancelled_instructions_fi).is_equal_to(
            data["reservationCancelledInstructionsFi"]
        )
        assert_that(res_unit.reservation_cancelled_instructions_sv).is_equal_to(
            data["reservationCancelledInstructionsSv"]
        )
        assert_that(res_unit.reservation_cancelled_instructions_en).is_equal_to(
            data["reservationCancelledInstructionsEn"]
        )
