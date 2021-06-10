import datetime
from unittest import mock

import pytest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test.testcases import TestCase
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time
from rest_framework.reverse import reverse
from rest_framework.test import APIClient

from applications.models import (
    ApplicationAggregateData,
    ApplicationEventStatus,
    ApplicationStatus,
)
from applications.tests.factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    ApplicationEventScheduleResultFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    EventReservationUnitFactory,
)
from permissions.models import (
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    UnitRole,
    UnitRoleChoice,
)
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import STATE_CHOICES, RecurringReservation, Reservation
from reservations.tests.factories import ReservationFactory
from spaces.tests.factories import SpaceFactory
from tilavarauspalvelu.utils.date_util import next_or_current_matching_weekday

User = get_user_model()


class MockedScheduler:
    def __init__(self, *args, **kwargs):
        self.begin = args[1]
        self.end = args[2]

    def get_reservation_times_based_on_opening_hours(self):
        return self.begin, self.end


@freeze_time("2021-05-03")
@pytest.mark.django_db
@mock.patch("applications.signals")
class ApplicationStatusBaseTestCase(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        date = datetime.date.today()
        cls.round = ApplicationRoundFactory(
            reservation_period_begin=date,
            reservation_period_end=date + datetime.timedelta(weeks=4),
        )
        cls.application = ApplicationFactory(application_round=cls.round)
        cls.application_event = ApplicationEventFactory(
            application=cls.application,
            events_per_week=1,
            begin=date,
            end=date + datetime.timedelta(weeks=4),
        )
        event_res_unit = EventReservationUnitFactory(
            application_event=cls.application_event
        )
        cls.schedule = ApplicationEventScheduleFactory(
            application_event=cls.application_event
        )
        space = SpaceFactory()
        cls.result = ApplicationEventScheduleResultFactory(
            application_event_schedule=cls.schedule,
            allocated_reservation_unit=ReservationUnitFactory(spaces=[space]),
        )
        cls.service_sector_manager = User.objects.create(
            username="service_sector_person",
            first_name="ser",
            last_name="vice",
            email="ser.vice.person@foo.com",
        )

        ServiceSectorRole.objects.create(
            user=cls.service_sector_manager,
            role=ServiceSectorRoleChoice.objects.get(code="application_manager"),
            service_sector=cls.application.application_round.service_sector,
        )
        cls.manager_api_client = APIClient()
        cls.manager_api_client.force_authenticate(cls.service_sector_manager)
        cls.applicant_user = User.objects.create(
            username="applicant",
            first_name="app",
            last_name="licant",
            email="app.licant.person@foo.com",
        )
        cls.applicant_api_client = APIClient()
        cls.applicant_api_client.force_authenticate(cls.applicant_user)
        ApplicationStatus.objects.create(
            status=ApplicationStatus.IN_REVIEW,
            user=cls.service_sector_manager,
            application=cls.application,
        )
        cls.unit_handler_user = User.objects.create(
            username="unhandler",
            first_name="hand",
            last_name="ler",
            email="hand.ler.person@foo.com",
        )
        UnitRole.objects.create(
            user=cls.unit_handler_user,
            role=UnitRoleChoice.objects.get(code="manager"),
            unit=event_res_unit.reservation_unit.unit,
        )
        cls.unit_handler_client = APIClient()
        cls.unit_handler_client.force_authenticate(cls.unit_handler_user)


@pytest.mark.django_db
class ApplicationStatusApiPermissionsTestCase(ApplicationStatusBaseTestCase):
    def test_service_sector_manager_cant_modify_status(self):
        response = self.manager_api_client.post(
            reverse("application_status-detail", kwargs={"pk": self.application.id}),
            data={
                "status": ApplicationStatus.REVIEW_DONE,
                "application_id": self.application.id,
            },
        )
        assert_that(response.status_code).is_equal_to(405)

    def test_user_cant_create_status(self):
        response = self.applicant_api_client.post(
            reverse("application_status-list"),
            data={
                "status": ApplicationStatus.IN_REVIEW,
                "application_id": self.application.id,
            },
        )
        assert_that(response.status_code).is_equal_to(403)

    def test_service_sector_manager_can_create_status(self):
        response = self.manager_api_client.post(
            reverse("application_status-list"),
            data={
                "status": ApplicationStatus.REVIEW_DONE,
                "application_id": self.application.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        assert_that(ApplicationStatus.objects.latest("id").status).is_equal_to(
            ApplicationStatus.REVIEW_DONE
        )

    def test_service_sector_manager_can_create_status_for_multiple(self):
        application_too = ApplicationFactory(application_round=self.round)
        body = [
            {
                "status": ApplicationStatus.REVIEW_DONE,
                "application_id": self.application.id,
            },
            {
                "status": ApplicationStatus.REVIEW_DONE,
                "application_id": application_too.id,
            },
        ]
        response = self.manager_api_client.post(
            reverse("application_status-list"), data=body, format="json"
        )
        assert_that(response.status_code).is_equal_to(201)
        assert_that(
            ApplicationStatus.objects.filter(application=self.application)
            .latest("id")
            .status
        ).is_equal_to(ApplicationStatus.REVIEW_DONE)
        assert_that(
            ApplicationStatus.objects.filter(application=application_too)
            .latest("id")
            .status
        ).is_equal_to(ApplicationStatus.REVIEW_DONE)


@pytest.mark.django_db
class ApplicationEventStatusApiPermissionsTestCase(ApplicationStatusBaseTestCase):
    def test_user_cant_create_status(self):
        response = self.applicant_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.VALIDATED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(403)

    def test_service_sector_manager_cant_create_created_status(self):
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.CREATED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(403)
        assert_that(ApplicationEventStatus.objects.latest("id").status).is_equal_to(
            ApplicationEventStatus.CREATED
        )

    def test_service_sector_manager_can_create_validated_status(self):
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.VALIDATED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)

    def test_unit_handler_can_create_validated_status(self):
        response = self.unit_handler_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.VALIDATED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        assert_that(ApplicationEventStatus.objects.latest("id").status).is_equal_to(
            ApplicationEventStatus.VALIDATED
        )

    @mock.patch(
        "applications.utils.reservation_creation.ReservationScheduler",
        wraps=MockedScheduler,
    )
    def test_service_sector_manager_can_create_approved_status(self, mock):
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.APPROVED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        assert_that(ApplicationEventStatus.objects.latest("id").status).is_equal_to(
            ApplicationEventStatus.APPROVED
        )

    def test_service_sector_manager_can_create_validated_status_for_multiple(self):
        second_application_event = ApplicationEventFactory(
            application=self.application,
            events_per_week=1,
            begin=datetime.date.today(),
            end=datetime.date.today() + datetime.timedelta(weeks=4),
        )
        body = [
            {
                "status": ApplicationEventStatus.VALIDATED,
                "application_event_id": self.application_event.id,
            },
            {
                "status": ApplicationEventStatus.VALIDATED,
                "application_event_id": second_application_event.id,
            },
        ]
        response = self.manager_api_client.post(
            reverse("application_event_status-list"), data=body, format="json"
        )
        assert_that(response.status_code).is_equal_to(201)
        assert_that(
            ApplicationEventStatus.objects.filter(
                application_event=self.application_event
            )
            .latest("id")
            .status
        ).is_equal_to(ApplicationEventStatus.VALIDATED)
        assert_that(
            ApplicationEventStatus.objects.filter(
                application_event=second_application_event
            )
            .latest("id")
            .status
        ).is_equal_to(ApplicationEventStatus.VALIDATED)


@mock.patch(
    "applications.utils.reservation_creation.ReservationScheduler",
    wraps=MockedScheduler,
)
class ReservationCreationOnStatusCreationTestCase(ApplicationStatusBaseTestCase):
    def test_creating_approved_status_creates_reservations(self, mock):
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.APPROVED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        assert_that(RecurringReservation.objects.count()).is_equal_to(1)
        assert_that(Reservation.objects.count()).is_greater_than(0)

    def test_correct_amount_of_reservations_are_created_when_weekly(self, mock):
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.APPROVED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        assert_that(RecurringReservation.objects.count()).is_equal_to(1)
        assert_that(Reservation.objects.count()).is_equal_to(4)

    def test_correct_amount_of_reservations_are_created_when_bi_weekly(self, mock):
        self.application_event.biweekly = True
        self.application_event.save()
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.APPROVED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        assert_that(RecurringReservation.objects.count()).is_equal_to(1)
        assert_that(Reservation.objects.count()).is_equal_to(2)

    def test_correct_dates_are_used_for_reservations(self, mock):
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.APPROVED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        reservations = Reservation.objects.filter(
            recurring_reservation__application=self.application
        ).order_by("begin")
        schedule_result = (
            self.application_event.application_event_schedules.first().application_event_schedule_result
        )
        for reservation in reservations:
            assert_that(reservation.begin.weekday()).is_equal_to(
                schedule_result.allocated_day
            )

    def test_reservation_gets_denied_status_when_overlapping(self, mock):
        res_date = next_or_current_matching_weekday(
            self.application_event.begin, self.result.allocated_day
        )
        res_dt = datetime.datetime.combine(
            res_date, self.result.allocated_begin, tzinfo=get_default_timezone()
        )
        ReservationFactory(
            begin=res_dt,
            end=res_dt + datetime.timedelta(hours=12),
            reservation_unit=[self.result.allocated_reservation_unit],
            state=STATE_CHOICES.CREATED,
        )
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.APPROVED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)

        reservations = Reservation.objects.filter(
            recurring_reservation__application=self.application
        ).order_by("begin")
        assert_that(reservations[0].state).is_equal_to(STATE_CHOICES.DENIED)
        for reservation in reservations[1:4]:
            assert_that(reservation.state).is_equal_to(STATE_CHOICES.CREATED)

    def test_reservation_gets_denied_status_if_unit_not_open(self, mock):
        mock.return_value.get_reservation_times_based_on_opening_hours.return_value = (
            None,
            None,
        )
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.APPROVED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        reservation = Reservation.objects.first()
        assert_that(reservation.state).is_equal_to(STATE_CHOICES.DENIED)


class ApplicationAggregateDataCreationOnEventStatusChangeTestCase(
    ApplicationStatusBaseTestCase
):
    @mock.patch(
        "applications.utils.reservation_creation.ReservationScheduler",
        wraps=MockedScheduler,
    )
    def test_aggregate_data_is_created_after_event_approved(self, mock):
        response = self.manager_api_client.post(
            reverse("application_event_status-list"),
            data={
                "status": ApplicationEventStatus.APPROVED,
                "application_event_id": self.application_event.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        aggregate_datas_one = ApplicationAggregateData.objects.filter(
            application=self.application
        ).count()

        assert_that(aggregate_datas_one).is_equal_to(4)


class ApplicationStatusChangeTestCase(ApplicationStatusBaseTestCase):
    def test_sent_status_from_in_review_fails(self):
        self.application.set_status(ApplicationStatus.IN_REVIEW)

        response = self.manager_api_client.post(
            reverse("application_status-list"),
            data={
                "status": ApplicationStatus.SENT,
                "application_id": self.application.id,
            },
        )
        assert_that(response.status_code).is_equal_to(400)
        self.application.refresh_from_db()
        assert_that(self.application.status).is_equal_to(ApplicationStatus.IN_REVIEW)

    def test_sent_status_from_draft_fails(self):
        self.application.set_status(ApplicationStatus.DRAFT)

        response = self.manager_api_client.post(
            reverse("application_status-list"),
            data={
                "status": ApplicationStatus.SENT,
                "application_id": self.application.id,
            },
        )
        assert_that(response.status_code).is_equal_to(400)
        self.application.refresh_from_db()
        assert_that(self.application.status).is_equal_to(ApplicationStatus.DRAFT)

    def test_sent_status_assigns_correct(self):
        self.application.set_status(ApplicationStatus.REVIEW_DONE)

        response = self.manager_api_client.post(
            reverse("application_status-list"),
            data={
                "status": ApplicationStatus.SENT,
                "application_id": self.application.id,
            },
        )
        assert_that(response.status_code).is_equal_to(201)
        self.application.refresh_from_db()
        assert_that(self.application.status).is_equal_to(ApplicationStatus.SENT)
