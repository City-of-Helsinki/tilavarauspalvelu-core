# ruff: noqa: S311

import random
from datetime import timedelta

from reservation_units.models import Equipment, EquipmentCategory, Purpose, Qualifier
from resources.choices import ResourceLocationType
from resources.models import Resource
from services.models import Service
from spaces.models import Space, Unit

from .utils import weighted_choice, with_logs


@with_logs()
def _create_equipments(*, number: int = 10) -> list[Equipment]:
    equipment_category = EquipmentCategory.objects.create(
        name="Equipment Category 1",
        name_fi="Equipment Category 1",
        name_sv="Equipment Category 1",
        name_en="Equipment Category 1",
    )

    equipments: list[Equipment] = []
    for i in range(number):
        equipment = Equipment(
            name=f"Equipment {i}",
            name_fi=f"Equipment {i}",
            name_sv=f"Equipment {i}",
            name_en=f"Equipment {i}",
            category=equipment_category,
        )
        equipments.append(equipment)

    return Equipment.objects.bulk_create(equipments)


@with_logs()
def _create_qualifiers(*, number: int = 1) -> list[Qualifier]:
    qualifiers: list[Qualifier] = []
    for i in range(number):
        qualifier = Qualifier(
            name=f"Qualifier {i}",
            name_fi=f"Qualifier {i}",
            name_sv=f"Qualifier {i}",
            name_en=f"Qualifier {i}",
        )
        qualifiers.append(qualifier)

    return Qualifier.objects.bulk_create(qualifiers)


@with_logs()
def _create_purposes(*, number: int = 10) -> list[Purpose]:
    purposes: list[Purpose] = []
    for i in range(number):
        purpose = Purpose(
            name=f"Purpose {i}",
            name_fi=f"Purpose {i}",
            name_sv=f"Purpose {i}",
            name_en=f"Purpose {i}",
        )
        purposes.append(purpose)

    return Purpose.objects.bulk_create(purposes)


@with_logs()
def _create_resources(spaces: list[Space], *, number: int = 10) -> list[Resource]:
    resources: list[Resource] = []
    for i in range(number):
        buffer_after = weighted_choice([0, 1], weights=[5, 1])
        buffer_before = weighted_choice([0, 1], weights=[5, 1])

        space = random.choice(spaces)
        name = f"Resource {i} - {space.name}"

        reservation_purpose = Resource(
            name=name,
            name_fi=name,
            name_sv=name,
            name_en=name,
            location_type=random.choice(ResourceLocationType.values),
            space=space,
            buffer_time_after=timedelta(hours=buffer_after),
            buffer_time_before=timedelta(hours=buffer_before),
        )
        resources.append(reservation_purpose)

    return Resource.objects.bulk_create(resources)


@with_logs()
def _create_services(*, number: int = 10) -> list[Service]:
    services: list[Service] = []
    for i in range(number):
        buffer_after = weighted_choice([0, 1], weights=[5, 1])
        buffer_before = weighted_choice([0, 1], weights=[5, 1])

        service = Service(
            name=f"Service {i}",
            name_fi=f"Service {i}",
            name_sv=f"Service {i}",
            name_en=f"Service {i}",
            service_type=random.choice(Service.SERVICE_TYPES)[0],
            buffer_time_after=timedelta(hours=buffer_after),
            buffer_time_before=timedelta(hours=buffer_before),
        )
        services.append(service)

    return Service.objects.bulk_create(services)


@with_logs()
def _create_spaces(units: list[Unit]) -> list[Space]:
    spaces: list[Space] = []

    # Can bulk create spaces since we need to
    # link them to each other to form the space hierarchy.
    for i, unit in enumerate(units):
        space = Space.objects.create(
            name=f"Space {i}",
            name_fi=f"Space {i}",
            name_sv=f"Space {i}",
            name_en=f"Space {i}",
            unit=unit,
        )
        spaces.append(space)

    Space.objects.rebuild()
    return list(Space.objects.all())


@with_logs()
def create_spaces_in_hierarchy() -> list[Unit]:
    parent_unit = Unit.objects.create(
        name="Parent unit",
        name_fi="Parent unit",
        name_sv="Parent unit",
        name_en="Parent unit",
    )
    child_unit_1 = Unit.objects.create(
        name="Child unit 1",
        name_fi="Child unit 1",
        name_sv="Child unit 1",
        name_en="Child unit 1",
    )
    child_unit_2 = Unit.objects.create(
        name="Child unit 2",
        name_fi="Child unit 2",
        name_sv="Child unit 2",
        name_en="Child unit 2",
    )
    child_unit_3 = Unit.objects.create(
        name="Child unit 3",
        name_fi="Child unit 3",
        name_sv="Child unit 3",
        name_en="Child unit 3",
    )
    child_unit_4 = Unit.objects.create(
        name="Child unit 4",
        name_fi="Child unit 4",
        name_sv="Child unit 4",
        name_en="Child unit 4",
    )
    child_unit_5 = Unit.objects.create(
        name="Child unit 5",
        name_fi="Child unit 5",
        name_sv="Child unit 5",
        name_en="Child unit 5",
    )
    child_unit_6 = Unit.objects.create(
        name="Child unit 6",
        name_fi="Child unit 6",
        name_sv="Child unit 6",
        name_en="Child unit 6",
    )

    # parent
    # -- child_1
    # ---- child_3
    # ------ child_5
    # ------ child_6
    # -- child_2
    # ---- child_4
    parent_space = Space.objects.create(
        name="Parent space",
        name_fi="Parent space",
        name_sv="Parent space",
        name_en="Parent space",
        unit=parent_unit,
    )
    child_space_1 = Space.objects.create(
        name="Child space 1",
        name_fi="Child space 1",
        name_sv="Child space 1",
        name_en="Child space 1",
        unit=child_unit_1,
        parent=parent_space,
    )
    child_space_2 = Space.objects.create(
        name="Child space 2",
        name_fi="Child space 2",
        name_sv="Child space 2",
        name_en="Child space 2",
        unit=child_unit_2,
        parent=parent_space,
    )
    child_space_3 = Space.objects.create(
        name="Child space 3",
        name_fi="Child space 3",
        name_sv="Child space 3",
        name_en="Child space 3",
        unit=child_unit_3,
        parent=child_space_1,
    )
    Space.objects.create(
        name="Child space 4",
        name_fi="Child space 4",
        name_sv="Child space 4",
        name_en="Child space 4",
        unit=child_unit_4,
        parent=child_space_2,
    )
    Space.objects.create(
        name="Child space 5",
        name_fi="Child space 5",
        name_sv="Child space 5",
        name_en="Child space 5",
        unit=child_unit_5,
        parent=child_space_3,
    )
    Space.objects.create(
        name="Child space 6",
        name_fi="Child space 6",
        name_sv="Child space 6",
        name_en="Child space 6",
        unit=child_unit_6,
        parent=child_space_3,
    )
    Space.objects.rebuild()

    return [
        parent_unit,
        child_unit_1,
        child_unit_2,
        child_unit_3,
        child_unit_4,
        child_unit_5,
        child_unit_6,
    ]
