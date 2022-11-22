import datetime
import json
from decimal import Decimal
from unittest import mock

from assertpy import assert_that
from django.test import override_settings

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from opening_hours.errors import HaukiAPIError
from opening_hours.resources import Resource as HaukiResource
from reservation_units.models import (
    PaymentType,
    PriceUnit,
    PricingStatus,
    PricingType,
    ReservationKind,
    ReservationUnit,
    TaxPercentage,
)
from reservation_units.tests.factories import (
    EquipmentFactory,
    PurposeFactory,
    QualifierFactory,
)
from resources.tests.factories import ResourceFactory
from services.tests.factories import ServiceFactory
from spaces.tests.factories import SpaceFactory


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
            "lowestPrice": 0,
            "highestPrice": 20,
            "priceUnit": PriceUnit.PRICE_UNIT_PER_HOUR.upper(),
            "reservationStartInterval": ReservationUnit.RESERVATION_START_INTERVAL_60_MINUTES.upper(),
            "taxPercentagePk": TaxPercentage.objects.get(value=24).pk,
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
                    "lowestPriceNet": round(
                        float(Decimal("10.5") / (1 + self.tax_percentage.decimal)), 6
                    ),
                    "highestPrice": 18.8,
                    "highestPriceNet": round(
                        float(Decimal("18.8") / (1 + self.tax_percentage.decimal)), 6
                    ),
                    "taxPercentagePk": self.tax_percentage.id,
                    "status": PricingStatus.PRICING_STATUS_ACTIVE,
                }
            ],
        }

    def test_create(self):
        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.is_draft).is_false()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(res_unit.name_fi).is_equal_to(data.get("nameFi"))
        assert_that(res_unit.name_en).is_equal_to(data.get("nameEn"))
        assert_that(res_unit.name_sv).is_equal_to(data.get("nameSv"))
        assert_that(res_unit.description_fi).is_equal_to(data.get("descriptionFi"))
        assert_that(res_unit.description_en).is_equal_to(data.get("descriptionEn"))
        assert_that(res_unit.description_sv).is_equal_to(data.get("descriptionSv"))
        assert_that(res_unit.spaces.first().id).is_equal_to(self.space.id)
        assert_that(res_unit.resources.first().id).is_equal_to(self.resource.id)
        assert_that(res_unit.services.first().id).is_equal_to(self.service.id)
        assert_that(res_unit.reservation_unit_type).is_equal_to(
            self.reservation_unit_type
        )
        assert_that(res_unit.surface_area).is_equal_to(data.get("surfaceArea"))
        assert_that(res_unit.max_persons).is_equal_to(data.get("maxPersons"))
        assert_that(res_unit.min_persons).is_equal_to(data.get("minPersons"))
        assert_that(res_unit.buffer_time_after).is_equal_to(datetime.timedelta(hours=1))
        assert_that(res_unit.buffer_time_before).is_equal_to(
            datetime.timedelta(hours=1)
        )
        assert_that(res_unit.cancellation_rule).is_equal_to(self.rule)
        assert_that(res_unit.lowest_price).is_equal_to(data.get("lowestPrice"))
        assert_that(res_unit.highest_price).is_equal_to(data.get("highestPrice"))
        assert_that(res_unit.price_unit.upper()).is_equal_to(data.get("priceUnit"))
        assert_that(res_unit.reservation_start_interval.upper()).is_equal_to(
            data.get("reservationStartInterval")
        )
        assert_that(res_unit.tax_percentage).is_equal_to(
            TaxPercentage.objects.get(value=24)
        )
        publish_begins = datetime.datetime.fromisoformat(data.get("publishBegins"))
        assert_that(res_unit.publish_begins).is_equal_to(publish_begins)
        publish_ends = datetime.datetime.fromisoformat(data.get("publishEnds"))
        assert_that(res_unit.publish_ends).is_equal_to(publish_ends)
        reservation_begins = datetime.datetime.fromisoformat(
            data.get("reservationBegins")
        )
        assert_that(res_unit.reservation_begins).is_equal_to(reservation_begins)
        reservation_ends = datetime.datetime.fromisoformat(
            data.get("reservationBegins")
        )
        assert_that(res_unit.reservation_ends).is_equal_to(reservation_ends)
        assert_that(res_unit.metadata_set).is_equal_to(self.metadata_set)
        assert_that(res_unit.max_reservations_per_user).is_equal_to(
            data.get("maxReservationsPerUser")
        )
        assert_that(res_unit.require_reservation_handling).is_equal_to(True)
        assert_that(res_unit.authentication).is_equal_to("strong")
        assert_that(res_unit.reservation_kind).is_equal_to(ReservationKind.DIRECT)
        assert_that(res_unit.can_apply_free_of_charge).is_equal_to(True)
        assert_that(res_unit.reservations_max_days_before).is_equal_to(360)
        assert_that(res_unit.reservations_min_days_before).is_equal_to(1)

        pricing_data = data.get("pricings")[0]
        pricing = res_unit.pricings.first()
        tax_percentage = TaxPercentage.objects.get(pk=pricing_data["taxPercentagePk"])

        assert_that(res_unit.pricings.count()).is_equal_to(len(data.get("pricings")))
        assert_that(pricing.begins.strftime("%Y-%m-%d")).is_equal_to(
            pricing_data["begins"]
        )
        assert_that(pricing.pricing_type).is_equal_to(pricing_data["pricingType"])
        assert_that(pricing.price_unit).is_equal_to(pricing_data["priceUnit"])
        assert_that(pricing.lowest_price).is_close_to(
            pricing_data["lowestPrice"], 0.001
        )
        assert_that(pricing.highest_price).is_close_to(
            pricing_data["highestPrice"], 0.001
        )
        assert_that(pricing.tax_percentage).is_equal_to(tax_percentage)
        assert_that(pricing.status).is_equal_to(pricing_data["status"])

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called(self, send_resource_mock):
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

        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
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

        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Sending reservation unit as resource to HAUKI failed."
        )
        assert_that(send_resource_mock.call_count).is_equal_to(1)
        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit.hauki_resource_id).is_none()

    def test_create_errors_on_empty_name_translations(self):
        data = self.get_valid_data()
        data["nameEn"] = ""
        data["nameSv"] = ""

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_missing_name_translations(self):
        data = self.get_valid_data()
        data.pop("nameSv")
        data.pop("nameEn")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_description_translations(self):
        data = self.get_valid_data()
        data["descriptionFi"] = ""
        data["descriptionSv"] = ""
        data["descriptionEn"] = ""

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_missing_description_translations(self):
        data = self.get_valid_data()
        data.pop("descriptionFi")
        data.pop("descriptionEn")
        data.pop("descriptionSv")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_space_and_missing_resource(self):
        data = self.get_valid_data()
        data.pop("resourcePks")
        data["spacePks"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_resource_and_missing_space(self):
        data = self.get_valid_data()
        data.pop("spacePks")
        data["resourcePks"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_space_and_resource(self):
        data = self.get_valid_data()
        data["resourcePks"] = []
        data["spacePks"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_missing_space_and_resource(self):
        data = self.get_valid_data()
        data.pop("resourcePks")
        data.pop("spacePks")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_wrong_type_of_space_pk(self):
        data = self.get_valid_data()
        data["spacePks"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_errors_on_wrong_type_of_resource_pk(self):
        data = self.get_valid_data()
        data["resourcePks"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_errors_on_reservation_unit_type(self):
        data = self.get_valid_data()
        data.pop("reservationUnitTypePk")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft reservation unit must have a reservation unit type."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_wrong_reservation_unit_type(self):
        data = self.get_valid_data()
        data["reservationUnitTypePk"] = -15

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_with_multiple_spaces(self):
        space_too = SpaceFactory()
        data = self.get_valid_data()
        data["spacePks"] = [self.space.id, space_too.id]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.spaces.all().values_list("id", flat=True))).is_in(
            data.get("spacePks")
        )

    def test_create_with_multiple_purposes(self):
        purposes = PurposeFactory.create_batch(5)
        data = self.get_valid_data()
        data["purposePks"] = [purpose.id for purpose in purposes]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.purposes.all().values_list("id", flat=True))).is_in(
            data.get("purposePks")
        )

    def test_create_errors_on_wrong_type_of_purpose_pk(self):
        data = self.get_valid_data()
        data["purposePks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_with_multiple_qualifiers(self):
        qualifiers = QualifierFactory.create_batch(5)
        data = self.get_valid_data()
        data["qualifierPks"] = [qualifier.id for qualifier in qualifiers]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.qualifiers.all().values_list("id", flat=True))).is_in(
            data.get("qualifierPks")
        )

    def test_create_errors_on_wrong_type_of_qualifier_pk(self):
        data = self.get_valid_data()
        data["qualifierPks"] = ["q"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_with_multiple_services(self):
        purposes = ServiceFactory.create_batch(5)
        data = self.get_valid_data()
        data["servicePks"] = [purpose.id for purpose in purposes]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.services.all().values_list("id", flat=True))).is_in(
            data.get("servicePks")
        )

    def test_create_errors_on_wrong_type_of_service_pk(self):
        data = self.get_valid_data()
        data["servicePks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_with_multiple_resources(self):
        resource = ResourceFactory()
        data = self.get_valid_data()
        data["resourcePks"] = [self.resource.id, resource.id]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.resources.all().values_list("id", flat=True))).is_in(
            data.get("resourcePks")
        )

    def test_create_with_multiple_equipments(self):
        equipments = EquipmentFactory.create_batch(5)
        data = self.get_valid_data()
        data["equipmentPks"] = [equipment.id for equipment in equipments]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.equipments.all().values_list("id", flat=True))).is_in(
            data.get("equipmentPks")
        )

    def test_create_errors_on_wrong_type_of_equipment_pk(self):
        data = self.get_valid_data()
        data["equipmentPks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_min_persons_over_max_persons_errors(self):
        data = self.get_valid_data()
        data["minPersons"] = 11

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "minPersons can't be more than maxPersons"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_reservation_kind_defaults_to_direct_and_season(self):
        data = self.get_valid_data()
        data.pop("reservationKind")
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.reservation_kind).is_equal_to(
            ReservationKind.DIRECT_AND_SEASON
        )

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
        data["paymentTypes"] = ["ONLINE", "INVOICE"]

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
            PaymentType.ONLINE.value, PaymentType.INVOICE.value
        )

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
        assert_that(created_unit.reservation_pending_instructions_fi).is_equal_to(
            data["reservationPendingInstructionsFi"]
        )
        assert_that(created_unit.reservation_pending_instructions_sv).is_equal_to(
            data["reservationPendingInstructionsSv"]
        )
        assert_that(created_unit.reservation_pending_instructions_en).is_equal_to(
            data["reservationPendingInstructionsEn"]
        )
        assert_that(created_unit.reservation_confirmed_instructions_fi).is_equal_to(
            data["reservationConfirmedInstructionsFi"]
        )
        assert_that(created_unit.reservation_confirmed_instructions_sv).is_equal_to(
            data["reservationConfirmedInstructionsSv"]
        )
        assert_that(created_unit.reservation_confirmed_instructions_en).is_equal_to(
            data["reservationConfirmedInstructionsEn"]
        )
        assert_that(created_unit.reservation_cancelled_instructions_fi).is_equal_to(
            data["reservationCancelledInstructionsFi"]
        )
        assert_that(created_unit.reservation_cancelled_instructions_sv).is_equal_to(
            data["reservationCancelledInstructionsSv"]
        )
        assert_that(created_unit.reservation_cancelled_instructions_en).is_equal_to(
            data["reservationCancelledInstructionsEn"]
        )
