from assertpy import assert_that
from django.test.testcases import TestCase

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventStatus,
    ApplicationRound,
    ApplicationRoundStatus,
    ApplicationStatus,
)
from applications.tests.factories import (
    ApplicationEventFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
)


class ApplicationStatusUpdateTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.application_round: ApplicationRound = ApplicationRoundFactory()
        cls.application: Application = ApplicationFactory(application_round=cls.application_round)
        cls.application_event: ApplicationEvent = ApplicationEventFactory(application=cls.application)

    def test_draft_applications_change_to_expired_when_round_goes_in_review(self):
        self.application_round.set_status(ApplicationRoundStatus.IN_REVIEW)

        updated_application = Application.objects.get(id=self.application.id)
        assert_that(updated_application.status).is_equal_to(ApplicationStatus.EXPIRED)

    def test_received_applications_change_to_in_review_when_round_goes_in_review(self):
        self.application.set_status(ApplicationStatus.RECEIVED)
        self.application_round.set_status(ApplicationRoundStatus.IN_REVIEW)

        updated_application = Application.objects.get(id=self.application.id)
        assert_that(updated_application.status).is_equal_to(ApplicationStatus.IN_REVIEW)

    def test_in_review_applications_change_to_review_done_when_round_goes_review_done(
        self,
    ):
        self.application.set_status(ApplicationStatus.IN_REVIEW)
        self.application_round.set_status(ApplicationRoundStatus.REVIEW_DONE)

        updated_application = Application.objects.get(id=self.application.id)
        assert_that(updated_application.status).is_equal_to(ApplicationStatus.REVIEW_DONE)

    def test_applications_with_declined_events_change_to_allocated_when_round_goes_review_done(
        self,
    ):
        self.application.set_status(ApplicationStatus.IN_REVIEW)
        self.application_event.set_status(ApplicationEventStatus.DECLINED)
        self.application_round.set_status(ApplicationRoundStatus.REVIEW_DONE)

        updated_application = Application.objects.get(id=self.application.id)
        assert_that(updated_application.status).is_equal_to(ApplicationStatus.ALLOCATED)

    def test_allocated_applications_change_to_handled_when_round_goes_handled(self):
        self.application.set_status(ApplicationStatus.ALLOCATED)
        self.application_round.set_status(ApplicationRoundStatus.HANDLED)

        updated_application = Application.objects.get(id=self.application.id)
        assert_that(updated_application.status).is_equal_to(ApplicationStatus.HANDLED)

    def test_approved_application_events_change_to_reserved_when_round_goes_handled(
        self,
    ):
        self.application.set_status(ApplicationStatus.ALLOCATED)
        self.application_event.set_status(ApplicationEventStatus.APPROVED)
        self.application_round.set_status(ApplicationRoundStatus.HANDLED)

        updated_event = ApplicationEvent.objects.get(id=self.application_event.id)
        assert_that(updated_event.status).is_equal_to(ApplicationEventStatus.RESERVED)

    def test_handled_applications_change_to_sent_when_round_goes_sent(self):
        self.application.set_status(ApplicationStatus.HANDLED)
        self.application_round.set_status(ApplicationRoundStatus.SENT)

        updated_application = Application.objects.get(id=self.application.id)
        assert_that(updated_application.status).is_equal_to(ApplicationStatus.SENT)
