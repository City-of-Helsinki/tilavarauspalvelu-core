# ruff: noqa: S311

from django.contrib.gis.geos import Point

from common.management.commands.data_creation.utils import with_logs
from spaces.models import Location, Unit, UnitGroup
from spaces.models.location import COORDINATE_SYSTEM_ID


@with_logs()
def _create_units(*, number: int = 300) -> list[Unit]:
    # Some actual tprek identifiers for Hauki testing
    tprek_ids = {
        # Oodin nuorisotila - Oodin nuorisotila
        0: ("64364", "bc4a547d-a27c-441e-9f42-c99f3e439572"),
        # Arabian nuorisotalo - Sali
        1: ("51342", "dc7d39db-b35a-4612-a921-1b7b24b0baa3"),
        # Ungdomsgården Sandels - Bändihuone
        2: ("8149", "dc7d39db-b35a-4612-a921-1b7b24b0baa3"),
    }

    units: list[Unit] = []
    for i in range(number):
        tprek = tprek_ids.get(i, (i, None))
        unit = Unit(
            name=f"Unit {i}",
            name_fi=f"Unit {i}",
            name_sv=f"Unit {i}",
            name_en=f"Unit {i}",
            rank=i,
            tprek_id=tprek[0],
            tprek_department_id=tprek[1],
        )
        units.append(unit)

    units = Unit.objects.bulk_create(units)
    _create_locations_for_units(units)
    return units


def _rename_empty_units(units: list[Unit]) -> None:
    for i, unit in enumerate(units):
        unit.name = f"Empty unit {i}"
        unit.name_fi = f"Empty unit {i}"
        unit.name_en = f"Empty unit {i}"
        unit.name_sv = f"Empty unit {i}"
        unit.save()


@with_logs()
def _create_locations_for_units(units: list[Unit]) -> list[Location]:
    locations: list[Location] = []
    for i, unit in enumerate(units):
        location = Location(
            address_street=f"Testikatu {i}",
            address_street_fi=f"Testikatu {i}",
            address_street_sv=f"Testikatu {i}",
            address_street_en=f"Testikatu {i}",
            address_zip=f"{i}".zfill(5),
            address_city="Helsinki",
            address_city_fi="Helsinki",
            address_city_sv="Helsinki",
            address_city_en="Helsinki",
            unit=unit,
            coordinates=Point(
                x=25,
                y=60,
                srid=COORDINATE_SYSTEM_ID,
            ),
        )
        locations.append(location)

    return Location.objects.bulk_create(locations)


@with_logs()
def _create_unit_groups_for_units(units: list[Unit]) -> list[UnitGroup]:
    unit_group_1 = UnitGroup.objects.create(
        name="Unit Group 1",
        name_fi="Unit Group 1",
        name_en="Unit Group 1",
        name_sv="Unit Group 1",
    )
    # Add first half of units to unit group 1
    unit_group_1.units.add(*units[: len(units) // 2])

    unit_group_2 = UnitGroup.objects.create(
        name="Unit Group 2",
        name_fi="Unit Group 2",
        name_en="Unit Group 2",
        name_sv="Unit Group 2",
    )
    # Add second half of units to unit group 2
    unit_group_1.units.add(*units[len(units) // 2 :])

    return [unit_group_1, unit_group_2]
