import datetime
import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

import freezegun
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from applications.models import City
from reservation_units.enums import (
    PriceUnit,
    PricingStatus,
    PricingType,
    ReservationStartInterval,
)
from reservations.choices import CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from reservations.models import (
    AgeGroup,
    Reservation,
    ReservationMetadataField,
)
from tests.factories import (
    ApplicationRoundFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    TaxPercentageFactory,
)
from utils.decimal_utils import round_decimal

DEFAULT_TIMEZONE = get_default_timezone()


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@override_settings(LOCALE_PATHS=[])
class ReservationUpdateTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.reservation_begin = datetime.datetime.now(tz=get_default_timezone())
        self.reservation_end = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1)
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=self.reservation_begin,
            end=self.reservation_end,
            state=ReservationStateChoice.CREATED,
            user=self.regular_joe,
            unit_price=10,
            tax_percentage_value=24,
            price=10,
            price_net=Decimal(10) / (Decimal("1.24")),
        )

    def get_update_query(self):
        return """
            mutation updateReservation($input: ReservationUpdateMutationInput!) {
                updateReservation(input: $input) {
                    reservation {
                        pk
                        calendarUrl
                    }
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_update_data(self):
        return {
            "pk": self.reservation.pk,
            "begin": (self.reservation_begin + datetime.timedelta(hours=1)).isoformat(),
            "end": (self.reservation_end + datetime.timedelta(hours=1)).isoformat(),
        }

    def test_updating_reservation_succeed(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_update_data())
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.user == self.regular_joe
        assert reservation.state == ReservationStateChoice.CREATED
        assert reservation.begin == self.reservation_begin + datetime.timedelta(hours=1)
        assert reservation.end == self.reservation_end + datetime.timedelta(hours=1)

    def test_updating_reservation_reservee_language_succeed(self):
        self.client.force_login(self.regular_joe)
        data = self.get_valid_update_data()
        data["reserveeLanguage"] = "fi"

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.reservee_language == "fi"

    def test_updating_reservation_with_pk_fails(self):
        new_pk = 9999
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data["pk"] = new_pk
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert not Reservation.objects.filter(pk=new_pk).exists()

    def test_updating_reservation_with_price_fails(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data["price"] = 0
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        self.reservation.refresh_from_db()
        assert self.reservation.price != 0

    def test_updating_reservation_with_invalid_reservee_type_fails(self):
        self.client.force_login(self.regular_joe)
        invalid_reservee_type = "invalid"
        data = self.get_valid_update_data()
        data["reserveeType"] = invalid_reservee_type
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert 'Choice "invalid"' in content.get("errors")[0].get("message")
        self.reservation.refresh_from_db()
        assert self.reservation.reservee_type != invalid_reservee_type

    def test_update_fails_when_overlapping_reservation(self):
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2),
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_update_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Overlapping reservations are not allowed."
        assert content.get("errors")[0]["extensions"]["error_code"] == "OVERLAPPING_RESERVATIONS"

    def test_update_fails_when_buffer_time_overlaps_reservation_before(self):
        begin = datetime.datetime.now(tz=get_default_timezone()) - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_after=datetime.timedelta(hours=1, minutes=1),
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.reservation.id},
        )
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation overlaps with reservation before due to buffer time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_OVERLAP"

    def test_update_fails_when_buffer_time_overlaps_reservation_after(self):
        begin = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_before=datetime.timedelta(hours=1, minutes=1),
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_update_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation overlaps with reservation after due to buffer time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_OVERLAP"

    def test_update_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_before(self):
        self.reservation_unit.buffer_time_before = datetime.timedelta(hours=1, minutes=1)
        self.reservation_unit.save()
        begin = self.reservation_begin - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data.pop("begin")
        input_data.pop("end")
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation overlaps with reservation before due to buffer time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_OVERLAP"

    def test_update_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_after(self):
        self.reservation_unit.buffer_time_after = datetime.timedelta(hours=1, minutes=1)
        self.reservation_unit.save()
        begin = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_update_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation overlaps with reservation after due to buffer time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_OVERLAP"

    def test_update_fails_when_reservation_unit_closed_on_selected_time(self):
        input_data = self.get_valid_update_data()
        today = datetime.date.today()
        begin = datetime.datetime(today.year, today.month, today.day, 21, 0, tzinfo=get_default_timezone())
        end = begin + datetime.timedelta(hours=2)
        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation unit is not open within desired reservation time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_IS_NOT_OPEN"

    def test_update_succeed_when_reservation_unit_closed_on_selected_time_and_opening_hours_are_ignored(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        input_data = self.get_valid_update_data()
        today = datetime.date.today()
        begin = datetime.datetime(
            today.year,
            today.month,
            today.day,
            21,
            0,
        ).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(hours=2)
        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%S%z")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%S%z")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        reservation_id = content.get("data").get("updateReservation").get("reservation").get("pk")
        assert reservation_id >= 1
        saved_reservation = Reservation.objects.get(pk=reservation_id)
        assert saved_reservation is not None
        assert saved_reservation.begin == begin
        assert saved_reservation.end == end

    def test_update_fails_when_reservation_unit_in_open_application_round_decimal(self):
        ApplicationRoundFactory.create_in_status_open(
            reservation_units=[self.reservation_unit],
            reservation_period_begin=datetime.date.today(),
            reservation_period_end=datetime.date.today() + datetime.timedelta(days=10),
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_update_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "One or more reservation units are in open application round."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_IN_OPEN_ROUND"

    def test_update_fails_when_reservation_unit_max_reservation_duration_exceeds(self):
        self.reservation_unit.max_reservation_duration = datetime.timedelta(minutes=30)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_update_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert (
            content.get("errors")[0]["message"]
            == "Reservation duration exceeds one or more reservation unit's maximum duration."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNITS_MAX_DURATION_EXCEEDED"

    def test_update_fails_when_reservation_unit_min_reservation_duration_subsides(self):
        self.reservation_unit.max_reservation_duration = None
        self.reservation_unit.min_reservation_duration = datetime.timedelta(hours=2)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_update_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert (
            content.get("errors")[0]["message"]
            == "Reservation duration less than one or more reservation unit's minimum duration."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED"

    def test_update_fails_when_not_permission(self):
        citizen = get_user_model().objects.create(
            username="citzen",
            first_name="citi",
            last_name="zen",
            email="zen.citi@foo.com",
        )
        res = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2),
            state=ReservationStateChoice.CREATED,
            user=citizen,
        )
        input_data = self.get_valid_update_data()
        input_data["pk"] = res.pk
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message") == "No permission to mutate"

    def test_update_to_cancelled_success(self):
        input_data = self.get_valid_update_data()
        input_data["state"] = ReservationStateChoice.CANCELLED.upper()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.state == ReservationStateChoice.CANCELLED

    def test_update_to_confirmed_fails(self):
        input_data = self.get_valid_update_data()
        input_data["state"] = ReservationStateChoice.CONFIRMED
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert (
            content.get("errors")[0]["message"]
            == f"Setting the reservation state to {ReservationStateChoice.CONFIRMED} is not allowed."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "STATE_CHANGE_NOT_ALLOWED"

    def test_update_succeeds_when_reservation_unit_has_no_metadata_set(self):
        self.reservation_unit.metadata_set = None
        self.reservation_unit.save(update_fields=["metadata_set"])
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation.reservee_first_name == input_data["reserveeFirstName"]

    def test_update_succeeds_when_all_required_fields_are_filled(self):
        self.reservation_unit.metadata_set = self._create_metadata_set()
        self.reservation_unit.save(update_fields=["metadata_set"])
        home_city = City.objects.create(name="Helsinki")
        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["homeCityPk"] = home_city.pk
        input_data["ageGroupPk"] = age_group.pk
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation.reservee_first_name == input_data["reserveeFirstName"]
        assert self.reservation.reservee_last_name == input_data["reserveeLastName"]
        assert self.reservation.reservee_phone == input_data["reserveePhone"]
        assert self.reservation.home_city == home_city
        assert self.reservation.age_group == age_group

    def test_update_succeeds_when_missing_reservee_id_but_is_unregistered_org(self):
        metadata_set = self._create_metadata_set()
        reservee_id_field = ReservationMetadataField.objects.get(field_name="reservee_id")
        metadata_set.required_fields.add(reservee_id_field)
        metadata_set.supported_fields.add(reservee_id_field)
        self.reservation_unit.metadata_set = metadata_set
        self.reservation_unit.save(update_fields=["metadata_set"])

        home_city = City.objects.create(name="Helsinki")
        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["homeCityPk"] = home_city.pk
        input_data["ageGroupPk"] = age_group.pk
        input_data["reserveeIsUnregisteredAssociation"] = True

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation.reservee_first_name == input_data["reserveeFirstName"]
        assert self.reservation.reservee_last_name == input_data["reserveeLastName"]
        assert self.reservation.reservee_phone == input_data["reserveePhone"]
        assert self.reservation.home_city == home_city
        assert self.reservation.age_group == age_group

    def test_update_succeeds_when_missing_home_city_for_individual(self):
        metadata_set = self._create_metadata_set()
        self.reservation_unit.metadata_set = metadata_set
        self.reservation_unit.save(update_fields=["metadata_set"])

        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["ageGroupPk"] = age_group.pk
        input_data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation.reservee_first_name == input_data["reserveeFirstName"]
        assert self.reservation.reservee_last_name == input_data["reserveeLastName"]
        assert self.reservation.reservee_phone == input_data["reserveePhone"]
        assert self.reservation.age_group == age_group

    def test_update_succeeds_when_missing_reservee_id_for_individual(self):
        metadata_set = self._create_metadata_set()
        reservee_id_field = ReservationMetadataField.objects.get(field_name="reservee_id")
        metadata_set.required_fields.add(reservee_id_field)
        metadata_set.supported_fields.add(reservee_id_field)
        self.reservation_unit.metadata_set = metadata_set
        self.reservation_unit.save(update_fields=["metadata_set"])

        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["ageGroupPk"] = age_group.pk
        input_data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation.reservee_first_name == input_data["reserveeFirstName"]
        assert self.reservation.reservee_last_name == input_data["reserveeLastName"]
        assert self.reservation.reservee_phone == input_data["reserveePhone"]
        assert self.reservation.age_group == age_group

    def test_update_succeeds_when_missing_reservee_organisation_name_for_individual(self):
        metadata_set = self._create_metadata_set()
        reservee_organisation_name_field = ReservationMetadataField.objects.get(field_name="reservee_organisation_name")
        metadata_set.required_fields.add(reservee_organisation_name_field)
        metadata_set.supported_fields.add(reservee_organisation_name_field)
        self.reservation_unit.metadata_set = metadata_set
        self.reservation_unit.save(update_fields=["metadata_set"])

        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["ageGroupPk"] = age_group.pk
        input_data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation.reservee_first_name == input_data["reserveeFirstName"]
        assert self.reservation.reservee_last_name == input_data["reserveeLastName"]
        assert self.reservation.reservee_phone == input_data["reserveePhone"]
        assert self.reservation.age_group == age_group

    def test_update_fails_when_some_required_fields_are_missing(self):
        self.reservation_unit.metadata_set = self._create_metadata_set()
        self.reservation_unit.save(update_fields=["metadata_set"])
        home_city = City.objects.create(name="Helsinki")
        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = None
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["homeCityPk"] = home_city.pk
        input_data["ageGroupPk"] = age_group.pk
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert 'Tämän kentän arvo ei voi olla "null".' in content.get("errors")[0].get("message")
        self.reservation.refresh_from_db()
        assert self.reservation.reservee_last_name != input_data["reserveeLastName"]
        assert self.reservation.reservee_phone != input_data["reserveePhone"]
        assert self.reservation.home_city != home_city
        assert self.reservation.age_group != age_group

    def test_update_reservation_succeeds_when_max_reservations_per_user_reached(self):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])
        self.client.force_login(self.regular_joe)
        update_data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation is not None

    def test_updating_reservation_with_staff_event_succeed(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_update_data()
        input_data["type"] = ReservationTypeChoice.STAFF
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.type == ReservationTypeChoice.STAFF

    def test_updating_reservation_with_type_succeed(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_update_data()
        input_data["type"] = "blocked"
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.type == "blocked"

    def test_updating_fails_when_type_is_provided_without_permissions(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data["type"] = "blocked"
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message") == "You don't have permissions to set type"

    def test_update_reservation_price_calculation_not_triggered(self):
        self.client.force_login(self.regular_joe)

        update_data = self.get_valid_update_data()
        update_data["begin"] = self.reservation.begin.strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = self.reservation.end.strftime("%Y%m%dT%H%M%S%zZ")
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation is not None
        assert self.reservation.price == 10
        assert self.reservation.unit_price == 10
        assert self.reservation.tax_percentage_value == 24
        assert self.reservation.price_net == round_decimal(
            self.reservation.price / (1 + self.reservation.tax_percentage_value / Decimal("100")), 6
        )

    def test_update_reservation_price_calculation_when_begin_changes(self):
        self.client.force_login(self.regular_joe)

        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        update_data = self.get_valid_update_data()
        update_data["begin"] = (self.reservation.begin + datetime.timedelta(hours=-1)).strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = self.reservation.end.strftime("%Y%m%dT%H%M%S%zZ")
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation is not None
        assert self.reservation.price == 3.0
        assert self.reservation.unit_price == 3.0
        assert self.reservation.tax_percentage_value == tax_percentage.value
        assert self.reservation.price_net == round_decimal(self.reservation.price / tax_percentage.multiplier, 6)
        assert self.reservation.non_subsidised_price == round_decimal(self.reservation.price, 6)
        assert self.reservation.non_subsidised_price_net == self.reservation.price_net

    def test_update_reservation_price_calculation_when_end_changes(self):
        self.client.force_login(self.regular_joe)

        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        update_data = self.get_valid_update_data()
        update_data["begin"] = self.reservation.begin.strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = (self.reservation.end + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%S%zZ")
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation is not None
        assert self.reservation.price == 3.0
        assert self.reservation.unit_price == 3.0
        assert self.reservation.tax_percentage_value == tax_percentage.value
        assert self.reservation.price_net == round_decimal(self.reservation.price / tax_percentage.multiplier, 6)
        assert self.reservation.non_subsidised_price == round_decimal(self.reservation.price, 6)
        assert self.reservation.non_subsidised_price_net == self.reservation.price_net

    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler.ReservationUnitReservationScheduler.is_reservation_unit_open"
    )
    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler.ReservationUnitReservationScheduler.get_conflicting_open_application_round"
    )
    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler.ReservationUnitReservationScheduler.get_reservation_unit_possible_start_times"
    )
    def test_update_reservation_price_calculation_when_unit_changes(
        self,
        mock_get_reservation_unit_possible_start_times,
        mock_get_conflicting_open_application_round,
        mock_is_open,
    ):
        mock_is_open.return_value = True
        mock_get_conflicting_open_application_round.return_value = None
        mock_get_reservation_unit_possible_start_times.return_value = [datetime.datetime.now(tz=DEFAULT_TIMEZONE)]

        self.client.force_login(self.regular_joe)

        tax_percentage = TaxPercentageFactory()

        new_unit = ReservationUnitFactory(
            spaces=[self.space],
            unit=self.unit,
            name="new_unit",
            reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES.value,
            reservation_unit_type=self.reservation_unit_type,
            sku=self.reservation_unit.sku,
        )

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=2.0,
            highest_price=4.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=new_unit,
        )

        update_data = self.get_valid_update_data()
        update_data["begin"] = self.reservation.begin.strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = self.reservation.end.strftime("%Y%m%dT%H%M%S%zZ")
        update_data["reservationUnitPks"] = [new_unit.pk]

        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation is not None
        assert self.reservation.price == 4.0
        assert self.reservation.unit_price == 4.0
        assert self.reservation.tax_percentage_value == tax_percentage.value
        assert self.reservation.price_net == round_decimal(self.reservation.price / tax_percentage.multiplier, 6)
        assert self.reservation.non_subsidised_price == round_decimal(self.reservation.price, 6)
        assert self.reservation.non_subsidised_price_net == self.reservation.price_net

    def test_update_reservation_price_calculation_when_begin_changes_to_future(self):
        self.client.force_login(self.regular_joe)

        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        ReservationUnitPricingFactory(
            begins=datetime.date.today() + datetime.timedelta(days=2),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=4.0,
            highest_price=6.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_FUTURE,
            reservation_unit=self.reservation_unit,
        )

        update_data = self.get_valid_update_data()
        update_data["begin"] = (self.reservation.begin + datetime.timedelta(days=2)).strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = (self.reservation.end + datetime.timedelta(days=2)).strftime("%Y%m%dT%H%M%S%zZ")
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("errors") is None
        self.reservation.refresh_from_db()
        assert self.reservation is not None
        assert self.reservation.price == 6.0
        assert self.reservation.unit_price == 6.0
        assert self.reservation.tax_percentage_value == tax_percentage.value
        assert self.reservation.price_net == round_decimal(self.reservation.price / tax_percentage.multiplier, 6)
        assert self.reservation.non_subsidised_price == round_decimal(self.reservation.price, 6)
        assert self.reservation.non_subsidised_price_net == self.reservation.price_net

    def test_require_free_of_charge_reason_if_applying_for_free_of_charge(self):
        self.client.force_login(self.regular_joe)

        data = self.get_valid_update_data()
        data["applyingForFreeOfCharge"] = True

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert (
            content.get("errors")[0]["message"]
            == "Free of charge reason is mandatory when applying for free of charge."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE"

    @override_settings(PREFILL_RESERVATION_WITH_PROFILE_DATA=True)
    @patch("users.utils.open_city_profile.basic_info_resolver.requests.get")
    def test_reservation_details_does_not_get_overriden_with_profile_data(self, mock_profile_call):
        data = {
            "data": {
                "myProfile": {
                    "firstName": "John",
                    "lastName": "Doe",
                    "primaryAddress": {
                        "postalCode": "00100",
                        "address": "Test street 1",
                        "city": "Helsinki",
                        "addressType": "HOME",
                    },
                    "primaryPhone": {
                        "phone": "123456789",
                    },
                    "verifiedPersonalInformation": {
                        "municipalityOfResidence": "Helsinki",
                        "municipalityOfResidenceNumber": "12345",
                    },
                }
            }
        }
        mock_profile_call.return_value = MagicMock(status_code=200, json=MagicMock(return_value=data))

        input_data = self.get_valid_update_data()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert mock_profile_call.call_count == 0
        assert content.get("errors") is None
        assert content.get("data").get("updateReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.user == self.regular_joe
        assert reservation.state == ReservationStateChoice.CREATED
        assert reservation.begin == self.reservation_begin + datetime.timedelta(hours=1)
        assert reservation.end == self.reservation_end + datetime.timedelta(hours=1)
        assert reservation.reservee_first_name != "John"
