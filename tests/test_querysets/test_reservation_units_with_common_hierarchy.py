import pytest

from reservation_units.models import ReservationUnit
from tests.factories import ReservationUnitFactory, SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_reservation_units_with_common_hierarchy():
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

    common_units_1 = list(
        ReservationUnit.objects.filter(pk=res_1.pk)
        .reservation_units_with_common_hierarchy()
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    assert common_units_1 == [res_1.pk, res_2.pk]

    common_units_2 = list(
        ReservationUnit.objects.filter(pk=res_2.pk)
        .reservation_units_with_common_hierarchy()
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    assert common_units_2 == [res_1.pk, res_2.pk]

    common_units_3 = list(
        ReservationUnit.objects.filter(pk=res_3.pk)
        .reservation_units_with_common_hierarchy()
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    assert common_units_3 == [res_3.pk, res_4.pk, res_5.pk, res_6.pk]

    common_units_4 = list(
        ReservationUnit.objects.filter(pk=res_4.pk)
        .reservation_units_with_common_hierarchy()
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    assert common_units_4 == [res_3.pk, res_4.pk]

    common_units_5 = list(
        ReservationUnit.objects.filter(pk=res_5.pk)
        .reservation_units_with_common_hierarchy()
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    assert common_units_5 == [res_3.pk, res_5.pk, res_6.pk]

    common_units_6 = list(
        ReservationUnit.objects.filter(pk=res_6.pk)
        .reservation_units_with_common_hierarchy()
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    assert common_units_6 == [res_3.pk, res_5.pk, res_6.pk]

    common_units_7 = list(
        ReservationUnit.objects.filter(pk=res_7.pk)
        .reservation_units_with_common_hierarchy()
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    assert common_units_7 == [res_7.pk]

    # Test combination of multiple reservation units
    common_units_1 = list(
        ReservationUnit.objects.filter(pk__in=[res_1.pk, res_6.pk])
        .reservation_units_with_common_hierarchy()
        .order_by("pk")
        .values_list("pk", flat=True)
    )
    assert common_units_1 == [res_1.pk, res_2.pk, res_3.pk, res_5.pk, res_6.pk]
