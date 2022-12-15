import json
from unittest import mock

from assertpy import assert_that
from django.test import override_settings

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from merchants.models import PaymentType
from opening_hours.errors import HaukiAPIError
from opening_hours.resources import Resource as HaukiResource
from reservation_units.models import ReservationUnit
from reservation_units.tests.factories import ReservationUnitFactory


class ReservationUnitUpdateNotDraftTestCase(ReservationUnitMutationsTestCaseBase):
    """For published resunits"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.res_unit = ReservationUnitFactory(
            is_draft=False,
            name_fi="Resunit name",
            name_en="Resunit name",
            name_sv="Resunit name",
            description_fi="Desc",
            description_en="Desc",
            description_sv="Desc",
            contact_information="Info",
            reservation_unit_type=cls.reservation_unit_type,
            unit=cls.unit,
            max_persons=10,
        )
        cls.res_unit.spaces.add(cls.space)
        cls.res_unit.resources.add(cls.resource)

    def setUp(self):
        super().setUp()
        self.res_unit.hauki_resource_id = None
        self.res_unit.save()

    def get_update_query(self):
        return """
        mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
            updateReservationUnit(input: $input){
                pk
                errors {
                    messages field
                }
            }
        }
        """

    def get_valid_update_data(self):
        return {
            "pk": self.res_unit.pk,
            "pricings": [
                {
                    "begins": "2022-09-13",
                    "pricingType": "PAID",
                    "priceUnit": "PER_30_MINS",
                    "lowestPrice": 110.0,
                    "highestPrice": 115.5,
                    "taxPercentagePk": 2,
                    "status": "ACTIVE",
                },
            ],
        }

    def test_update(self):
        data = self.get_valid_update_data()
        data["nameFi"] = "New name"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_fi).is_equal_to("New name")

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called_when_no_resource_id(
        self, send_resource_mock
    ):
        res = HaukiResource(
            id=1,
            name="",
            description="",
            address=None,
            origin_data_source_name="Tilavarauspalvelu",
            origin_data_source_id="tvp",
            origin_id="",
            organization="department_id",
            parents=[],
            children=[],
            resource_type="",
        )
        send_resource_mock.return_value = res

        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(1)

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
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(1)

    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    def test_send_resource_to_hauki_errors_returns_error_message(
        self, send_resource_mock
    ):
        send_resource_mock.side_effect = HaukiAPIError()

        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Sending reservation unit as resource to HAUKI failed."
        )
        assert_that(send_resource_mock.call_count).is_equal_to(1)

    def test_update_surface_area(self):
        expected_surface_area = 150
        data = self.get_valid_update_data()
        data["surfaceArea"] = expected_surface_area
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input) {
                    surfaceArea
                    errors {
                        messages
                        field
                    }
                }
            }
        """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(res_unit_data.get("surfaceArea")).is_equal_to(expected_surface_area)
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.surface_area).is_equal_to(expected_surface_area)

    def test_update_reservation_confirmed_instructions(self):
        expected_fi = "Lisätietoja"
        expected_sv = "Ytterligare instruktioner"
        expected_en = "Additional instructions"
        data = self.get_valid_update_data()
        data["reservationConfirmedInstructionsFi"] = expected_fi
        data["reservationConfirmedInstructionsSv"] = expected_sv
        data["reservationConfirmedInstructionsEn"] = expected_en
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input) {
                    reservationConfirmedInstructionsFi
                    reservationConfirmedInstructionsSv
                    reservationConfirmedInstructionsEn
                    errors {
                        messages
                        field
                    }
                }
            }
        """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(
            res_unit_data.get("reservationConfirmedInstructionsFi")
        ).is_equal_to(expected_fi)
        assert_that(
            res_unit_data.get("reservationConfirmedInstructionsSv")
        ).is_equal_to(expected_sv)
        assert_that(
            res_unit_data.get("reservationConfirmedInstructionsEn")
        ).is_equal_to(expected_en)
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_confirmed_instructions_fi).is_equal_to(
            expected_fi
        )
        assert_that(self.res_unit.reservation_confirmed_instructions_sv).is_equal_to(
            expected_sv
        )
        assert_that(self.res_unit.reservation_confirmed_instructions_en).is_equal_to(
            expected_en
        )

    def test_update_max_reservations_per_user(self):
        expected_max_reservations_per_user = 10
        data = self.get_valid_update_data()
        data["maxReservationsPerUser"] = expected_max_reservations_per_user
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                    updateReservationUnit(input: $input) {
                        maxReservationsPerUser
                        errors {
                            messages
                            field
                        }
                    }
                }
            """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(res_unit_data.get("maxReservationsPerUser")).is_equal_to(
            expected_max_reservations_per_user
        )
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.max_reservations_per_user).is_equal_to(
            expected_max_reservations_per_user
        )

    def test_update_cancellation_rule(self):
        data = self.get_valid_update_data()
        data.update({"cancellationRulePk": self.rule.pk})
        update_query = """
                    mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                        updateReservationUnit(input: $input) {
                            errors {
                                messages
                                field
                            }
                        }
                    }
                """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.cancellation_rule).is_equal_to(self.rule)

    def test_update_cancellation_rule_to_null(self):
        self.res_unit.cancellation_rule = self.rule
        self.res_unit.save()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.cancellation_rule).is_equal_to(self.rule)

        data = self.get_valid_update_data()
        data.update({"cancellationRulePk": None})
        update_query = """
                    mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                        updateReservationUnit(input: $input) {
                            errors {
                                messages
                                field
                            }
                        }
                    }
                """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.cancellation_rule).is_none()

    def test_reservation_start_interval_cannot_be_invalid(self):
        invalid_interval = "invalid"
        data = self.get_valid_update_data()
        data["reservationStartInterval"] = invalid_interval
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_start_interval).is_not_equal_to(
            invalid_interval
        )

    def test_errors_on_empty_name_translations(self):
        data = self.get_valid_update_data()
        data["nameEn"] = ""

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_en).is_not_empty()

    def test_errors_on_empty_description_translations(self):
        data = self.get_valid_update_data()
        data["descriptionEn"] = ""

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.description_en).is_not_empty()

    def test_errors_on_empty_space_and_resource(self):
        data = self.get_valid_update_data()
        data["spacePks"] = []
        data["resourcePks"] = []

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.spaces.exists()).is_true()
        assert_that(self.res_unit.resources.exists()).is_true()

    def test_errors_on_empty_type(self):
        data = self.get_valid_update_data()
        data["reservationUnitTypePk"] = None

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_unit_type).is_not_none()

    def test_update_reservation_start_interval(self):
        expected_interval = ReservationUnit.RESERVATION_START_INTERVAL_60_MINUTES
        data = self.get_valid_update_data()
        data["reservationStartInterval"] = expected_interval.upper()
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input) {
                    reservationStartInterval
                    errors {
                        messages
                        field
                    }
                }
            }
        """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(res_unit_data.get("reservationStartInterval")).is_equal_to(
            expected_interval.upper()
        )
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_start_interval).is_equal_to(
            expected_interval
        )

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

    def test_min_persons_over_max_persons_errors(self):
        data = self.get_valid_update_data()
        data["minPersons"] = 11

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "minPersons can't be more than maxPersons"
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.min_persons).is_none()

    def test_min_persons_updates(self):
        data = self.get_valid_update_data()
        data["minPersons"] = 1

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.min_persons).is_equal_to(1)

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

    def test_update_with_payment_types(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["paymentTypes"] = ["ON_SITE", "INVOICE"]

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
        unit_payment_type_codes = list(
            map(lambda ptype: ptype.code, updated_unit.payment_types.all())
        )
        assert_that(updated_unit).is_not_none()
        assert_that(unit_payment_type_codes).contains_only(
            PaymentType.ON_SITE.value, PaymentType.INVOICE.value
        )

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
