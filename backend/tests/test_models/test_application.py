from __future__ import annotations

import datetime

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.models import Application
from utils.date_utils import local_datetime

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    ReservationUnitOptionFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__status():
    now = local_datetime()
    application_round = ApplicationRoundFactory.create(
        application_period_begins_at=now - datetime.timedelta(days=7),
        application_period_ends_at=now + datetime.timedelta(days=1),
    )
    application = ApplicationFactory.create(application_round=application_round)

    # Application has not been sent, and application round is ongoing -> application is DRAFT
    assert application.status == ApplicationStatusChoice.DRAFT
    assert Application.objects.filter(L(status=ApplicationStatusChoice.DRAFT)).exists()

    # Application round has moved to allocation, but application was not sent -> application is EXPIRED
    application_round.application_period_ends_at = now - datetime.timedelta(days=1)
    application_round.save()
    assert application.status == ApplicationStatusChoice.EXPIRED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.EXPIRED)).exists()

    # Application was sent, but without any sections -> application is HANDLED
    application.sent_at = now
    application.save()
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()

    # Application has one section, but it is unallocated -> application is IN_ALLOCATION
    section = ApplicationSectionFactory.create(application=application, applied_reservations_per_week=1)
    option = ReservationUnitOptionFactory.create(application_section=section)
    assert application.status == ApplicationStatusChoice.IN_ALLOCATION
    assert Application.objects.filter(L(status=ApplicationStatusChoice.IN_ALLOCATION)).exists()

    # Application is not yet allocated, but round marked handled -> application is HANDLED
    application_round.handled_at = now
    application_round.save()
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()
    application_round.handled_at = None
    application_round.save()

    # All reservation unit options have been locked -> application is HANDLED
    option.is_locked = True
    option.save()
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()
    option.is_locked = False
    option.save()

    # All reservation unit options have been rejected -> application is HANDLED
    option.is_rejected = True
    option.save()
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()
    option.is_rejected = False
    option.save()

    # All application sections' applied reservations per week equals
    # the number of allocations on them -> application is HANDLED
    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()

    # Application round has been marked as sent -> application is RESULTS_SENT
    application_round.handled_at = now
    application_round.sent_at = now
    application_round.save()
    assert application.status == ApplicationStatusChoice.RESULTS_SENT
    assert Application.objects.filter(L(status=ApplicationStatusChoice.RESULTS_SENT)).exists()

    # Application has been cancelled -> application is CANCELLED
    application.cancelled_at = now
    application.save()
    assert application.status == ApplicationStatusChoice.CANCELLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.CANCELLED)).exists()


def test_application__all_sections_allocated():
    now = local_datetime()
    application_round = ApplicationRoundFactory.create(
        application_period_begins_at=now - datetime.timedelta(days=7),
        application_period_ends_at=now + datetime.timedelta(days=1),
    )
    application = ApplicationFactory.create(application_round=application_round)
    section = ApplicationSectionFactory.create(application=application, applied_reservations_per_week=1)
    option = ReservationUnitOptionFactory.create(application_section=section)

    # Application round hasn't entered allocation -> all_sections_allocated is False
    assert application.all_sections_allocated is False
    assert Application.objects.filter(L(all_sections_allocated=False)).exists()

    # Application round has entered allocation, but there are no
    # allocations for the application yet -> all_sections_allocated is False
    application_round.application_period_ends_at = now - datetime.timedelta(days=1)
    application_round.save()
    assert application.all_sections_allocated is False
    assert Application.objects.filter(L(all_sections_allocated=False)).exists()

    # All reservation unit options have been locked -> all_sections_allocated is True
    option.is_locked = True
    option.save()
    assert application.all_sections_allocated is True
    assert Application.objects.filter(L(all_sections_allocated=True)).exists()
    option.is_locked = False
    option.save()

    # All reservation unit options have been rejected -> all_sections_allocated is True
    option.is_rejected = True
    option.save()
    assert application.all_sections_allocated is True
    assert Application.objects.filter(L(all_sections_allocated=True)).exists()
    option.is_rejected = False
    option.save()

    # All application sections' applied reservations per week equals
    # the number of allocations on them -> all_sections_allocated is True
    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert application.all_sections_allocated is True
    assert Application.objects.filter(L(all_sections_allocated=True)).exists()


def test_application__applicant():
    application = ApplicationFactory.create(
        organisation_name="",
        contact_person_first_name="",
        contact_person_last_name="",
        user__first_name="",
        user__last_name="",
    )

    # Application has no user, organisation name or contact person name -> applicant is empty
    assert application.applicant == ""
    assert Application.objects.filter(L(applicant="")).exists()

    # Application has a user, but no organisation name or contact person name -> applicant is user's name
    application.user.first_name = "John"
    application.user.last_name = "Doe"
    application.user.save()
    assert application.applicant == "John Doe"
    assert Application.objects.filter(L(applicant="John Doe")).exists()

    # Application has a user and a contact person name, but no organisation name -> applicant is contact person name
    application.contact_person_first_name = "Jane"
    application.contact_person_last_name = "Doe"
    application.save()
    assert application.applicant == "Jane Doe"
    assert Application.objects.filter(L(applicant="Jane Doe")).exists()

    # Application an organisation name -> applicant is organisation name
    application.organisation_name = "Test Organisation"
    application.save()
    assert application.applicant == "Test Organisation"
    assert Application.objects.filter(L(applicant="Test Organisation")).exists()
