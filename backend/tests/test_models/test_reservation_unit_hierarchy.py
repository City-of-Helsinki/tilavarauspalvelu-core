from __future__ import annotations

import pytest

from tilavarauspalvelu.models import ReservationUnitHierarchy

from tests.factories import ReservationUnitFactory, ResourceFactory, SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_hierarchy__refreshed_after_commit(settings, django_capture_on_commit_callbacks):
    settings.UPDATE_RESERVATION_UNIT_HIERARCHY = True

    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit = ReservationUnitFactory.create(spaces=[SpaceFactory.create()])

        assert ReservationUnitHierarchy.objects.filter(reservation_unit=reservation_unit).exists() is False

    assert ReservationUnitHierarchy.objects.filter(reservation_unit=reservation_unit).exists() is True


def test_reservation_unit_hierarchy__shared_resource_added(settings, django_capture_on_commit_callbacks):
    settings.UPDATE_RESERVATION_UNIT_HIERARCHY = True

    resource = ResourceFactory.create()
    reservation_unit_1 = ReservationUnitFactory.create(resources=[resource])
    reservation_unit_2 = ReservationUnitFactory.create()

    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit_2.resources.add(resource)

    hierarchy = ReservationUnitHierarchy.objects.get(reservation_unit=reservation_unit_1)
    assert sorted(hierarchy.related_reservation_unit_ids) == sorted([reservation_unit_1.pk, reservation_unit_2.pk])


def test_reservation_unit_hierarchy__shared_space_deleted(settings, django_capture_on_commit_callbacks):
    settings.UPDATE_RESERVATION_UNIT_HIERARCHY = True

    space = SpaceFactory.create()
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit_1 = ReservationUnitFactory.create(spaces=[space])
        reservation_unit_2 = ReservationUnitFactory.create(spaces=[space])

    hierarchy = ReservationUnitHierarchy.objects.get(reservation_unit=reservation_unit_1)
    assert sorted(hierarchy.related_reservation_unit_ids) == sorted([reservation_unit_1.pk, reservation_unit_2.pk])

    with django_capture_on_commit_callbacks(execute=True):
        space.delete()

    hierarchy = ReservationUnitHierarchy.objects.get(reservation_unit=reservation_unit_1)
    assert hierarchy.related_reservation_unit_ids == [reservation_unit_1.pk]


def test_reservation_unit_hierarchy__reservation_unit_deleted(settings, django_capture_on_commit_callbacks):
    settings.UPDATE_RESERVATION_UNIT_HIERARCHY = True

    space = SpaceFactory.create()
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit_1 = ReservationUnitFactory.create(spaces=[space])
        reservation_unit_2 = ReservationUnitFactory.create(spaces=[space])

    reservation_unit_2_pk = reservation_unit_2.pk
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit_2.delete()

    hierarchy = ReservationUnitHierarchy.objects.get(reservation_unit=reservation_unit_1)
    assert hierarchy.related_reservation_unit_ids == [reservation_unit_1.pk]
    assert ReservationUnitHierarchy.objects.filter(reservation_unit=reservation_unit_2_pk).exists() is False
