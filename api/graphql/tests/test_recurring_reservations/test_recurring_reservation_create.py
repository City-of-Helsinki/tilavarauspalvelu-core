import datetime
import json

import freezegun
from assertpy import assert_that

from api.graphql.tests.base import GrapheneTestCaseBase
from api.graphql.tests.test_reservations.base import DEFAULT_TIMEZONE
from api.graphql.validation_errors import ValidationErrorCodes
from permissions.models import (
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import RecurringReservation
from reservations.tests.factories import AbilityGroupFactory, AgeGroupFactory
from spaces.tests.factories import ServiceSectorFactory, UnitFactory
from tilavarauspalvelu.utils.commons import WEEKDAYS


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class RecurringReservationTestCase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.res_begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        cls.res_end = cls.res_begin + datetime.timedelta(weeks=52, hours=1)
        GeneralRolePermission.objects.create(
            role=GeneralRoleChoice.objects.get(code="admin"),
            permission="can_create_staff_reservations",
        )
        cls.age_group = AgeGroupFactory(minimum=0, maximum=99)
        cls.ability_group = AbilityGroupFactory(name="test ab group")
        cls.unit = UnitFactory()
        cls.service_sector = ServiceSectorFactory(units=[cls.unit])
        cls.reservation_unit = ReservationUnitFactory(unit=cls.unit)

    def get_create_query(self):
        return """
            mutation createRecurringReservation($input: RecurringReservationCreateMutationInput!) {
                createRecurringReservation(input: $input) {
                    recurringReservation {
                        pk
                    }
                }
            }
        """

    def get_valid_minimum_input_data(self):
        return {
            "weekdays": [WEEKDAYS.MONDAY],
            "beginTime": self.res_begin.strftime("%H%M%S"),
            "endTime": self.res_end.strftime("%H%M%S"),
            "beginDate": self.res_begin.strftime("%Y%m%d"),
            "endDate": self.res_end.strftime("%Y%m%d"),
            "reservationUnitPk": self.reservation_unit.pk,
            "recurrenceInDays": 7,
        }

    def get_valid_optional_full_input_data(self):
        data = self.get_valid_minimum_input_data()
        data.update(
            {
                "name": "Test name",
                "description": "Recurring reservation description here.",
                "abilityGroupPk": self.ability_group.id,
                "ageGroupPk": self.age_group.id,
            }
        )
        return data

    def test_general_admin_can_create(self):
        self.client.force_login(self.general_admin)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_minimum_input_data()
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        )
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.weekday_list).is_equal_to([WEEKDAYS.MONDAY])
        assert_that(recurring.begin_time).is_equal_to(self.res_begin.time())
        assert_that(recurring.end_time).is_equal_to(self.res_end.time())
        assert_that(recurring.begin_date).is_equal_to(self.res_begin.date())
        assert_that(recurring.end_date).is_equal_to(self.res_end.date())
        assert_that(recurring.reservation_unit).is_equal_to(self.reservation_unit)
        assert_that(recurring.recurrence_in_days).is_equal_to(7)
        assert_that(recurring.name).is_empty()

    def test_service_sector_admin_can_create(self):
        self.client.force_login(self.create_service_sector_admin(self.service_sector))
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_create_staff_reservations",
        )

        response = self.query(
            self.get_create_query(), input_data=self.get_valid_minimum_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        )
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.weekday_list).is_equal_to([WEEKDAYS.MONDAY])
        assert_that(recurring.begin_time).is_equal_to(self.res_begin.time())
        assert_that(recurring.end_time).is_equal_to(self.res_end.time())
        assert_that(recurring.begin_date).is_equal_to(self.res_begin.date())
        assert_that(recurring.end_date).is_equal_to(self.res_end.date())
        assert_that(recurring.reservation_unit).is_equal_to(self.reservation_unit)
        assert_that(recurring.recurrence_in_days).is_equal_to(7)
        assert_that(recurring.name).is_empty()

    def test_unit_admin_can_create(self):
        self.client.force_login(self.create_unit_admin(self.unit))
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_create_staff_reservations",
        )

        response = self.query(
            self.get_create_query(), input_data=self.get_valid_minimum_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        )
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.weekday_list).is_equal_to([WEEKDAYS.MONDAY])
        assert_that(recurring.begin_time).is_equal_to(self.res_begin.time())
        assert_that(recurring.end_time).is_equal_to(self.res_end.time())
        assert_that(recurring.begin_date).is_equal_to(self.res_begin.date())
        assert_that(recurring.end_date).is_equal_to(self.res_end.date())
        assert_that(recurring.reservation_unit).is_equal_to(self.reservation_unit)
        assert_that(recurring.recurrence_in_days).is_equal_to(7)
        assert_that(recurring.name).is_empty()

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_minimum_input_data()

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains_ignoring_case(
            "No permission to mutate"
        )

        assert_that(RecurringReservation.objects.exists()).is_false()

    def test_create_fails_when_end_time_before_begin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        end = input_data["beginTime"]
        begin = input_data["endTime"]
        input_data["beginTime"] = begin
        input_data["endTime"] = end

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            ValidationErrorCodes.RESERVATION_BEGIN_AFTER_END.value
        )

        assert_that(RecurringReservation.objects.exists()).is_false()

    def test_create_fails_when_end_date_before_begin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        end = input_data["beginDate"]
        begin = input_data["endDate"]
        input_data["beginDate"] = begin
        input_data["endDate"] = end

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            ValidationErrorCodes.RESERVATION_BEGIN_AFTER_END.value
        )

        assert_that(RecurringReservation.objects.exists()).is_false()

    def test_create_fails_missing_required_fields(self):
        self.client.force_login(self.general_admin)
        required_fields = [
            "beginDate",
            "beginTime",
            "endTime",
            "endDate",
            "reservationUnitPk",
            "recurrenceInDays",
            "weekdays",
        ]

        for field in required_fields:
            input_data = self.get_valid_minimum_input_data()
            input_data.pop(field)

            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)

            assert_that(content.get("errors")).is_not_none()
            assert_that(RecurringReservation.objects.exists()).is_false()

    def test_optional_fields(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_optional_full_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        )
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.weekday_list).is_equal_to([WEEKDAYS.MONDAY])
        assert_that(recurring.begin_time).is_equal_to(self.res_begin.time())
        assert_that(recurring.end_time).is_equal_to(self.res_end.time())
        assert_that(recurring.begin_date).is_equal_to(self.res_begin.date())
        assert_that(recurring.end_date).is_equal_to(self.res_end.date())
        assert_that(recurring.reservation_unit).is_equal_to(self.reservation_unit)
        assert_that(recurring.recurrence_in_days).is_equal_to(7)
        assert_that(recurring.name).is_equal_to("Test name")
        assert_that(recurring.age_group_id).is_equal_to(self.age_group.id)
        assert_that(recurring.ability_group_id).is_equal_to(self.ability_group.id)
        assert_that(recurring.description).is_equal_to(input_data["description"])

    def test_recurrence_in_days_not_in_allowed_values(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        input_data["recurrenceInDays"] = 1

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            ValidationErrorCodes.INVALID_RECURRENCE_IN_DAY.value
        )

        assert_that(RecurringReservation.objects.exists()).is_false()

    def test_user_is_request_user(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

        pk = (
            content.get("data")
            .get("createRecurringReservation")
            .get("recurringReservation")
            .get("pk")
        )
        recurring = RecurringReservation.objects.get(id=pk)

        assert_that(recurring.user).is_equal_to(self.general_admin)
