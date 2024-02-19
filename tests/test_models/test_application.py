import datetime

import pytest
from lookup_property import L

from applications.choices import ApplicationStatusChoice
from applications.models import Application
from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    OrganisationFactory,
    PersonFactory,
    ReservationUnitOptionFactory,
    UserFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__status():
    now = datetime.datetime.now(tz=datetime.UTC)
    application_round = ApplicationRoundFactory.create(
        application_period_begin=now - datetime.timedelta(days=7),
        application_period_end=now + datetime.timedelta(days=1),
    )
    application = ApplicationFactory.create(application_round=application_round)

    # Application has not been sent, and application round is ongoing -> application is DRAFT
    assert application.status == ApplicationStatusChoice.DRAFT
    assert Application.objects.filter(L(status=ApplicationStatusChoice.DRAFT)).exists()

    # Application round has moved to allocation, but application was not sent -> application is EXPIRED
    application_round.application_period_end = now - datetime.timedelta(days=1)
    application_round.save()
    assert application.status == ApplicationStatusChoice.EXPIRED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.EXPIRED)).exists()

    # Application was sent, but without any sections -> application is HANDLED
    application.sent_date = now
    application.save()
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()

    # Application has one section, but it is unallocated -> application is IN_ALLOCATION
    section = ApplicationSectionFactory.create(application=application, applied_reservations_per_week=1)
    option = ReservationUnitOptionFactory.create(application_section=section)
    assert application.status == ApplicationStatusChoice.IN_ALLOCATION
    assert Application.objects.filter(L(status=ApplicationStatusChoice.IN_ALLOCATION)).exists()

    # Application is not yet allocated, but round marked handled -> application is HANDLED
    application_round.handled_date = now
    application_round.save()
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()
    application_round.handled_date = None
    application_round.save()

    # All reservation unit options have been locked -> application is HANDLED
    option.locked = True
    option.save()
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()
    option.locked = False
    option.save()

    # All reservation unit options have been rejected -> application is HANDLED
    option.rejected = True
    option.save()
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()
    option.rejected = False
    option.save()

    # All application sections' applied reservations per week equals
    # the number of allocations on them -> application is HANDLED
    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert application.status == ApplicationStatusChoice.HANDLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.HANDLED)).exists()

    # Application round has been marked as sent -> application is RESULTS_SENT
    application_round.sent_date = now
    application_round.save()
    assert application.status == ApplicationStatusChoice.RESULTS_SENT
    assert Application.objects.filter(L(status=ApplicationStatusChoice.RESULTS_SENT)).exists()

    # Application has been cancelled -> application is CANCELLED
    application.cancelled_date = now
    application.save()
    assert application.status == ApplicationStatusChoice.CANCELLED
    assert Application.objects.filter(L(status=ApplicationStatusChoice.CANCELLED)).exists()


def test_application__all_sections_allocated():
    now = datetime.datetime.now(tz=datetime.UTC)
    application_round = ApplicationRoundFactory.create(
        application_period_begin=now - datetime.timedelta(days=7),
        application_period_end=now + datetime.timedelta(days=1),
    )
    application = ApplicationFactory.create(application_round=application_round)
    section = ApplicationSectionFactory.create(application=application, applied_reservations_per_week=1)
    option = ReservationUnitOptionFactory.create(application_section=section)

    # Application round hasn't entered allocation -> all_sections_allocated is False
    assert application.all_sections_allocated is False
    assert Application.objects.filter(L(all_sections_allocated=False)).exists()

    # Application round has entered allocation, but there are no
    # allocations for the application yet -> all_sections_allocated is False
    application_round.application_period_end = now - datetime.timedelta(days=1)
    application_round.save()
    assert application.all_sections_allocated is False
    assert Application.objects.filter(L(all_sections_allocated=False)).exists()

    # All reservation unit options have been locked -> all_sections_allocated is True
    option.locked = True
    option.save()
    assert application.all_sections_allocated is True
    assert Application.objects.filter(L(all_sections_allocated=True)).exists()
    option.locked = False
    option.save()

    # All reservation unit options have been rejected -> all_sections_allocated is True
    option.rejected = True
    option.save()
    assert application.all_sections_allocated is True
    assert Application.objects.filter(L(all_sections_allocated=True)).exists()
    option.rejected = False
    option.save()

    # All application sections' applied reservations per week equals
    # the number of allocations on them -> all_sections_allocated is True
    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert application.all_sections_allocated is True
    assert Application.objects.filter(L(all_sections_allocated=True)).exists()


def test_application__applicant():
    application = ApplicationFactory.create(organisation=None, contact_person=None, user=None)

    # Application has no user, organisation or contact person -> applicant is empty
    assert application.applicant == ""
    assert Application.objects.filter(L(applicant="")).exists()

    # Application has a user, but no organisation or contact person -> applicant is user's name
    application.user = UserFactory.create(first_name="John", last_name="Doe")
    application.save()
    assert application.applicant == "John Doe"
    assert Application.objects.filter(L(applicant="John Doe")).exists()

    # Application has a user and a contact person, but no organisation -> applicant is contact person's name
    application.contact_person = PersonFactory.create(first_name="Jane", last_name="Doe")
    application.save()
    assert application.applicant == "Jane Doe"
    assert Application.objects.filter(L(applicant="Jane Doe")).exists()

    # Application an organisation -> applicant is organisation's name
    application.organisation = OrganisationFactory.create(name="Test Organisation")
    application.save()
    assert application.applicant == "Test Organisation"
    assert Application.objects.filter(L(applicant="Test Organisation")).exists()
