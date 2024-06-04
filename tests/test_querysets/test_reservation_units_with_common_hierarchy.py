import pytest

from reservation_units.models import ReservationUnit, ReservationUnitHierarchy
from tests.factories import ReservationUnitFactory, SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_units_with_common_hierarchy__queryset(query_counter):
    # Space 1
    # └── Space 2
    # Space 3
    # ├── Space 4
    # └── Space 5
    #     └── Space 6
    # Space 7
    space_1 = SpaceFactory.create(parent=None)
    space_2 = SpaceFactory.create(parent=space_1)
    space_3 = SpaceFactory.create(parent=None)
    space_4 = SpaceFactory.create(parent=space_3)
    space_5 = SpaceFactory.create(parent=space_3)
    space_6 = SpaceFactory.create(parent=space_5)
    space_7 = SpaceFactory.create(parent=None)

    res_1 = ReservationUnitFactory.create(spaces=[space_1])
    res_2 = ReservationUnitFactory.create(spaces=[space_2])
    res_3 = ReservationUnitFactory.create(spaces=[space_3])
    res_4 = ReservationUnitFactory.create(spaces=[space_4])
    res_5 = ReservationUnitFactory.create(spaces=[space_5])
    res_6 = ReservationUnitFactory.create(spaces=[space_6])
    res_7 = ReservationUnitFactory.create(spaces=[space_7])

    ReservationUnitHierarchy.refresh()

    def get_affecting(pks: list[int]) -> list[int]:
        with query_counter() as counter:
            ids = list(
                ReservationUnit.objects.filter(pk__in=pks)
                .reservation_units_with_common_hierarchy()
                .order_by("pk")
                .values_list("pk", flat=True)
            )

        assert len(counter.queries) == 1
        return ids

    assert get_affecting([res_1.pk]) == [res_1.pk, res_2.pk]
    assert get_affecting([res_2.pk]) == [res_1.pk, res_2.pk]
    assert get_affecting([res_3.pk]) == [res_3.pk, res_4.pk, res_5.pk, res_6.pk]
    assert get_affecting([res_4.pk]) == [res_3.pk, res_4.pk]
    assert get_affecting([res_5.pk]) == [res_3.pk, res_5.pk, res_6.pk]
    assert get_affecting([res_6.pk]) == [res_3.pk, res_5.pk, res_6.pk]
    assert get_affecting([res_7.pk]) == [res_7.pk]

    # Test combination of multiple reservation units
    assert get_affecting([res_1.pk, res_6.pk]) == [res_1.pk, res_2.pk, res_3.pk, res_5.pk, res_6.pk]


def test_reservation_units_with_common_hierarchy__model(query_counter):
    # Space 1
    # └── Space 2
    # Space 3
    # ├── Space 4
    # └── Space 5
    #     └── Space 6
    # Space 7
    space_1 = SpaceFactory.create(parent=None)
    space_2 = SpaceFactory.create(parent=space_1)
    space_3 = SpaceFactory.create(parent=None)
    space_4 = SpaceFactory.create(parent=space_3)
    space_5 = SpaceFactory.create(parent=space_3)
    space_6 = SpaceFactory.create(parent=space_5)
    space_7 = SpaceFactory.create(parent=None)

    res_1: ReservationUnit = ReservationUnitFactory.create(spaces=[space_1])
    res_2: ReservationUnit = ReservationUnitFactory.create(spaces=[space_2])
    res_3: ReservationUnit = ReservationUnitFactory.create(spaces=[space_3])
    res_4: ReservationUnit = ReservationUnitFactory.create(spaces=[space_4])
    res_5: ReservationUnit = ReservationUnitFactory.create(spaces=[space_5])
    res_6: ReservationUnit = ReservationUnitFactory.create(spaces=[space_6])
    res_7: ReservationUnit = ReservationUnitFactory.create(spaces=[space_7])

    ReservationUnitHierarchy.refresh()

    def get_affecting(ru: ReservationUnit) -> list[int]:
        with query_counter() as counter:
            ids = list(ru.actions.reservation_units_with_common_hierarchy.order_by("pk").values_list("pk", flat=True))

        assert len(counter.queries) == 1
        return ids

    assert get_affecting(res_1) == [res_1.pk, res_2.pk]
    assert get_affecting(res_2) == [res_1.pk, res_2.pk]
    assert get_affecting(res_3) == [res_3.pk, res_4.pk, res_5.pk, res_6.pk]
    assert get_affecting(res_4) == [res_3.pk, res_4.pk]
    assert get_affecting(res_5) == [res_3.pk, res_5.pk, res_6.pk]
    assert get_affecting(res_6) == [res_3.pk, res_5.pk, res_6.pk]
    assert get_affecting(res_7) == [res_7.pk]
