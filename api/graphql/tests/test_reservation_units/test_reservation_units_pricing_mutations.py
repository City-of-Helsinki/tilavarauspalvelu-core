import datetime
import json
from typing import Any

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitMutationsTestCaseBase,
)
from api.graphql.tests.test_reservation_units.conftest import (
    reservation_unit_create_mutation,
    reservation_unit_update_mutation,
)
from reservation_units.enums import PricingStatus, PricingType
from reservation_units.models import ReservationUnit


class ReservationUnitPricingMutationsTestCase(ReservationUnitMutationsTestCaseBase):
    def get_valid_data(self, is_draft: bool) -> dict[str, Any]:
        return {
            "isDraft": is_draft,
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
        response = self.query(reservation_unit_create_mutation, input_data=self.get_valid_data(True))
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit is not None
        assert res_unit.pricings.count() == 0

    def test_pricing_is_required_on_create_for_non_drafts(self):
        response = self.query(reservation_unit_create_mutation, input_data=self.get_valid_data(False))
        assert response.status_code == 200
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert (
            content.get("errors")[0].get("message")
            == "pricings is required and must have one ACTIVE and one optional FUTURE pricing"
        )

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

    def test_allow_only_one_active_pricing(self):
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [
            self.get_pricing_data(begins="2022-09-10"),
            self.get_pricing_data(),
        ]
        response = self.query(reservation_unit_create_mutation, input_data=input_data)

        assert response.status_code == 200
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message") == "reservation unit must have exactly one ACTIVE pricing"

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

    def test_allow_only_one_future_pricing(self):
        future_pricing_date = datetime.date.today() + datetime.timedelta(days=2)
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [
            self.get_pricing_data(),
            self.get_pricing_data(begins=future_pricing_date.strftime("%Y-%m-%d"), status="FUTURE"),
            self.get_pricing_data(begins=future_pricing_date.strftime("%Y-%m-%d"), status="FUTURE"),
        ]
        response = self.query(reservation_unit_create_mutation, input_data=input_data)

        assert response.status_code == 200
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message") == "reservation unit can have only one FUTURE pricing"

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

    def test_mutating_past_pricings_is_not_allowed(self):
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [
            self.get_pricing_data(),
            self.get_pricing_data(begins="2022-01-01", status="PAST"),
        ]
        response = self.query(reservation_unit_create_mutation, input_data=input_data)

        assert response.status_code == 200
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message") == "only ACTIVE and FUTURE pricings can be mutated"

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

    def test_active_pricing_must_be_today_or_in_the_past(self):
        pricing_data = datetime.date.today() + datetime.timedelta(days=1)
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [self.get_pricing_data(begins=pricing_data.strftime("%Y-%m-%d"))]
        response = self.query(reservation_unit_create_mutation, input_data=input_data)

        assert response.status_code == 200
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message").startswith("ACTIVE pricing must be in")

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

    def test_future_pricing_must_be_in_the_future(self):
        pricing_date = datetime.date.today()
        input_data = self.get_valid_data(True)
        input_data["pricings"] = [self.get_pricing_data(begins=pricing_date.strftime("%Y-%m-%d"), status="FUTURE")]
        response = self.query(reservation_unit_create_mutation, input_data=input_data)

        assert response.status_code == 200
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message").startswith("FUTURE pricing must be in")

        res_unit = ReservationUnit.objects.first()
        assert res_unit is None

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
        response = self.query(reservation_unit_create_mutation, input_data=input_data)
        assert response.status_code == 200
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        res_unit = ReservationUnit.objects.first()
        assert res_unit.pricings.count() == 1

        pricing = res_unit.pricings.first()
        assert pricing.begins == datetime.date.today()
        assert pricing.pricing_type == PricingType.FREE
        assert pricing.status == PricingStatus.PRICING_STATUS_ACTIVE
        assert pricing.lowest_price == 0
        assert pricing.highest_price == 0
        assert pricing.lowest_price_net == 0
        assert pricing.highest_price_net == 0
        assert pricing.tax_percentage.value == 0

    def test_active_pricing_can_be_created_on_update(self):
        create_data = self.get_valid_data(True)
        response = self.query(reservation_unit_create_mutation, input_data=create_data)

        assert response.status_code == 200
        content = json.loads(response.content)
        resunit_pk = content.get("data").get("createReservationUnit").get("pk")

        update_data = create_data.copy()
        update_data["pk"] = resunit_pk
        update_data["isDraft"] = False
        update_data["pricings"] = [
            self.get_pricing_data(begins="2022-09-16", lowestPrice=20.2, highestPrice=31.5),
        ]

        response = self.query(reservation_unit_update_mutation(), input_data=update_data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is None

        updated_resunit = ReservationUnit.objects.get(pk=resunit_pk)
        assert updated_resunit.pricings.count() == 1

    def test_future_pricing_can_be_created_on_update(self):
        create_data = self.get_valid_data(False)
        create_data["pricings"] = [self.get_pricing_data(begins="2022-09-16")]
        response = self.query(reservation_unit_create_mutation, input_data=create_data)

        assert response.status_code == 200
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

        response = self.query(reservation_unit_update_mutation(), input_data=update_data)
        assert response.status_code == 200

        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        updated_resunit = ReservationUnit.objects.get(pk=resunit_pk)
        assert updated_resunit.pricings.count() == 2

    def test_update_cannot_add_another_active_pricing(self):
        create_data = self.get_valid_data(False)
        create_data["pricings"] = [self.get_pricing_data(begins="2022-09-16")]
        response = self.query(reservation_unit_create_mutation, input_data=create_data)

        assert response.status_code == 200
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

        response = self.query(reservation_unit_update_mutation(), input_data=update_data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert (
            content.get("errors")[0].get("message")
            == "ACTIVE pricing is already defined. Only one ACTIVE pricing is allowed"
        )

    def test_update_cannot_add_another_future_pricing(self):
        future_pricing_date = datetime.date.today() + datetime.timedelta(days=2)
        create_data = self.get_valid_data(True)
        create_data["pricings"] = [
            self.get_pricing_data(begins=future_pricing_date.strftime("%Y-%m-%d"), status="FUTURE"),
        ]
        response = self.query(reservation_unit_create_mutation, input_data=create_data)
        assert response.status_code == 200
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

        response = self.query(reservation_unit_update_mutation(), input_data=update_data)
        assert response.status_code == 200

        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert (
            content.get("errors")[0].get("message")
            == "FUTURE pricing is already defined. Only one FUTURE pricing is allowed"
        )

    def test_update_can_remove_pricings(self):
        future_pricing_date = datetime.date.today() + datetime.timedelta(days=2)
        create_data = self.get_valid_data(True)
        create_data["pricings"] = [
            self.get_pricing_data(begins="2022-01-01", lowestPrice=15.1, highestPrice=18.2),
            self.get_pricing_data(begins=future_pricing_date.strftime("%Y-%m-%d"), status="FUTURE"),
        ]
        response = self.query(reservation_unit_create_mutation, input_data=create_data)
        assert response.status_code == 200
        content = json.loads(response.content)
        resunit_pk = content.get("data").get("createReservationUnit").get("pk")

        update_data = create_data.copy()
        update_data["pk"] = resunit_pk
        update_data["pricings"] = []

        response = self.query(reservation_unit_update_mutation(), input_data=update_data)
        assert response.status_code == 200

        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert content.get("errors") is None
        assert res_unit_data.get("errors") is None

        updated_resunit = ReservationUnit.objects.get(pk=resunit_pk)
        assert updated_resunit.pricings.count() == 0
