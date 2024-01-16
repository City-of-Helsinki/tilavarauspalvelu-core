import json
from decimal import Decimal

from django.test import override_settings

from actions.reservation_unit import ReservationUnitHaukiExporter
from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from api.graphql.tests.test_reservation_units.conftest import reservation_unit_update_mutation
from merchants.models import PaymentType
from opening_hours.errors import HaukiAPIError
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from reservation_units.enums import ReservationStartInterval
from reservation_units.models import ReservationUnit
from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory
from tests.helpers import patch_method


class ReservationUnitUpdateNotDraftTestCase(ReservationUnitMutationsTestCaseBase):
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
        self.res_unit.origin_hauki_resource = None
        self.res_unit.save()

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

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert res_unit_data.get("errors") is None
        self.res_unit.refresh_from_db()
        assert self.res_unit.name_fi == "New name"

    @patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called_when_no_resource_id(self):
        data = self.get_valid_update_data()
        response = self.query(reservation_unit_update_mutation(), input_data=data)

        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None
        assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1

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
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None
        assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1
        assert HaukiResourceHashUpdater.run.call_count == 1

    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    @patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki, side_effect=HaukiAPIError())
    def test_send_resource_to_hauki_errors_returns_error_message(self):
        data = self.get_valid_update_data()
        response = self.query(reservation_unit_update_mutation(), input_data=data)

        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Sending reservation unit as resource to HAUKI failed." in content.get("errors")[0].get("message")
        assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1

    def test_update_surface_area(self):
        expected_surface_area = 150
        data = self.get_valid_update_data()
        data["surfaceArea"] = expected_surface_area
        response = self.query(
            reservation_unit_update_mutation(selections="surfaceArea errors {messages field}"),
            input_data=data,
        )
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert res_unit_data.get("errors") is None
        assert Decimal(res_unit_data.get("surfaceArea")) == Decimal(expected_surface_area)
        self.res_unit.refresh_from_db()
        assert Decimal(self.res_unit.surface_area) == Decimal(expected_surface_area)

    def test_update_reservation_confirmed_instructions(self):
        expected_fi = "Lisätietoja"
        expected_sv = "Ytterligare instruktioner"
        expected_en = "Additional instructions"
        data = self.get_valid_update_data()
        data["reservationConfirmedInstructionsFi"] = expected_fi
        data["reservationConfirmedInstructionsSv"] = expected_sv
        data["reservationConfirmedInstructionsEn"] = expected_en

        response = self.query(
            reservation_unit_update_mutation(
                selections="""
                    reservationConfirmedInstructionsFi
                    reservationConfirmedInstructionsSv
                    reservationConfirmedInstructionsEn
                    errors {messages field}
                """
            ),
            input_data=data,
        )
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert res_unit_data.get("errors") is None
        assert res_unit_data.get("reservationConfirmedInstructionsFi") == expected_fi
        assert res_unit_data.get("reservationConfirmedInstructionsSv") == expected_sv
        assert res_unit_data.get("reservationConfirmedInstructionsEn") == expected_en
        self.res_unit.refresh_from_db()
        assert self.res_unit.reservation_confirmed_instructions_fi == expected_fi
        assert self.res_unit.reservation_confirmed_instructions_sv == expected_sv
        assert self.res_unit.reservation_confirmed_instructions_en == expected_en

    def test_update_max_reservations_per_user(self):
        expected_max_reservations_per_user = 10
        data = self.get_valid_update_data()
        data["maxReservationsPerUser"] = expected_max_reservations_per_user
        response = self.query(
            reservation_unit_update_mutation(selections="maxReservationsPerUser errors {messages field}"),
            input_data=data,
        )
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert res_unit_data.get("errors") is None
        assert res_unit_data.get("maxReservationsPerUser") == expected_max_reservations_per_user
        self.res_unit.refresh_from_db()
        assert self.res_unit.max_reservations_per_user == expected_max_reservations_per_user

    def test_update_cancellation_rule(self):
        data = self.get_valid_update_data()
        data.update({"cancellationRulePk": self.rule.pk})
        response = self.query(
            reservation_unit_update_mutation(selections="errors {messages field}"),
            input_data=data,
        )
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert res_unit_data.get("errors") is None
        self.res_unit.refresh_from_db()
        assert self.res_unit.cancellation_rule == self.rule

    def test_update_cancellation_rule_to_null(self):
        self.res_unit.cancellation_rule = self.rule
        self.res_unit.save()
        self.res_unit.refresh_from_db()
        assert self.res_unit.cancellation_rule == self.rule
        data = self.get_valid_update_data()
        data.update({"cancellationRulePk": None})
        response = self.query(
            reservation_unit_update_mutation(selections="errors {messages field}"),
            input_data=data,
        )
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert res_unit_data.get("errors") is None
        self.res_unit.refresh_from_db()
        assert self.res_unit.cancellation_rule is None

    def test_reservation_start_interval_cannot_be_invalid(self):
        invalid_interval = "invalid"
        data = self.get_valid_update_data()
        data["reservationStartInterval"] = invalid_interval
        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        self.res_unit.refresh_from_db()
        assert self.res_unit.reservation_start_interval != invalid_interval

    def test_errors_on_empty_name_translations(self):
        data = self.get_valid_update_data()
        data["nameEn"] = ""

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert "Not draft state reservation units must have a translations." in content.get("errors")[0].get("message")

        self.res_unit.refresh_from_db()
        assert self.res_unit.name_en is not None
        assert len(self.res_unit.name_en) > 0

    def test_errors_on_empty_description_translations(self):
        data = self.get_valid_update_data()
        data["descriptionEn"] = ""

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is not None

        self.res_unit.refresh_from_db()
        assert len(self.res_unit.description_en) > 0

    def test_errors_on_empty_space_and_resource(self):
        data = self.get_valid_update_data()
        data["spacePks"] = []
        data["resourcePks"] = []

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)

        assert content.get("errors") is not None
        error_message = "Not draft state reservation unit must have one or more space or resource defined"
        assert error_message in content.get("errors")[0].get("message")

        self.res_unit.refresh_from_db()
        assert self.res_unit.spaces.exists()
        assert self.res_unit.resources.exists()

    def test_errors_on_empty_type(self):
        data = self.get_valid_update_data()
        data["reservationUnitTypePk"] = None

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is not None

        self.res_unit.refresh_from_db()
        assert self.res_unit.reservation_unit_type is not None

    def test_update_reservation_start_interval(self):
        expected_interval = ReservationStartInterval.INTERVAL_60_MINUTES.value
        data = self.get_valid_update_data()
        data["reservationStartInterval"] = expected_interval.upper()
        response = self.query(
            reservation_unit_update_mutation(selections="reservationStartInterval errors {messages field}"),
            input_data=data,
        )
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert res_unit_data.get("errors") is None
        assert res_unit_data.get("reservationStartInterval") == expected_interval.upper()
        self.res_unit.refresh_from_db()
        assert self.res_unit.reservation_start_interval == expected_interval

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

    def test_min_persons_over_max_persons_errors(self):
        data = self.get_valid_update_data()
        data["minPersons"] = 11

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "minPersons can't be more than maxPersons" in content.get("errors")[0].get("message")

        self.res_unit.refresh_from_db()
        assert self.res_unit.min_persons is None

    def test_min_persons_updates(self):
        data = self.get_valid_update_data()
        data["minPersons"] = 1

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        self.res_unit.refresh_from_db()
        assert self.res_unit.min_persons == 1

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

    def test_update_with_payment_types(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["paymentTypes"] = ["ON_SITE", "INVOICE"]

        response = self.query(reservation_unit_update_mutation(), input_data=data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservationUnit").get("pk") is not None

        updated_unit = ReservationUnit.objects.get(pk=content.get("data").get("updateReservationUnit").get("pk"))
        unit_payment_type_codes = [ptype.code for ptype in updated_unit.payment_types.all()]
        assert updated_unit is not None
        assert len(unit_payment_type_codes) == 2
        assert PaymentType.ON_SITE.value in unit_payment_type_codes
        assert PaymentType.INVOICE.value in unit_payment_type_codes

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
