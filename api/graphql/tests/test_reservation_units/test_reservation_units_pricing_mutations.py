import datetime
import json
from typing import Any, Dict

from assertpy import assert_that

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from reservation_units.models import PricingStatus, PricingType, ReservationUnit


class ReservationUnitPricingMutationsTestCase(ReservationUnitMutationsTestCaseBase):
    def get_valid_data(self, isDraft: bool) -> Dict[str, Any]:
        return {
            "isDraft": isDraft,
            "nameFi": "Pricing test unit FI",
            "nameEn": "Pricing test unit EN",
            "nameSv": "Pricing test unit SV",
            "descriptionFi": "Unit for pricing testing FI",
            "descriptionEn": "Unit for pricing testing EN",
            "descriptionSv": "Unit for pricing testing SV",
            "spacePks": [self.space.id],
            "resourcePks": [self.resource.id],
            "servicePks": [self.service.id],
            "unitPk": self.unit.id,
            "reservationUnitTypePk": self.reservation_unit_type.id,
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

    def get_pricing_data(self, **kwargs):
        data = {
            "begins": "2022-09-11",
            "pricingType": "PAID",
            "priceUnit": "PER_15_MINS",
            "lowestPrice": 18.2,
            "highestPrice": 21.5,
            "taxPercentagePk": 2,
            "status": "ACTIVE",
        }

        data.update(kwargs)

        return data

    def test_pricing_is_not_required_on_create_for_drafts(self):
        response = self.query(self.get_create_query(), input_data=self.get_valid_data(True))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.pricings.count()).is_equal_to(0)

    def test_pricing_is_required_on_create_for_non_drafts(self):
        response = self.query(self.get_create_query(), input_data=self.get_valid_data(False))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "pricings is required and must have one ACTIVE and one optional FUTURE pricing"
        )

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_allow_only_one_active_pricing(self):
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [
            self.get_pricing_data(begins="2022-09-10"),
            self.get_pricing_data(),
        ]
        response = self.query(self.get_create_query(), input_data=input_data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "reservation unit must have exactly one ACTIVE pricing"
        )

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_allow_only_one_future_pricing(self):
        future_pricing_date = datetime.date.today() + datetime.timedelta(days=2)
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [
            self.get_pricing_data(),
            self.get_pricing_data(begins=future_pricing_date.strftime("%Y-%m-%d"), status="FUTURE"),
            self.get_pricing_data(begins=future_pricing_date.strftime("%Y-%m-%d"), status="FUTURE"),
        ]
        response = self.query(self.get_create_query(), input_data=input_data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "reservation unit can have only one FUTURE pricing"
        )

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_mutating_past_pricings_is_not_allowed(self):
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [
            self.get_pricing_data(),
            self.get_pricing_data(begins="2022-01-01", status="PAST"),
        ]
        response = self.query(self.get_create_query(), input_data=input_data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "only ACTIVE and FUTURE pricings can be mutated"
        )

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_active_pricing_must_be_today_or_in_the_past(self):
        pricing_data = datetime.date.today() + datetime.timedelta(days=1)
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [self.get_pricing_data(begins=pricing_data.strftime("%Y-%m-%d"))]
        response = self.query(self.get_create_query(), input_data=input_data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).starts_with("ACTIVE pricing must be in")

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_future_pricing_must_be_in_the_future(self):
        pricing_date = datetime.date.today()
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [self.get_pricing_data(begins=pricing_date.strftime("%Y-%m-%d"), status="FUTURE")]
        response = self.query(self.get_create_query(), input_data=input_data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).starts_with("FUTURE pricing must be in")

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_pricing_can_miss_fields(self):
        pricing_date = datetime.date.today()
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [
            {
                "begins": pricing_date.strftime("%Y-%m-%d"),
                "pricingType": "FREE",
                "status": "ACTIVE",
            }
        ]
        response = self.query(self.get_create_query(), input_data=input_data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit.pricings.count()).is_equal_to(1)

        pricing = res_unit.pricings.first()
        assert_that(pricing.begins).is_equal_to(datetime.date.today())
        assert_that(pricing.pricing_type).is_equal_to(PricingType.FREE)
        assert_that(pricing.status).is_equal_to(PricingStatus.PRICING_STATUS_ACTIVE)
        assert_that(pricing.lowest_price).is_zero()
        assert_that(pricing.highest_price).is_zero()
        assert_that(pricing.lowest_price_net).is_zero()
        assert_that(pricing.highest_price_net).is_zero()
        assert_that(pricing.tax_percentage.value).is_zero()

    def test_active_pricing_can_be_created_on_update(self):
        create_data = self.get_valid_data(True)
        response = self.query(self.get_create_query(), input_data=create_data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        resunit_pk = content.get("data").get("createReservationUnit").get("pk")

        update_data = create_data.copy()
        update_data["pk"] = resunit_pk
        update_data["isDraft"] = False
        update_data["pricings"] = [
            self.get_pricing_data(begins="2022-09-16", lowestPrice=20.2, highestPrice=31.5),
        ]

        response = self.query(self.get_update_query(), input_data=update_data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        updated_resunit = ReservationUnit.objects.get(pk=resunit_pk)
        assert_that(updated_resunit.pricings.count()).is_equal_to(1)

    def test_future_pricing_can_be_created_on_update(self):
        create_data = self.get_valid_data(False)
        create_data["pricings"] = [self.get_pricing_data(begins="2022-09-16")]
        response = self.query(self.get_create_query(), input_data=create_data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        resunit_pk = content.get("data").get("createReservationUnit").get("pk")

        created_resunit = ReservationUnit.objects.get(pk=resunit_pk)
        future_pricing_date = datetime.date.today() + datetime.timedelta(days=2)

        update_data = create_data.copy()
        update_data["pk"] = resunit_pk
        update_data["pricings"][0]["pk"] = created_resunit.pricings.first().pk
        update_data["pricings"].append(
            self.get_pricing_data(
                begins=future_pricing_date.strftime("%Y-%m-%d"),
                lowestPrice=20.2,
                highestPrice=31.5,
                status="FUTURE",
                taxPercentagePk=1,
            ),
        )

        response = self.query(self.get_update_query(), input_data=update_data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        updated_resunit = ReservationUnit.objects.get(pk=resunit_pk)
        assert_that(updated_resunit.pricings.count()).is_equal_to(2)

    def test_update_cannot_add_another_active_pricing(self):
        create_data = self.get_valid_data(False)
        create_data["pricings"] = [self.get_pricing_data(begins="2022-09-16")]
        response = self.query(self.get_create_query(), input_data=create_data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        resunit_pk = content.get("data").get("createReservationUnit").get("pk")

        update_data = create_data.copy()
        update_data["pk"] = resunit_pk
        update_data["pricings"] = [
            self.get_pricing_data(
                begins="2022-01-01",
                lowestPrice=20.2,
                highestPrice=31.5,
                taxPercentagePk=1,
            )
        ]

        response = self.query(self.get_update_query(), input_data=update_data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "ACTIVE pricing is already defined. Only one ACTIVE pricing is allowed"
        )

    def test_update_cannot_add_another_future_pricing(self):
        future_pricing_date = datetime.date.today() + datetime.timedelta(days=2)
        create_data = self.get_valid_data(True)
        create_data["pricings"] = [
            self.get_pricing_data(begins=future_pricing_date.strftime("%Y-%m-%d"), status="FUTURE"),
        ]
        response = self.query(self.get_create_query(), input_data=create_data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        resunit_pk = content.get("data").get("createReservationUnit").get("pk")

        update_data = create_data.copy()
        update_data["pk"] = resunit_pk
        update_data["pricings"] = [
            self.get_pricing_data(
                begins=future_pricing_date.strftime("%Y-%m-%d"),
                taxPercentagePk=1,
                status="FUTURE",
            ),
        ]

        response = self.query(self.get_update_query(), input_data=update_data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "FUTURE pricing is already defined. Only one FUTURE pricing is allowed"
        )

    def test_update_can_remove_pricings(self):
        future_pricing_date = datetime.date.today() + datetime.timedelta(days=2)
        create_data = self.get_valid_data(True)
        create_data["pricings"] = [
            self.get_pricing_data(begins="2022-01-01", lowestPrice=15.1, highestPrice=18.2),
            self.get_pricing_data(begins=future_pricing_date.strftime("%Y-%m-%d"), status="FUTURE"),
        ]
        response = self.query(self.get_create_query(), input_data=create_data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        resunit_pk = content.get("data").get("createReservationUnit").get("pk")

        update_data = create_data.copy()
        update_data["pk"] = resunit_pk
        update_data["pricings"] = []

        response = self.query(self.get_update_query(), input_data=update_data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        updated_resunit = ReservationUnit.objects.get(pk=resunit_pk)
        assert_that(updated_resunit.pricings.count()).is_equal_to(0)
