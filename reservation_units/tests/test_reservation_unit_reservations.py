from datetime import UTC, datetime, timedelta
from unittest import TestCase as UnitTestCase

import pytest
from django.test.testcases import TestCase

from reservations.choices import ReservationStateChoice
from tests.factories import ReservationFactory, ReservationUnitFactory, ServiceFactory, SpaceFactory


@pytest.mark.django_db()
class CheckReservationOverlapForSpacesTestCase(TestCase, UnitTestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        services = ServiceFactory.create_batch(10)

        cls.space_whole_room = SpaceFactory()
        cls.space_first_half_of_the_room = SpaceFactory(parent=cls.space_whole_room)
        cls.space_second_half_of_the_room = SpaceFactory(parent=cls.space_whole_room)
        cls.space_corner_of_second_half = SpaceFactory(parent=cls.space_second_half_of_the_room)

        cls.res_unit_whole_room = ReservationUnitFactory(services=services, spaces=[cls.space_whole_room])
        cls.res_unit_first_half_room = ReservationUnitFactory(
            services=services,
            spaces=[cls.space_first_half_of_the_room],
        )
        cls.res_unit_second_half_room = ReservationUnitFactory(
            services=services,
            spaces=[cls.space_second_half_of_the_room],
        )
        cls.res_unit_corner_of_second_half = ReservationUnitFactory(
            services=services,
            spaces=[cls.space_corner_of_second_half],
        )

        cls.begin = datetime.now(tz=UTC)
        cls.end = cls.begin + timedelta(minutes=120)

    def test_no_reservations_no_overlaps(self):
        assert not self.res_unit_whole_room.actions.check_reservation_overlap(self.begin, self.end)

    def test_same_space_same_time_overlaps(self):
        ReservationFactory(
            reservation_unit=[self.res_unit_whole_room],
            begin=self.begin,
            end=self.end,
            state=ReservationStateChoice.CREATED,
        )
        assert self.res_unit_whole_room.actions.check_reservation_overlap(self.begin, self.end)

    def test_part_of_the_room_reserved_whole_room_same_time_overlaps(self):
        ReservationFactory(
            reservation_unit=[self.res_unit_first_half_room],
            begin=self.begin,
            end=self.end,
            state=ReservationStateChoice.CREATED,
        )
        assert self.res_unit_whole_room.actions.check_reservation_overlap(self.begin, self.end)

    def test_part_of_the_room_reserved_other_part_does_not_overlap_when_at_same_time(
        self,
    ):
        ReservationFactory(
            reservation_unit=[self.res_unit_first_half_room],
            begin=self.begin,
            end=self.end,
            state=ReservationStateChoice.CREATED,
        )
        assert not self.res_unit_second_half_room.actions.check_reservation_overlap(self.begin, self.end)

    def test_same_space_partly_same_time_overlaps(self):
        ReservationFactory(
            reservation_unit=[self.res_unit_first_half_room],
            begin=self.begin + timedelta(minutes=30),
            end=self.end,
            state=ReservationStateChoice.CREATED,
        )
        assert self.res_unit_whole_room.actions.check_reservation_overlap(self.begin, self.end)

    def test_part_of_the_room_reserved_whole_room_partly_same_time_overlaps(self):
        ReservationFactory(
            reservation_unit=[self.res_unit_first_half_room],
            begin=self.begin + timedelta(minutes=30),
            end=self.end,
            state=ReservationStateChoice.CREATED,
        )
        assert self.res_unit_whole_room.actions.check_reservation_overlap(self.begin, self.end)

    def test_part_of_the_part_room_overlaps_with_same_time_whole_room(self):
        ReservationFactory(
            reservation_unit=[self.res_unit_corner_of_second_half],
            begin=self.begin,
            end=self.end,
            state=ReservationStateChoice.CREATED,
        )
        assert self.res_unit_whole_room.actions.check_reservation_overlap(self.begin, self.end)

    def test_part_of_the_part_room_does_not_overlap_when_other_part_is_reserved(self):
        ReservationFactory(
            reservation_unit=[self.res_unit_corner_of_second_half],
            begin=self.begin,
            end=self.end,
            state=ReservationStateChoice.CREATED,
        )
        assert not self.res_unit_first_half_room.actions.check_reservation_overlap(self.begin, self.end)
        assert self.res_unit_whole_room.actions.check_reservation_overlap(self.begin, self.end)

    def test_part_of_the_room_overlaps_if_the_room_is_reserved(self):
        ReservationFactory(
            reservation_unit=[self.res_unit_second_half_room],
            begin=self.begin,
            end=self.end,
            state=ReservationStateChoice.CREATED,
        )
        assert self.res_unit_corner_of_second_half.actions.check_reservation_overlap(self.begin, self.end)
