import datetime
import json

import freezegun
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from api.graphql.tests.test_reservations.base import DEFAULT_TIMEZONE
from api.graphql.validation_errors import ValidationErrorCodes
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import RecurringReservation
from reservations.tests.factories import RecurringReservationFactory
from spaces.tests.factories import ServiceSectorFactory, UnitFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class RecurringReservationUpdateTestCase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.res_begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        cls.res_end = cls.res_begin + datetime.timedelta(weeks=52, hours=1)
        cls.unit = UnitFactory()
        cls.reservation_unit = ReservationUnitFactory(unit=cls.unit)
        cls.service_sector = ServiceSectorFactory(units=[cls.unit])
        cls.recurring = RecurringReservationFactory(
            begin_time=cls.res_begin.time(),
            begin_date=cls.res_begin.date(),
            end_time=cls.res_end.time(),
            end_date=cls.res_end.date(),
            reservation_unit=cls.reservation_unit,
        )

    def get_update_query(self):
        return """
               mutation updateRecurringReservation($input: RecurringReservationUpdateMutationInput!) {
                   updateRecurringReservation(input: $input) {
                       recurringReservation {
                           pk
                       }
                   }
               }
           """

    def get_valid_input_data(self):
        return {"pk": self.recurring.id, "name": "A fancy testing name"}

    def test_general_admin_can_update(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()

        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateRecurringReservation").get("recurringReservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("updateRecurringReservation").get("recurringReservation").get("pk")
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.name).is_equal_to(input_data["name"])

    def test_service_sector_admin_can_update(self):
        self.client.force_login(self.create_service_sector_admin(self.service_sector))
        input_data = self.get_valid_input_data()

        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateRecurringReservation").get("recurringReservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("updateRecurringReservation").get("recurringReservation").get("pk")
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.name).is_equal_to(input_data["name"])

    def test_unit_admin_can_update(self):
        self.client.force_login(self.create_unit_admin(self.unit))
        input_data = self.get_valid_input_data()

        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateRecurringReservation").get("recurringReservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("updateRecurringReservation").get("recurringReservation").get("pk")
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.name).is_equal_to(input_data["name"])

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()

        response = self.query(self.get_update_query(), input_data=input_data)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()

    def test_update_fails_when_end_time_before_begin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["endTime"] = datetime.time(self.recurring.begin_time.hour - 1, 0).strftime("%H%M%S")

        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            ValidationErrorCodes.RESERVATION_BEGIN_AFTER_END.value
        )

        recurring = RecurringReservation.objects.first()
        assert_that(recurring.end_time).is_equal_to(self.res_end.time())

    def test_update_fails_when_end_date_before_begin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["endDate"] = (self.recurring.begin_date - datetime.timedelta(days=1)).strftime("%Y%m%d")

        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            ValidationErrorCodes.RESERVATION_BEGIN_AFTER_END.value
        )

        recurring = RecurringReservation.objects.first()
        assert_that(recurring.end_date).is_equal_to(self.res_end.date())

    def test_reservation_unit_is_not_updatable(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["reservationUnitPk"] = 23

        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()

        recurring = RecurringReservation.objects.first()
        assert_that(recurring.reservation_unit).is_equal_to(self.reservation_unit)

    def test_description_can_be_emptied(self):
        self.recurring.description = "Some description"
        self.recurring.save()

        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["description"] = ""

        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateRecurringReservation").get("recurringReservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("updateRecurringReservation").get("recurringReservation").get("pk")
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.description).is_empty()
