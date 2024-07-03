import datetime

import pytest
from lookup_property import L

from applications.choices import ApplicationSectionStatusChoice, Weekday
from applications.models import ApplicationSection
from tests.factories import AllocatedTimeSlotFactory, ApplicationRoundFactory, ReservationUnitOptionFactory
from tests.factories.application_section import ApplicationSectionFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__status():
    now = datetime.datetime.now(tz=datetime.UTC)
    application_round = ApplicationRoundFactory.create(
        application_period_begin=now - datetime.timedelta(days=7),
        application_period_end=now + datetime.timedelta(days=1),
    )
    section = ApplicationSectionFactory.create(
        application__application_round=application_round,
        applied_reservations_per_week=2,
    )
    option = ReservationUnitOptionFactory.create(application_section=section)

    assert ApplicationSection.objects.count() == 1  # sanity check

    # Application round is still option -> status is UNALLOCATED
    assert section.status == ApplicationSectionStatusChoice.UNALLOCATED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.UNALLOCATED)).exists()

    # Application round has entered allocation -> status is IN_ALLOCATION
    application_round.application_period_end = now - datetime.timedelta(days=1)
    application_round.save()
    assert section.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.IN_ALLOCATION)).exists()

    # 1/2 allocations have been made -> status is IN_ALLOCATION
    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert section.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.IN_ALLOCATION)).exists()

    # 1/2 allocations have been made, but application round has been handled -> status is HANDLED
    application_round.handled_date = now
    application_round.save()
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()
    application_round.handled_date = None
    application_round.save()

    # All reservation unit options have been locked -> status is HANDLED
    option.locked = True
    option.save()
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()
    option.locked = False
    option.save()

    # All reservation unit options have been rejected -> status is HANDLED
    option.rejected = True
    option.save()
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()
    option.rejected = False
    option.save()

    # 2/2 allocations have been made -> status is HANDLED
    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()


def test_application_section__status__partially_allocated__option_unusable():
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    section = ApplicationSectionFactory.create(
        application__application_round=application_round,
        applied_reservations_per_week=2,
    )
    option = ReservationUnitOptionFactory.create(application_section=section, locked=True)

    assert section.status == ApplicationSectionStatusChoice.REJECTED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.REJECTED)).exists()

    option.locked = False
    option.rejected = True
    option.save()

    assert section.status == ApplicationSectionStatusChoice.REJECTED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.REJECTED)).exists()

    AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    assert section.status == ApplicationSectionStatusChoice.HANDLED
    assert ApplicationSection.objects.filter(L(status=ApplicationSectionStatusChoice.HANDLED)).exists()


def test_application_section__allocations():
    section_1 = ApplicationSectionFactory.create()
    option_1 = ReservationUnitOptionFactory.create(application_section=section_1, reservation_unit__name="foo 0")

    # Sanity check
    assert ApplicationSection.objects.count() == 1

    # Application section has 0 allocations
    assert section_1.allocations == 0
    assert ApplicationSection.objects.filter(L(allocations=0)).exists()

    # Application section has 1 allocation
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_1)
    assert section_1.allocations == 1
    assert ApplicationSection.objects.filter(L(allocations=1)).exists()

    option_2 = ReservationUnitOptionFactory.create(application_section=section_1, reservation_unit__name="foo 1")
    option_3 = ReservationUnitOptionFactory.create(application_section=section_1, reservation_unit__name="foo 2")

    AllocatedTimeSlotFactory.create(reservation_unit_option=option_2, day_of_the_week=Weekday.MONDAY)
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_2, day_of_the_week=Weekday.TUESDAY)
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_2, day_of_the_week=Weekday.WEDNESDAY)
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_3, day_of_the_week=Weekday.MONDAY)
    AllocatedTimeSlotFactory.create(reservation_unit_option=option_3, day_of_the_week=Weekday.TUESDAY)

    section = (
        ApplicationSection.objects.annotate(allocations=L("allocations"))
        .filter(reservation_unit_options__reservation_unit__name__startswith="foo")
        .order_by("pk")
        .first()
    )

    assert section.allocations == 6


def test_application_section__usable_reservation_unit_options():
    section = ApplicationSectionFactory.create()

    # Sanity check
    assert ApplicationSection.objects.count() == 1

    # Application section has 0 usable reservation unit options
    assert section.usable_reservation_unit_options == 0
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=0)).exists()

    # Create one option -> Application section has 1 usable reservation unit options
    option = ReservationUnitOptionFactory.create(application_section=section)
    assert section.usable_reservation_unit_options == 1
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=1)).exists()

    # Reservation unit locked -> Application section has 0 usable reservation unit options
    option.locked = True
    option.save()
    assert section.usable_reservation_unit_options == 0
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=0)).exists()
    option.locked = False
    option.save()

    # Reservation unit rejected -> Application section has 0 usable reservation unit options
    option.rejected = True
    option.save()
    assert section.usable_reservation_unit_options == 0
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=0)).exists()

    # Create second option -> Application section has 1 usable reservation unit options
    ReservationUnitOptionFactory.create(application_section=section)
    assert section.usable_reservation_unit_options == 1
    assert ApplicationSection.objects.filter(L(usable_reservation_unit_options=1)).exists()
