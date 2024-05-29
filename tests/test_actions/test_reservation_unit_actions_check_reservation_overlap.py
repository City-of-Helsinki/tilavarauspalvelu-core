from datetime import timedelta

import pytest

from common.date_utils import local_datetime
from reservations.choices import ReservationStateChoice
from tests.factories import ReservationFactory, ReservationUnitFactory, ServiceFactory, SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture()
def services():
    return ServiceFactory.create_batch(3)


@pytest.fixture()
def res_unit_parent(services):
    space_parent = SpaceFactory.create()
    return ReservationUnitFactory.create(services=services, spaces=[space_parent])


@pytest.fixture()
def res_unit_child_1(services, res_unit_parent):
    space_child_1 = SpaceFactory.create(parent=res_unit_parent.spaces.first())
    return ReservationUnitFactory.create(services=services, spaces=[space_child_1])


@pytest.fixture()
def res_unit_child_2(services, res_unit_parent):
    space_child_2 = SpaceFactory.create(parent=res_unit_parent.spaces.first())
    return ReservationUnitFactory.create(services=services, spaces=[space_child_2])


@pytest.fixture()
def res_unit_child_2_child(services, res_unit_child_2):
    space_child_2_child = SpaceFactory.create(parent=res_unit_child_2.spaces.first())
    return ReservationUnitFactory.create(services=services, spaces=[space_child_2_child])


def test_reservation_unit__check_reservation_overlap__no_reservations_no_overlaps(
    res_unit_parent,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    assert not res_unit_parent.actions.check_reservation_overlap(begin, end)


def test_reservation_unit__check_reservation_overlap__same_space__same_time__overlaps(
    res_unit_parent,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    ReservationFactory.create(
        reservation_unit=[res_unit_parent],
        begin=begin,
        end=end,
        state=ReservationStateChoice.CREATED,
    )
    assert res_unit_parent.actions.check_reservation_overlap(begin, end)


def test_reservation_unit__check_reservation_overlap__child__same_time__overlaps(
    res_unit_parent,
    res_unit_child_1,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    ReservationFactory.create(
        reservation_unit=[res_unit_child_1],
        begin=begin,
        end=end,
        state=ReservationStateChoice.CREATED,
    )
    assert res_unit_parent.actions.check_reservation_overlap(begin, end)


def test_reservation_unit__check_reservation_overlap__sibling__same_time__does_not_overlap(
    res_unit_child_1,
    res_unit_child_2,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    ReservationFactory.create(
        reservation_unit=[res_unit_child_1],
        begin=begin,
        end=end,
        state=ReservationStateChoice.CREATED,
    )
    assert not res_unit_child_2.actions.check_reservation_overlap(begin, end)


def test_reservation_unit__check_reservation_overlap__same_space__partly_same_time__overlaps(
    res_unit_parent,
    res_unit_child_1,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    ReservationFactory.create(
        reservation_unit=[res_unit_child_1],
        begin=begin + timedelta(minutes=30),
        end=end,
        state=ReservationStateChoice.CREATED,
    )
    assert res_unit_parent.actions.check_reservation_overlap(begin, end)


def test_reservation_unit__check_reservation_overlap__child__partly_same_time__overlaps(
    res_unit_parent,
    res_unit_child_1,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    ReservationFactory.create(
        reservation_unit=[res_unit_child_1],
        begin=begin + timedelta(minutes=30),
        end=end,
        state=ReservationStateChoice.CREATED,
    )
    assert res_unit_parent.actions.check_reservation_overlap(begin, end)


def test_reservation_unit__check_reservation_overlap__child_of_child__same_time__overlaps(
    res_unit_parent,
    res_unit_child_2_child,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    ReservationFactory.create(
        reservation_unit=[res_unit_child_2_child],
        begin=begin,
        end=end,
        state=ReservationStateChoice.CREATED,
    )
    assert res_unit_parent.actions.check_reservation_overlap(begin, end)


def test_reservation_unit__check_reservation_overlap__child_of_sibling__same_time__does_not_overlap(
    res_unit_child_1,
    res_unit_child_2_child,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    ReservationFactory.create(
        reservation_unit=[res_unit_child_2_child],
        begin=begin,
        end=end,
        state=ReservationStateChoice.CREATED,
    )
    assert not res_unit_child_1.actions.check_reservation_overlap(begin, end)


def test_reservation_unit__check_reservation_overlap__child_parent__same_time__overlaps(
    res_unit_child_2,
    res_unit_child_2_child,
):
    begin = local_datetime()
    end = begin + timedelta(minutes=120)

    ReservationFactory.create(
        reservation_unit=[res_unit_child_2],
        begin=begin,
        end=end,
        state=ReservationStateChoice.CREATED,
    )
    assert res_unit_child_2_child.actions.check_reservation_overlap(begin, end)
