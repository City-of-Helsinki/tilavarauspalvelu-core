import datetime
import json
from decimal import Decimal

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from email_notification.models import EmailType
from reservation_units.enums import ReservationStartInterval
from reservations.choices import ReservationStateChoice
from tests.factories import (
    ApplicationRoundFactory,
    EmailTemplateFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitPricingFactory,
)

DEFAULT_TIMEZONE = get_default_timezone()


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class ReservationAdjustTimeTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.cancel_rule = ReservationUnitCancellationRuleFactory(
            name="default rule",
            can_be_cancelled_time_before=datetime.timedelta(hours=0),
            needs_handling=False,
        )
        cls.reservation_unit.cancellation_rule = cls.cancel_rule
        cls.reservation_unit.save()

        cls.reservation_begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        cls.reservation_end = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(hours=1)
        cls.reservation = ReservationFactory.create(
            reservation_units=[cls.reservation_unit],
            reservee_email=cls.regular_joe.email,
            begin=cls.reservation_begin,
            end=cls.reservation_end,
            state=ReservationStateChoice.CONFIRMED,
            user=cls.regular_joe,
            priority=100,
            unit_price=0,
            tax_percentage_value=24,
            price=0,
            price_net=Decimal(0) / (Decimal("1.24")),
        )

        EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content="", subject="modified")

        EmailTemplateFactory(
            type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
            content="",
            subject="staff",
        )

    def get_update_query(self):
        return """
            mutation adjustTime($input: ReservationAdjustTimeMutationInput!) {
                adjustReservationTime(input: $input) {
                    begin
                    end
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_adjust_data(self):
        return {
            "pk": self.reservation.pk,
            "begin": (self.reservation_begin + datetime.timedelta(hours=1)).isoformat(),
            "end": (self.reservation_end + datetime.timedelta(hours=1)).isoformat(),
        }

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_time_change_success(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is None

        payload = content.get("data").get("adjustReservationTime")
        assert payload.get("errors") is None

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin + datetime.timedelta(hours=1))
        assert_that(self.reservation.end).is_equal_to(self.reservation_end + datetime.timedelta(hours=1))
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("modified")

    def test_wrong_state_fails(self):
        self.reservation.state = ReservationStateChoice.CANCELLED
        self.reservation.save()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CANCELLED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_new_reservation_begin_in_past_fails(self):
        data = self.get_valid_adjust_data()
        data["begin"] = (self.reservation_begin - datetime.timedelta(hours=5)).strftime("%Y%m%dT%H%M%S%zZ")
        data["end"] = (self.reservation_end - datetime.timedelta(hours=5)).strftime("%Y%m%dT%H%M%S%zZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_BEGIN_IN_PAST")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_reservation_begin_in_past_fails(self):
        self.reservation.begin = self.reservation_begin - datetime.timedelta(hours=5)
        self.reservation.end = self.reservation_end - datetime.timedelta(hours=5)
        self.reservation.save()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_CURRENT_BEGIN_IN_PAST")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin - datetime.timedelta(hours=5))
        assert_that(self.reservation.end).is_equal_to(self.reservation_end - datetime.timedelta(hours=5))

    def test_reservation_unit_missing_cancellation_rule_fails(self):
        self.reservation_unit.cancellation_rule = None
        self.reservation_unit.save()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("CANCELLATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_cancellation_rule_time_limit_exceed_fails(self):
        self.cancel_rule.can_be_cancelled_time_before = datetime.timedelta(hours=24)
        self.cancel_rule.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("CANCELLATION_TIME_PAST")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_cancellation_rule_has_needs_handling_fails(self):
        self.cancel_rule.needs_handling = True
        self.cancel_rule.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("CANCELLATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_reservation_is_already_handled_fails(self):
        self.reservation.handled_at = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        self.reservation.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_reservation_has_price_to_be_paid_fails(self):
        self.reservation.price_net = Decimal(1)
        self.reservation.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("CANCELLATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_new_time_causes_price_change_fails(self):
        money_making_date = datetime.date.today() + datetime.timedelta(days=1)
        ReservableTimeSpanFactory(
            resource=self.reservation_unit.origin_hauki_resource,
            start_datetime=datetime.datetime.combine(money_making_date, datetime.time(hour=6)),
            end_datetime=datetime.datetime.combine(money_making_date, datetime.time(hour=22)),
        )
        ReservationUnitPricingFactory(
            begins=money_making_date,
            reservation_unit=self.reservation_unit,
        )
        data = self.get_valid_adjust_data()
        data["begin"] = (datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(days=1)).strftime(
            "%Y%m%dT%H%M%S%zZ"
        )
        data["end"] = (datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(days=1, hours=1)).strftime(
            "%Y%m%dT%H%M%S%zZ"
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_reservation_unit_not_reservable_in_new_time_fails(self):
        self.reservation_unit.reservation_begins = self.reservation_begin + datetime.timedelta(days=1)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_UNIT_NOT_RESERVABLE")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_new_time_overlaps_another_fails(self):
        ReservationFactory(
            reservation_units=[self.reservation_unit],
            begin=self.reservation_begin + datetime.timedelta(hours=1),
            end=self.reservation_end + datetime.timedelta(hours=1),
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("OVERLAPPING_RESERVATIONS")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_new_time_duration_under_min_duration_fails(self):
        self.reservation_unit.min_reservation_duration = datetime.timedelta(hours=2)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_new_time_duration_over_max_duration_fails(self):
        self.reservation_unit.max_reservation_duration = datetime.timedelta(seconds=2)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_UNITS_MAX_DURATION_EXCEEDED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_overlaps_with_buffer_time_fails(self):
        ReservationFactory(
            reservation_units=[self.reservation_unit],
            begin=self.reservation_begin + datetime.timedelta(hours=2),
            end=self.reservation_end + datetime.timedelta(hours=2),
            state=ReservationStateChoice.CONFIRMED,
            buffer_time_after=datetime.timedelta(minutes=62),
        )

        data = self.get_valid_adjust_data()
        data["begin"] = (self.reservation_begin + datetime.timedelta(hours=3)).isoformat()
        data["end"] = (self.reservation_end + datetime.timedelta(hours=3)).isoformat()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_OVERLAP")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_max_days_before_exceeded_fails(self):
        open_date = datetime.date.today() + datetime.timedelta(days=2)
        ReservableTimeSpanFactory(
            resource=self.reservation_unit.origin_hauki_resource,
            start_datetime=datetime.datetime.combine(open_date, datetime.time(hour=6)),
            end_datetime=datetime.datetime.combine(open_date, datetime.time(hour=22)),
        )
        self.reservation_unit.reservations_max_days_before = 1
        self.reservation_unit.save()

        data = self.get_valid_adjust_data()
        data["begin"] = (self.reservation_begin + datetime.timedelta(days=2)).strftime("%Y%m%dT%H%M%S%zZ")
        data["end"] = (self.reservation_end + datetime.timedelta(days=2)).strftime("%Y%m%dT%H%M%S%zZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_min_days_before_subseeded_fails(self):
        self.reservation_unit.reservations_min_days_before = 7
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_reservation_unit_not_open_in_new_time_fails(self):
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(),
            input_data={
                "pk": self.reservation.pk,
                "begin": (self.reservation_begin + datetime.timedelta(days=1)).isoformat(),
                "end": (self.reservation_end + datetime.timedelta(days=1)).isoformat(),
            },
        )
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_UNIT_IS_NOT_OPEN")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_reservation_unit_in_open_application_round_fails(self):
        ApplicationRoundFactory(
            reservation_units=[self.reservation_unit],
            reservation_period_begin=self.reservation_begin.date(),
            reservation_period_end=self.reservation_begin.date(),
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_UNIT_IN_OPEN_ROUND")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_reservation_start_time_not_within_the_interval_fails(self):
        self.reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_15_MINUTES.value
        self.reservation_unit.save()

        data = self.get_valid_adjust_data()
        data["begin"] = (datetime.datetime.now() + datetime.timedelta(hours=1, minutes=10)).strftime("%Y%m%dT%H%M%S%zZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_adjust_not_allowed_for_another_user(self):
        reggie_jim = get_user_model().objects.create(
            username="regjim",
            first_name="jim",
            last_name="reggie",
            email="j.reg@foo.com",
        )
        self.client.force_login(reggie_jim)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        error = content.get("errors")[0].get("message")
        assert_that(error).contains_ignoring_case("No permission to mutate")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_unit_admin_can_adjust_user_reservation(self):
        unit_admin = self.create_unit_admin(self.unit)
        self.client.force_login(unit_admin)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is None

        payload = content.get("data").get("adjustReservationTime")
        assert payload.get("errors") is None

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin + datetime.timedelta(hours=1))
        assert_that(self.reservation.end).is_equal_to(self.reservation_end + datetime.timedelta(hours=1))

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_needs_handling_after_time_change(self):
        self.reservation_unit.require_reservation_handling = True
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert content.get("errors") is None

        payload = content.get("data").get("adjustReservationTime")
        assert payload.get("errors") is None

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin + datetime.timedelta(hours=1))
        assert_that(self.reservation.end).is_equal_to(self.reservation_end + datetime.timedelta(hours=1))

        assert_that(len(mail.outbox)).is_equal_to(2)
        assert_that(mail.outbox[0].subject).is_equal_to("modified")
        assert_that(mail.outbox[1].subject).is_equal_to("staff")
