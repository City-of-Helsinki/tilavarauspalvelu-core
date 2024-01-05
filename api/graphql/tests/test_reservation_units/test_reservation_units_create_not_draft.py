import datetime
import json
from decimal import Decimal

from django.test import override_settings

from actions.reservation_unit import ReservationUnitHaukiExporter
from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from opening_hours.errors import HaukiAPIError
from reservation_units.enums import ReservationStartInterval
from reservation_units.models import (
    PriceUnit,
    PricingStatus,
    PricingType,
    ReservationKind,
    ReservationUnit,
    TaxPercentage,
)
from tests.factories import (
    EquipmentFactory,
    PurposeFactory,
    QualifierFactory,
    ResourceFactory,
    ServiceFactory,
    SpaceFactory,
)
from tests.helpers import patch_method
from utils.decimal_utils import round_decimal


class ReservationUnitCreateAsNotDraftTestCase(ReservationUnitMutationsTestCaseBase):
    """For publish"""

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

    def get_valid_data(self):
        return {
            "isDraft": False,
            "nameFi": "Resunit name",
            "nameEn": "English name",
            "nameSv": "Swedish name",
            "descriptionFi": "descFi",
            "descriptionEn": "descEn",
            "descriptionSv": "descSV",
            "contactInformation": "contact",
            "spacePks": [self.space.id],
            "resourcePks": [self.resource.id],
            "servicePks": [self.service.id],
            "unitPk": self.unit.id,
            "reservationUnitTypePk": self.reservation_unit_type.id,
            "surfaceArea": 100,
            "maxPersons": 10,
            "minPersons": 1,
            "bufferTimeAfter": 3600,
            "bufferTimeBefore": 3600,
            "cancellationRulePk": self.rule.pk,
            "reservationStartInterval": ReservationStartInterval.INTERVAL_60_MINUTES.value.upper(),
            "publishBegins": "2021-05-03T00:00:00+00:00",
            "publishEnds": "2021-05-03T00:00:00+00:00",
            "reservationBegins": "2021-05-03T00:00:00+00:00",
            "reservationEnds": "2021-05-03T00:00:00+00:00",
            "metadataSetPk": self.metadata_set.pk,
            "maxReservationsPerUser": 2,
            "requireReservationHandling": True,
            "authentication": "STRONG",
            "canApplyFreeOfCharge": True,
            "reservationsMaxDaysBefore": 360,
            "reservationsMinDaysBefore": 1,
            "reservationKind": ReservationKind.DIRECT,
            "pricings": [
                {
                    "begins": datetime.date.today().strftime("%Y-%m-%d"),
                    "pricingType": PricingType.PAID,
                    "priceUnit": PriceUnit.PRICE_UNIT_PER_15_MINS,
                    "lowestPrice": 10.5,
                    "lowestPriceNet": float(round_decimal(Decimal("10.5") / (1 + self.tax_percentage.decimal), 6)),
                    "highestPrice": 18.8,
                    "highestPriceNet": float(round_decimal(Decimal("18.8") / (1 + self.tax_percentage.decimal), 6)),
                    "taxPercentagePk": self.tax_percentage.id,
                    "status": PricingStatus.PRICING_STATUS_ACTIVE,
                }
            ],
        }

    def test_create(self):
        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.is_draft is False
        assert res_unit.id == res_unit_data.get("pk")
        assert res_unit.name_fi == data.get("nameFi")
        assert res_unit.name_en == data.get("nameEn")
        assert res_unit.name_sv == data.get("nameSv")
        assert res_unit.description_fi == data.get("descriptionFi")
        assert res_unit.description_en == data.get("descriptionEn")
        assert res_unit.description_sv == data.get("descriptionSv")
        assert res_unit.spaces.first().id == self.space.id
        assert res_unit.resources.first().id == self.resource.id
        assert res_unit.services.first().id == self.service.id
        assert res_unit.reservation_unit_type == self.reservation_unit_type
        assert res_unit.surface_area == data.get("surfaceArea")
        assert res_unit.max_persons == data.get("maxPersons")
        assert res_unit.min_persons == data.get("minPersons")
        assert res_unit.buffer_time_after == datetime.timedelta(hours=1)
        assert res_unit.buffer_time_before == datetime.timedelta(hours=1)
        assert res_unit.cancellation_rule == self.rule
        assert res_unit.reservation_start_interval.upper() == data.get("reservationStartInterval")
        publish_begins = datetime.datetime.fromisoformat(data.get("publishBegins"))
        assert res_unit.publish_begins == publish_begins
        publish_ends = datetime.datetime.fromisoformat(data.get("publishEnds"))
        assert res_unit.publish_ends == publish_ends
        reservation_begins = datetime.datetime.fromisoformat(data.get("reservationBegins"))
        assert res_unit.reservation_begins == reservation_begins
        reservation_ends = datetime.datetime.fromisoformat(data.get("reservationBegins"))
        assert res_unit.reservation_ends == reservation_ends
        assert res_unit.metadata_set == self.metadata_set
        assert res_unit.max_reservations_per_user == data.get("maxReservationsPerUser")
        assert res_unit.require_reservation_handling is True
        assert res_unit.authentication == "strong"
        assert res_unit.reservation_kind == ReservationKind.DIRECT
        assert res_unit.can_apply_free_of_charge is True
        assert res_unit.reservations_max_days_before == 360
        assert res_unit.reservations_min_days_before == 1

        pricing_data: dict = data["pricings"][0]
        pricing = res_unit.pricings.first()
        tax_percentage = TaxPercentage.objects.get(pk=pricing_data["taxPercentagePk"])

        assert res_unit.pricings.count() == len(data.get("pricings"))
        assert pricing.begins.strftime("%Y-%m-%d") == pricing_data["begins"]
        assert pricing.pricing_type == pricing_data["pricingType"]
        assert pricing.price_unit == pricing_data["priceUnit"]
        assert pricing.lowest_price == round_decimal(Decimal(pricing_data["lowestPrice"]), 2)
        assert pricing.highest_price == round_decimal(Decimal(pricing_data["highestPrice"]), 2)
        assert pricing.tax_percentage == tax_percentage
        assert pricing.status == pricing_data["status"]

    @patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called(self):
        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None
        assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1

    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    @patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki, side_effect=HaukiAPIError())
    def test_send_resource_to_hauki_errors_returns_error_message(self):
        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Sending reservation unit as resource to HAUKI failed." in content.get("errors")[0].get("message")
        assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1
        res_unit = ReservationUnit.objects.first()
        assert res_unit.id is not None
        assert res_unit.name_fi == data["nameFi"]
        assert res_unit.origin_hauki_resource is None

    def test_create_errors_on_empty_name_translations(self):
        data = self.get_valid_data()
        data["nameEn"] = ""
        data["nameSv"] = ""

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft state reservation units must have a translations." in content.get("errors")[0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_missing_name_translations(self):
        data = self.get_valid_data()
        data.pop("nameSv")
        data.pop("nameEn")

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft state reservation units must have a translations." in content.get("errors")[0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_empty_description_translations(self):
        data = self.get_valid_data()
        data["descriptionFi"] = ""
        data["descriptionSv"] = ""
        data["descriptionEn"] = ""

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft state reservation units must have a translations." in content.get("errors")[0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_missing_description_translations(self):
        data = self.get_valid_data()
        data.pop("descriptionFi")
        data.pop("descriptionEn")
        data.pop("descriptionSv")

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft state reservation units must have a translations." in content.get("errors")[0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_empty_space_and_missing_resource(self):
        data = self.get_valid_data()
        data.pop("resourcePks")
        data["spacePks"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft state reservation unit must have one or more space or resource defined" in content.get(
            "errors"
        )[0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_empty_resource_and_missing_space(self):
        data = self.get_valid_data()
        data.pop("spacePks")
        data["resourcePks"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft state reservation unit must have one or more space or resource defined" in content.get(
            "errors"
        )[0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_empty_space_and_resource(self):
        data = self.get_valid_data()
        data["resourcePks"] = []
        data["spacePks"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft state reservation unit must have one or more space or resource defined" in content.get(
            "errors"
        )[0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_missing_space_and_resource(self):
        data = self.get_valid_data()
        data.pop("resourcePks")
        data.pop("spacePks")

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft state reservation unit must have one or more space or resource defined" in content.get(
            "errors"
        )[0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_wrong_type_of_space_pk(self):
        data = self.get_valid_data()
        data["spacePks"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 400
        content = json.loads(response.content)
        assert content.get("errors") is not None

    def test_create_errors_on_wrong_type_of_resource_pk(self):
        data = self.get_valid_data()
        data["resourcePks"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 400
        content = json.loads(response.content)
        assert content.get("errors") is not None

    def test_create_errors_on_reservation_unit_type(self):
        data = self.get_valid_data()
        data.pop("reservationUnitTypePk")

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "Not draft reservation unit must have a reservation unit type." in content["errors"][0].get("message")
        assert not ReservationUnit.objects.exists()

    def test_create_errors_on_wrong_reservation_unit_type(self):
        data = self.get_valid_data()
        data["reservationUnitTypePk"] = -15

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert not ReservationUnit.objects.exists()

    def test_create_with_multiple_spaces(self):
        space_too = SpaceFactory()
        data = self.get_valid_data()
        data["spacePks"] = [self.space.id, space_too.id]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")
        res_units = list(res_unit.spaces.all().order_by("pk").values_list("id", flat=True))
        assert all(res_unit in res_units for res_unit in data.get("spacePks"))

    def test_create_with_multiple_purposes(self):
        purposes = PurposeFactory.create_batch(5)
        data = self.get_valid_data()
        data["purposePks"] = [purpose.id for purpose in purposes]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")
        res_units = list(res_unit.purposes.all().order_by("pk").values_list("id", flat=True))
        assert all(res_unit in res_units for res_unit in data.get("purposePks"))

    def test_create_errors_on_wrong_type_of_purpose_pk(self):
        data = self.get_valid_data()
        data["purposePks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 400
        content = json.loads(response.content)
        assert content.get("errors") is not None

    def test_create_with_multiple_qualifiers(self):
        qualifiers = QualifierFactory.create_batch(5)
        data = self.get_valid_data()
        data["qualifierPks"] = [qualifier.id for qualifier in qualifiers]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")
        res_units = list(res_unit.qualifiers.all().order_by("pk").values_list("id", flat=True))
        assert all(res_unit in res_units for res_unit in data.get("qualifierPks"))

    def test_create_errors_on_wrong_type_of_qualifier_pk(self):
        data = self.get_valid_data()
        data["qualifierPks"] = ["q"]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 400
        content = json.loads(response.content)
        assert content.get("errors") is not None

    def test_create_with_multiple_services(self):
        purposes = ServiceFactory.create_batch(5)
        data = self.get_valid_data()
        data["servicePks"] = [purpose.id for purpose in purposes]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")
        res_units = list(res_unit.services.all().order_by("pk").values_list("id", flat=True))
        assert all(res_unit in res_units for res_unit in data.get("servicePks"))

    def test_create_errors_on_wrong_type_of_service_pk(self):
        data = self.get_valid_data()
        data["servicePks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 400
        content = json.loads(response.content)
        assert content.get("errors") is not None

    def test_create_with_multiple_resources(self):
        resource = ResourceFactory()
        data = self.get_valid_data()
        data["resourcePks"] = [self.resource.id, resource.id]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")
        res_units = list(res_unit.resources.all().order_by("pk").values_list("id", flat=True))
        assert all(res_unit in res_units for res_unit in data.get("resourcePks"))

    def test_create_with_multiple_equipments(self):
        equipments = EquipmentFactory.create_batch(5)
        data = self.get_valid_data()
        data["equipmentPks"] = [equipment.id for equipment in equipments]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.id == res_unit_data.get("pk")
        res_units = list(res_unit.equipments.all().order_by("pk").values_list("id", flat=True))
        assert all(res_unit in res_units for res_unit in data.get("equipmentPks"))

    def test_create_errors_on_wrong_type_of_equipment_pk(self):
        data = self.get_valid_data()
        data["equipmentPks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 400
        content = json.loads(response.content)
        assert content.get("errors") is not None

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

    def test_min_persons_over_max_persons_errors(self):
        data = self.get_valid_data()
        data["minPersons"] = 11

        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert "minPersons can't be more than maxPersons" in content.get("errors")[0].get("message")
        assert ReservationUnit.objects.exists() is False

    def test_reservation_kind_defaults_to_direct_and_season(self):
        data = self.get_valid_data()
        data.pop("reservationKind")
        response = self.query(self.get_create_query(), input_data=data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.reservation_kind == ReservationKind.DIRECT_AND_SEASON

    def test_create_with_instructions(self):
        self.client.force_login(self.general_admin)
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
        assert content.get("errors") is None
        assert content.get("data").get("createReservationUnit").get("pk") is not None

        created_unit = ReservationUnit.objects.get(pk=content.get("data").get("createReservationUnit").get("pk"))
        assert created_unit is not None
        assert created_unit.reservation_pending_instructions_fi == data["reservationPendingInstructionsFi"]
        assert created_unit.reservation_pending_instructions_sv == data["reservationPendingInstructionsSv"]
        assert created_unit.reservation_pending_instructions_en == data["reservationPendingInstructionsEn"]
        assert created_unit.reservation_confirmed_instructions_fi == data["reservationConfirmedInstructionsFi"]
        assert created_unit.reservation_confirmed_instructions_sv == data["reservationConfirmedInstructionsSv"]
        assert created_unit.reservation_confirmed_instructions_en == data["reservationConfirmedInstructionsEn"]
        assert created_unit.reservation_cancelled_instructions_fi == data["reservationCancelledInstructionsFi"]
        assert created_unit.reservation_cancelled_instructions_sv == data["reservationCancelledInstructionsSv"]
        assert created_unit.reservation_cancelled_instructions_en == data["reservationCancelledInstructionsEn"]
