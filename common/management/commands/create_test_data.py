import math
import random
import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from enum import Enum
from itertools import cycle
from typing import Any, Literal, NamedTuple, TypedDict, TypeVar

from django.contrib.auth.hashers import make_password
from django.contrib.gis.geos import Point
from django.core.management import BaseCommand, call_command

from applications.models import (
    APPLICANT_TYPES,
    CUSTOMER_TYPES,
    PRIORITIES,
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationRound,
    EventReservationUnit,
    Organisation,
    Person,
)
from permissions.models import (
    GENERAL_PERMISSIONS,
    SERVICE_SECTOR_PERMISSIONS,
    UNIT_PERMISSIONS,
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    PriceUnit,
    PricingStatus,
    PricingType,
    Purpose,
    Qualifier,
    ReservationKind,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
    ReservationUnitType,
    TaxPercentage,
)
from reservations.models import (
    STATE_CHOICES,
    AgeGroup,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataField,
    ReservationMetadataSet,
    ReservationPurpose,
)
from resources.models import Resource
from services.models import Service
from spaces.models import (
    COORDINATE_SYSTEM_ID,
    Location,
    ServiceSector,
    Space,
    Unit,
    UnitGroup,
)
from terms_of_use.models import TermsOfUse
from tilavarauspalvelu.utils.commons import WEEKDAYS
from users.models import User

from ._utils import (
    batched,
    faker_en,
    faker_fi,
    faker_sv,
    get_paragraphs,
    pascal_case_to_snake_case,
    random_subset,
    with_logs,
)


class Command(BaseCommand):
    help = "Creates test data for development purposes."

    def handle(self, *args: Any, **options: Any) -> str | None:
        return create_test_data()


RoleChoice = TypeVar(
    "RoleChoice",
    UnitRoleChoice,
    ServiceSectorRoleChoice,
    GeneralRoleChoice,
)
RolePermission = TypeVar(
    "RolePermission",
    UnitRolePermission,
    ServiceSectorRolePermission,
    GeneralRolePermission,
)


class UserType(Enum):
    reserver = "Varaaja"
    viewer = "Katselija"
    handler = "Käsittelijä"
    admin = "Pääkäyttäjä"
    product_owner = "Tuoteomistaja"
    all = "Ylläpitäjä"


class FieldCombination(NamedTuple):
    supported: list[str]
    required: list[str]


class Roles(TypedDict):
    general: dict[str, GeneralRoleChoice]
    unit: dict[str, UnitRoleChoice]
    service_sector: dict[str, ServiceSectorRoleChoice]


@with_logs(
    text_entering="Starting test data creation...",
    text_exiting="Test data created!",
)
def create_test_data(flush: bool = True) -> None:
    if flush:
        _clear_database()
    users = _create_users()
    roles = _create_roles_and_permissions()
    units = _create_units()
    unit_groups = _create_unit_groups_for_units(units)
    service_sectors = _create_service_sectors(units)
    _set_user_roles(users, roles, units, unit_groups, service_sectors)

    reservation_unit_types = _create_reservation_unit_types()
    terms_of_use = _create_terms_of_use()
    cancellation_rules = _create_cancellation_rules()
    metadata_sets = _create_reservation_metadata_sets()

    spaces = _create_spaces(units)
    resources = _create_resources(spaces)
    equipments = _create_equipments()
    qualifiers = _create_qualifiers()
    purposes = _create_purposes()
    services = _create_services()

    reservation_units = _create_reservation_units(
        units,
        reservation_unit_types,
        terms_of_use,
        cancellation_rules,
        metadata_sets,
        equipments,
        purposes,
        qualifiers,
        resources,
        services,
        spaces,
    )
    _create_pricings(reservation_units)

    age_groups = _create_age_groups()
    reservation_purposes = _create_reservation_purposes()
    cancel_reasons = _create_cancel_reasons()
    deny_reasons = _create_deny_reasons()

    _create_reservations(
        users[0],
        reservation_units,
        reservation_purposes,
        age_groups,
        cancel_reasons,
        deny_reasons,
    )

    application_rounds = _create_application_rounds(
        reservation_units,
        reservation_purposes,
        service_sectors,
    )
    _create_applications(
        application_rounds,
        users,
        age_groups,
        reservation_purposes,
        reservation_units,
    )


@with_logs(
    text_entering="Flushing database...",
    text_exiting="Database flushed!",
)
def _clear_database():
    call_command("flush", "--noinput")


@with_logs(
    text_entering="Creating users...",
    text_exiting="Users created!",
)
def _create_users() -> list[User]:
    users: list[User] = [
        # Overall Admin
        User(
            date_of_birth="1909-09-09",
            department_name=None,
            email="desada2353@saeoil.com",
            first_name="Pää",
            is_staff=False,
            is_superuser=False,
            last_name="Käyttäjä",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZGNkNTViZWYtOGI5MC00ODk4LTg3ZDgtYWY2ZWU2ZDI3NmU3",
            reservation_notification="only_handling_required",
            tvp_uuid="b281be97-e718-4a58-aa98-005d0d06ba1f",
            username="u-falno2slojcs7dx73y27lqqgfy",
            uuid="2816d76a-4b72-452f-8eff-de35f5c2062e",
        ),
        # Django admin user
        User(
            date_of_birth=None,
            department_name=None,
            email="tvp@example.com",
            first_name="Admin",
            is_staff=True,
            is_superuser=True,
            last_name="User",
            password=make_password("tvp"),  # NOSONAR
            preferred_language=None,
            profile_id="",
            reservation_notification="only_handling_required",
            tvp_uuid="b833ff92-fa18-4c71-aea7-8b04a958254d",
            username="tvp",
            uuid="6a3a72f4-2f84-11ee-9b45-718d9db674aa",
        ),
        # Unit Reserver
        User(
            date_of_birth="1901-01-01",
            department_name=None,
            email="cmwrwapvcajwldiyul@cazlg.com",
            first_name="Varaamo",
            is_staff=False,
            is_superuser=False,
            last_name=f"Unit-{UserType.reserver.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6MjBhNWE1MjItOTQ2NS00YTUzLTkxZDYtZDJiYjA4MWFiMzQ0",
            reservation_notification="only_handling_required",
            tvp_uuid="65f8f884-c8a7-4e7e-b8bd-d9533b933d67",
            username="u-wou6xfojifd6bhbqv6ctjhz35u",
            uuid="b3a9eb95-c941-47e0-9c30-af85349f3bed",
        ),
        # Unit Viewer
        User(
            date_of_birth="1902-02-02",
            department_name=None,
            email="fsr81505@omeie.com",
            first_name="Varaamo",
            is_staff=False,
            is_superuser=False,
            last_name=f"Unit-{UserType.viewer.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6NjBhNTI1NDItYTkzMS00Yzk2LWI3YzQtYTc0YzdkYWNiM2U5",
            reservation_notification="only_handling_required",
            tvp_uuid="2ef4024a-6266-48d8-a098-74a4afbd9a84",
            username="u-mpch4chnyng23dkal3v6m57wf4",
            uuid="63c47e08-edc3-4dad-8d40-5eebe677f62f",
        ),
        # Unit Handler
        User(
            date_of_birth="1903-03-03",
            department_name=None,
            email="srj22958@omeie.com",
            first_name="Varaamo",
            is_staff=False,
            is_superuser=False,
            last_name=f"Unit-{UserType.handler.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZWFhYzdkYTQtNjZiNC00ZjVmLTgyMzItYjAzNTA3YWQ3ODM3",
            reservation_notification="only_handling_required",
            tvp_uuid="92e2882e-4758-4f42-97a4-e1e2e1eca907",
            username="u-7vusen4a4zhk7fhc5w2nw7gxxm",
            uuid="fd692237-80e6-4eaf-94e2-edb4db7cd7bb",
        ),
        # Unit Admin
        User(
            date_of_birth="1904-04-04",
            department_name=None,
            email="kgo52202@omeie.com",
            first_name="Varaamo",
            is_staff=False,
            is_superuser=False,
            last_name=f"Unit-{UserType.admin.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZjNlODU4NTQtNDhhOC00ODkyLTg0MGUtNDJkZGY3Y2IzNGNl",
            reservation_notification="only_handling_required",
            tvp_uuid="2e7c390e-4923-4e42-a389-63e775af82b9",
            username="u-x4j6pw5gfnheva3az3qzj6puru",
            uuid="bf13e7db-a62b-4e4a-8360-cee194f9f48d",
        ),
        # Service Sector Reserver
        User(
            date_of_birth="1911-01-01",
            department_name=None,
            email="iws10782@zbock.com",
            first_name="Varaamo",
            is_staff=False,
            is_superuser=False,
            last_name=f"ServiceSector-{UserType.reserver.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6MzRjYzliY2YtZjVkMy00MmQzLThjZTMtOGYyZjFjMWIzOGVl",
            reservation_notification="only_handling_required",
            tvp_uuid="769bc4d4-0f74-4e03-a4bd-a513e9033f45",
            username="u-fxwxs5kxoffz7fo3sxbekib6l4",
            uuid="2ded7975-5771-4b9f-95db-95c245203e5f",
        ),
        # Service Sector Viewer
        User(
            date_of_birth="1922-02-02",
            department_name=None,
            email="vak40510@zslsz.com",
            first_name="Varaamo",
            is_staff=False,
            is_superuser=False,
            last_name=f"ServiceSector-{UserType.viewer.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6NTc0NDY2ZDUtMTZmNi00MjcyLTg5N2YtNjU4OTgxOGU4OTRh",
            reservation_notification="only_handling_required",
            tvp_uuid="db63d962-184b-47bb-8673-7c53fe244dbc",
            username="u-kjb5efe4yzhp3f73ra6m3irj6u",
            uuid="5243d214-9cc6-4efd-97fb-883ccda229f5",
        ),
        # Service Sector Handler
        User(
            date_of_birth="1933-03-03",
            department_name=None,
            email="atd46519@nezid.com",
            first_name="Varaamo",
            is_staff=False,
            is_superuser=False,
            last_name=f"ServiceSector-{UserType.handler.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6ZmJjN2Y4YTQtNmIzYi00N2Q2LTk0NWEtM2Q4ZGNmMDAxOGZi",
            reservation_notification="only_handling_required",
            tvp_uuid="9d73d525-f6dd-4283-8bf7-7b0592524bfd",
            username="u-q5wzmnl3azbnbny4zgwae3w5ay",
            uuid="876d9635-7b06-42d0-b71c-c9ac026edd06",
        ),
        # Service Sector Admin
        User(
            date_of_birth="1944-04-04",
            department_name=None,
            email="oey10549@zslsz.com",
            first_name="Varaamo",
            is_staff=False,
            is_superuser=False,
            last_name=f"ServiceSector-{UserType.admin.value}",
            password=make_password(None),
            preferred_language=None,
            profile_id="UHJvZmlsZU5vZGU6OGY5YzMzMTMtOTQ0YS00NmY5LTg5ZmUtYWUwZmMyYzIyYTc5",
            reservation_notification="only_handling_required",
            tvp_uuid="d9bfd4c6-8e17-491b-a5bf-24e898544eb8",
            username="u-743tnj4zh5gejhmdxvm3j2ooxy",
            uuid="ff3736a7-993f-4c44-9d83-bd59b4e9cebe",
        ),
    ]

    return User.objects.bulk_create(users)


@with_logs(
    text_entering="Creating roles...",
    text_exiting="Roles created!",
)
def _create_roles_and_permissions() -> Roles:
    roles: Roles = {}
    permission_types = [
        (
            "general",
            GeneralRoleChoice,
            GeneralRolePermission,
            GENERAL_PERMISSIONS,
        ),
        (
            "unit",
            UnitRoleChoice,
            UnitRolePermission,
            UNIT_PERMISSIONS,
        ),
        (
            "service_sector",
            ServiceSectorRoleChoice,
            ServiceSectorRolePermission,
            SERVICE_SECTOR_PERMISSIONS,
        ),
    ]
    role_kind: Literal["general", "unit", "service_sector"]
    role_choice: type[RoleChoice]
    permission: type[RolePermission]
    choices: tuple[tuple[str, Any], ...]

    for role_kind, role_choice, permission, choices in permission_types:
        role_choices: list[RoleChoice] = []
        role_permissions: list[RolePermission] = []

        for user_type in UserType:
            new_role = role_choice(
                code=f"{role_kind}_{user_type.name}",
                verbose_name=user_type.value,
            )
            role_choices.append(new_role)

            for name, _ in choices:
                role_permissions.append(
                    permission(
                        role=new_role,
                        permission=name,
                    )
                )

        roles[role_kind] = {
            role.code: role for role in role_choice.objects.bulk_create(role_choices)
        }
        permission.objects.bulk_create(role_permissions)

    return roles


@with_logs(
    text_entering="Setting user roles...",
    text_exiting="User roles set!",
)
def _set_user_roles(
    users: list[User],
    roles: Roles,
    units: list[Unit],
    unit_groups: list[UnitGroup],
    service_sectors: list[ServiceSector],
) -> None:
    for user in users:
        if user.get_full_name() in ("Pää Käyttäjä", "Admin User"):
            user_role: RoleChoice = roles["general"]["general_admin"]
            _create_general_role(user, user_role, assigner=users[0])
            continue

        kind, user_type = user.last_name.split("-", maxsplit=2)
        user_type: UserType = UserType(user_type)
        kind = pascal_case_to_snake_case(kind)

        user_role: RoleChoice = roles[kind][f"{kind}_{user_type.name}"]

        if kind == "unit":
            _create_unit_role(
                user,
                user_role,
                assigner=users[0],
                units=units,
                unit_groups=unit_groups,
            )

        elif kind == "service_sector":
            _create_service_sector_roles(
                user,
                user_role,
                assigner=users[0],
                service_sectors=service_sectors,
            )

        elif kind == "general":
            _create_general_role(user, user_role, assigner=users[0])

        else:
            raise ValueError(f"Unknown role kind: {kind}")


def _create_general_role(
    user: User,
    role: GeneralRoleChoice,
    *,
    assigner: User,
) -> GeneralRole:
    return GeneralRole.objects.create(
        user=user,
        role=role,
        assigner=assigner,
    )


def _create_unit_role(
    user: User,
    role: UnitRoleChoice,
    *,
    assigner: User,
    units: list[Unit],
    unit_groups: list[UnitGroup],
) -> UnitRole:
    unit_role = UnitRole.objects.create(
        user=user,
        role=role,
        assigner=assigner,
    )
    unit_role.unit.add(*units)
    unit_role.unit_group.add(*unit_groups)
    return unit_role


def _create_service_sector_roles(
    user: User,
    role: ServiceSectorRoleChoice,
    *,
    assigner: User,
    service_sectors: list[ServiceSector],
) -> list[ServiceSectorRole]:
    service_sector_roles: list[ServiceSectorRole] = []
    for service_sector in service_sectors:
        service_sector_role = ServiceSectorRole(
            user=user,
            role=role,
            assigner=assigner,
            service_sector=service_sector,
        )
        service_sector_roles.append(service_sector_role)

    return ServiceSectorRole.objects.bulk_create(service_sector_roles)


@with_logs(
    text_entering="Creating units...",
    text_exiting="Units created!",
)
def _create_units(*, number: int = 10) -> list[Unit]:
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


@with_logs(
    text_entering="Creating locations for units...",
    text_exiting="Locations created!",
)
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


@with_logs(
    text_entering="Creating unit group for units...",
    text_exiting="Unit group created!",
)
def _create_unit_groups_for_units(units: list[Unit]) -> list[UnitGroup]:
    # Currently just one group is created
    unit_group = UnitGroup.objects.create(
        name="Unit Group 1",
        name_fi="Unit Group 1",
        name_en="Unit Group 1",
        name_sv="Unit Group 1",
    )
    unit_group.units.add(*units)
    return [unit_group]


@with_logs(
    text_entering="Creating service sectors...",
    text_exiting="Service sectors created!",
)
def _create_service_sectors(
    units: list[Unit],
    *,
    number: int = 3,
) -> list[ServiceSector]:
    service_sectors: list[ServiceSector] = []
    for i in range(number):
        service_sector = ServiceSector(
            name=f"Service Sector {i}",
            name_fi=f"Service Sector {i}",
            name_sv=f"Service Sector {i}",
            name_en=f"Service Sector {i}",
        )
        service_sectors.append(service_sector)

    service_sectors = ServiceSector.objects.bulk_create(service_sectors)

    units_batched = batched(units, batch_size=len(service_sectors))
    for service_sector in service_sectors:
        units_batch = next(units_batched)
        service_sector.units.add(*units_batch)

    return service_sectors


@with_logs(
    text_entering="Creating spaces...",
    text_exiting="Spaces created!",
)
def _create_spaces(units: list[Unit], *, number: int = 3) -> list[Space]:
    units_loop = cycle(units)

    spaces: list[Space] = []
    for i in range(number):
        space = Space(
            name=f"Space {i}",
            name_fi=f"Space {i}",
            name_sv=f"Space {i}",
            name_en=f"Space {i}",
            unit=next(units_loop),
            lft=1,
            rght=2,
            tree_id=i,
            level=0,
        )
        spaces.append(space)

    return Space.objects.bulk_create(spaces)


@with_logs(
    text_entering="Creating reservation unit types...",
    text_exiting="Reservation unit types created!",
)
def _create_reservation_unit_types(*, number: int = 3) -> list[ReservationUnitType]:
    reservation_unit_types: list[ReservationUnitType] = []
    for i in range(number):
        reservation_unit_type = ReservationUnitType(
            name=f"Reservation Unit Type {i}",
            name_fi=f"Reservation Unit Type {i}",
            name_sv=f"Reservation Unit Type {i}",
            name_en=f"Reservation Unit Type {i}",
            rank=i,
        )
        reservation_unit_types.append(reservation_unit_type)

    return ReservationUnitType.objects.bulk_create(reservation_unit_types)


@with_logs(
    text_entering="Creating terms of use...",
    text_exiting="Terms of use created!",
)
def _create_terms_of_use() -> dict[str, TermsOfUse]:
    terms_of_use: list[TermsOfUse] = []
    for i, (term_type, _) in enumerate(TermsOfUse.TERMS_TYPES):
        name = term_type.replace("_", " ").title()
        text_fi = faker_fi.text()
        text_sv = faker_sv.text()
        text_en = faker_en.text()

        terms = TermsOfUse(
            id=i + 1,
            name=name,
            name_fi=name,
            name_sv=name,
            name_en=name,
            text=text_fi,
            text_fi=text_fi,
            text_sv=text_sv,
            text_en=text_en,
            terms_type=term_type,
        )
        terms_of_use.append(terms)

    return {
        term.terms_type: term for term in TermsOfUse.objects.bulk_create(terms_of_use)
    }


@with_logs(
    text_entering="Creating cancellation rules...",
    text_exiting="Cancellation rules created!",
)
def _create_cancellation_rules(
    *,
    number: int = 1,
) -> list[ReservationUnitCancellationRule]:
    cancellation_rules: list[ReservationUnitCancellationRule] = []
    for i in range(number):

        cancellation_rule = ReservationUnitCancellationRule(
            name=f"Cancellation Rule {i}",
            name_fi=f"Cancellation Rule {i}",
            name_sv=f"Cancellation Rule {i}",
            name_en=f"Cancellation Rule {i}",
            can_be_cancelled_time_before=timedelta(days=i),
        )
        cancellation_rules.append(cancellation_rule)

    return ReservationUnitCancellationRule.objects.bulk_create(cancellation_rules)


@with_logs(
    text_entering="Creating reservation metadata sets...",
    text_exiting="Reservation metadata set created!",
)
def _create_reservation_metadata_sets(
    *,
    number: int = 3,
) -> list[ReservationMetadataSet]:
    metadata_sets: list[ReservationMetadataSet] = []
    for i in range(number):
        reservation_metadata_set = ReservationMetadataSet(
            name=f"Reservation Metadata Set {i}",
        )
        metadata_sets.append(reservation_metadata_set)

    metadata_sets = ReservationMetadataSet.objects.bulk_create(metadata_sets)

    metadata_fields = {field.field_name: field for field in _create_metadata_fields()}

    field_combinations = [
        FieldCombination(
            supported=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_email",
                "reservee_phone",
                "reservee_address_street",
                "reservee_address_zip",
                "reservee_address_city",
                "name",
            ],
            required=[],
        ),
        FieldCombination(
            supported=[
                "reservee_type",
                "reservee_first_name",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_email",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_address_street",
                "reservee_address_city",
                "reservee_address_zip",
                "billing_first_name",
                "billing_last_name",
                "billing_phone",
                "billing_email",
                "billing_address_street",
                "billing_address_city",
                "billing_address_zip",
                "home_city",
                "purpose",
            ],
            required=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_address_street",
                "reservee_address_city",
                "reservee_address_zip",
            ],
        ),
        FieldCombination(
            supported=[
                "reservee_type",
                "reservee_first_name",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_email",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_address_street",
                "reservee_address_city",
                "reservee_address_zip",
                "billing_first_name",
                "billing_last_name",
                "billing_phone",
                "billing_email",
                "billing_address_street",
                "billing_address_city",
                "billing_address_zip",
                "home_city",
                "age_group",
                "applying_for_free_of_charge",
                "free_of_charge_reason",
                "name",
                "description",
                "num_persons",
                "purpose",
            ],
            required=[
                "purpose",
            ],
        ),
    ]

    field_combinations_loop = cycle(field_combinations)

    for metadata_set in metadata_sets:
        fields = next(field_combinations_loop)
        supported = [metadata_fields[field] for field in fields.supported]
        required = [metadata_fields[field] for field in fields.required]
        metadata_set.supported_fields.add(*supported)
        metadata_set.required_fields.add(*required)

    return metadata_sets


@with_logs(
    text_entering="Creating metadata fields...",
    text_exiting="Metadata fields created!",
)
def _create_metadata_fields() -> list[ReservationMetadataField]:
    form_fields = [
        "reservee_type",
        "reservee_first_name",
        "reservee_last_name",
        "reservee_organisation_name",
        "reservee_phone",
        "reservee_email",
        "reservee_id",
        "reservee_is_unregistered_association",
        "reservee_address_street",
        "reservee_address_city",
        "reservee_address_zip",
        "billing_first_name",
        "billing_last_name",
        "billing_phone",
        "billing_email",
        "billing_address_street",
        "billing_address_city",
        "billing_address_zip",
        "home_city",
        "age_group",
        "applying_for_free_of_charge",
        "free_of_charge_reason",
        "name",
        "description",
        "num_persons",
        "purpose",
    ]

    metadata_fields: list[ReservationMetadataField] = []
    for field_name in form_fields:
        field = ReservationMetadataField(field_name=field_name)
        metadata_fields.append(field)

    ReservationMetadataField.objects.bulk_create(
        metadata_fields,
        update_conflicts=True,
        update_fields=["field_name"],
        unique_fields=["field_name"],
    )
    # Re-fetching is required to get the primary keys after 'update_conflicts':
    # https://docs.djangoproject.com/en/4.2/ref/models/querysets/#bulk-create
    return list(ReservationMetadataField.objects.filter(field_name__in=form_fields))


@with_logs(
    text_entering="Creating equipments...",
    text_exiting="Equipments created!",
)
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


@with_logs(
    text_entering="Creating qualifiers...",
    text_exiting="Qualifiers created!",
)
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


@with_logs(
    text_entering="Creating purposes...",
    text_exiting="Purposes created!",
)
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


@with_logs(
    text_entering="Creating resources...",
    text_exiting="Resources created!",
)
def _create_resources(spaces: list[Space], *, number: int = 10) -> list[Resource]:
    resources: list[Resource] = []
    for i in range(number):
        buffer_after: int = random.choices([0, 1], weights=[5, 1])[0]
        buffer_before: int = random.choices([0, 1], weights=[5, 1])[0]

        reservation_purpose = Resource(
            name=f"Resource {i}",
            name_fi=f"Resource {i}",
            name_sv=f"Resource {i}",
            name_en=f"Resource {i}",
            location_type=random.choice(Resource.LOCATION_TYPES)[0],
            space=random.choice(spaces),
            buffer_time_after=timedelta(hours=buffer_after),
            buffer_time_before=timedelta(hours=buffer_before),
        )
        resources.append(reservation_purpose)

    return Resource.objects.bulk_create(resources)


@with_logs(
    text_entering="Creating services...",
    text_exiting="Services created!",
)
def _create_services(*, number: int = 10) -> list[Service]:
    services: list[Service] = []
    for i in range(number):
        buffer_after: int = random.choices([0, 1], weights=[5, 1])[0]
        buffer_before: int = random.choices([0, 1], weights=[5, 1])[0]

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


@with_logs(
    text_entering="Creating reservation units...",
    text_exiting="Reservation units created!",
)
def _create_reservation_units(
    units: list[Unit],
    reservation_unit_types: list[ReservationUnitType],
    terms_of_use: dict[str, TermsOfUse],
    cancellation_rules: list[ReservationUnitCancellationRule],
    metadata_sets: list[ReservationMetadataSet],
    equipments: list[Equipment],
    purposes: list[Purpose],
    qualifiers: list[Qualifier],
    resources: list[Resource],
    services: list[Service],
    spaces: list[Space],
    *,
    number: int = 300,
) -> list[ReservationUnit]:
    reservation_unit_types_loop = cycle(reservation_unit_types)
    units_loop = cycle(units)
    cancellation_rules_loop = cycle(cancellation_rules)
    metadata_set_loop = cycle(metadata_sets)

    hauki_ids = {
        # Oodin nuorisotila - Oodin nuorisotila
        0: "15cf9b75-30f4-4f8e-9c0e-32dc126bf640",
        # Arabian nuorisotalo - Sali
        1: "861de2ef-5524-416d-9845-6c7a85ff181d",
        # Ungdomsgården Sandels - Bändihuone
        2: "333c8668-faf1-4754-bb53-e1c6c46cedc9",
    }

    reservation_units: list[ReservationUnit] = []
    for i in range(number):
        description = get_paragraphs()
        terms = get_paragraphs()
        pending = get_paragraphs()
        confirmed = get_paragraphs()
        cancelled = get_paragraphs()

        min_duration = random.randint(1, 4)
        max_duration = random.randint(min_duration + 1, 8)

        min_persons = random.randint(1, 40)
        max_persons = random.randint(min_persons + 1, 100)

        min_before = random.randint(0, 10)
        max_before = random.randint(min_before + 1, 90)

        hauki_id = hauki_ids.get(i, str(uuid.uuid4()))

        reservation_unit = ReservationUnit(
            allow_reservations_without_opening_hours=True,
            authentication=random.choices(
                ReservationUnit.AUTHENTICATION_TYPES, weights=[2, 1]
            )[0],
            can_apply_free_of_charge=random.choices([True, False], weights=[1, 10])[0],
            cancellation_rule=next(cancellation_rules_loop),
            cancellation_terms=terms_of_use[TermsOfUse.TERMS_TYPE_CANCELLATION],
            contact_information=faker_fi.text(),
            description=description.fi,
            description_en=description.en,
            description_fi=description.fi,
            description_sv=description.sv,
            max_persons=max_persons,
            max_reservation_duration=timedelta(hours=max_duration),
            max_reservations_per_user=random.choices(
                [None, 2, 5, 10], weights=[10, 1, 1, 1]
            )[0],
            metadata_set=next(metadata_set_loop),
            min_persons=min_persons,
            min_reservation_duration=timedelta(hours=min_duration),
            name=f"Reservation Unit {i}",
            name_en=f"Reservation Unit {i}",
            name_fi=f"Reservation Unit {i}",
            name_sv=f"Reservation Unit {i}",
            payment_terms=terms_of_use[TermsOfUse.TERMS_TYPE_PAYMENT],
            pricing_terms=terms_of_use[TermsOfUse.TERMS_TYPE_PRICING],
            rank=i,
            reservation_begins=datetime(2021, 1, 1, tzinfo=timezone.utc),
            reservation_cancelled_instructions=cancelled.fi,
            reservation_cancelled_instructions_en=cancelled.en,
            reservation_cancelled_instructions_fi=cancelled.fi,
            reservation_cancelled_instructions_sv=cancelled.sv,
            reservation_confirmed_instructions=confirmed.fi,
            reservation_confirmed_instructions_en=confirmed.en,
            reservation_confirmed_instructions_fi=confirmed.fi,
            reservation_confirmed_instructions_sv=confirmed.sv,
            reservation_kind=random.choices(ReservationKind.values, weights=[1, 1, 10])[
                0
            ],
            reservation_pending_instructions=pending.fi,
            reservation_pending_instructions_en=pending.en,
            reservation_pending_instructions_fi=pending.fi,
            reservation_pending_instructions_sv=pending.sv,
            reservation_start_interval=random.choice(
                ReservationUnit.RESERVATION_START_INTERVAL_CHOICES
            )[0],
            reservation_unit_type=next(reservation_unit_types_loop),
            reservations_max_days_before=max_before,
            reservations_min_days_before=min_before,
            service_specific_terms=terms_of_use[TermsOfUse.TERMS_TYPE_SERVICE],
            surface_area=random.randint(10, 1000),
            terms_of_use=terms.fi,
            terms_of_use_en=terms.en,
            terms_of_use_fi=terms.fi,
            terms_of_use_sv=terms.sv,
            unit=next(units_loop),
            uuid=hauki_id,
        )
        reservation_units.append(reservation_unit)

    reservation_units = ReservationUnit.objects.bulk_create(reservation_units)

    payment_types = _create_reservation_payment_types()

    for reservation_unit in reservation_units:
        reservation_unit.equipments.add(*random_subset(equipments))
        reservation_unit.purposes.add(*random_subset(purposes))
        reservation_unit.qualifiers.add(*random_subset(qualifiers))
        reservation_unit.resources.add(*random_subset(resources))
        reservation_unit.services.add(*random_subset(services))
        reservation_unit.spaces.add(*random_subset(spaces))
        reservation_unit.payment_types.add(*random_subset(payment_types))

    return reservation_units


@with_logs(
    text_entering="Creating reservation payment types...",
    text_exiting="Reservation payment types created!",
)
def _create_reservation_payment_types() -> list[ReservationUnitPaymentType]:
    payment_types: list[ReservationUnitPaymentType] = []
    codes = ["ONLINE", "INVOICE", "ON_SITE"]
    for code in codes:
        # Creation is done one-by-one since 'code' is a primary key
        # and 'bulk_create' doesn't support 'update_conflicts' with primary keys:
        # https://docs.djangoproject.com/en/4.2/ref/models/querysets/#bulk-create
        payment_type, _ = ReservationUnitPaymentType.objects.get_or_create(code=code)
        payment_types.append(payment_type)

    return payment_types


@with_logs(
    text_entering="Creating reservation purposes...",
    text_exiting="Reservation purposes created!",
)
def _create_reservation_purposes(*, number: int = 10) -> list[ReservationPurpose]:
    reservation_purposes: list[ReservationPurpose] = []
    for i in range(number):
        reservation_purpose = ReservationPurpose(
            name=f"Reservation Purpose {i}",
            name_fi=f"Reservation Purpose {i}",
            name_sv=f"Reservation Purpose {i}",
            name_en=f"Reservation Purpose {i}",
        )
        reservation_purposes.append(reservation_purpose)

    return ReservationPurpose.objects.bulk_create(reservation_purposes)


@with_logs(
    text_entering="Creating age groups...",
    text_exiting="Age groups created!",
)
def _create_age_groups() -> list[AgeGroup]:
    combinations = [
        (1, 8),
        (9, 12),
        (13, 17),
        (18, 24),
        (25, 28),
        (29, 64),
        (65, None),
    ]

    age_groups: list[AgeGroup] = []
    for minimum, maximum in combinations:
        age_group = AgeGroup(
            minimum=minimum,
            maximum=maximum,
        )
        age_groups.append(age_group)

    return AgeGroup.objects.bulk_create(age_groups)


@with_logs(
    text_entering="Creating cancel reasons...",
    text_exiting="Cancel reasons created!",
)
def _create_cancel_reasons(*, number: int = 10) -> list[ReservationCancelReason]:
    cancel_reasons: list[ReservationCancelReason] = []
    for i in range(number):
        cancel_reason = ReservationCancelReason(
            reason=f"Reservation Cancel Reason {i}",
            reason_fi=f"Reservation Cancel Reason {i}",
            reason_sv=f"Reservation Cancel Reason {i}",
            reason_en=f"Reservation Cancel Reason {i}",
        )
        cancel_reasons.append(cancel_reason)

    return ReservationCancelReason.objects.bulk_create(cancel_reasons)


@with_logs(
    text_entering="Creating deny reasons...",
    text_exiting="Deny reasons created!",
)
def _create_deny_reasons(*, number: int = 10) -> list[ReservationDenyReason]:
    deny_reasons: list[ReservationDenyReason] = []
    for i in range(number):
        deny_reason = ReservationDenyReason(
            reason=f"Reservation Deny Reason {i}",
            reason_fi=f"Reservation Deny Reason {i}",
            reason_sv=f"Reservation Deny Reason {i}",
            reason_en=f"Reservation Deny Reason {i}",
        )
        deny_reasons.append(deny_reason)

    return ReservationDenyReason.objects.bulk_create(deny_reasons)


@with_logs(
    text_entering="Creating pricings...",
    text_exiting="Pricings created!",
)
def _create_pricings(
    reservation_units: list[ReservationUnit],
) -> list[ReservationUnitPricing]:
    tax_percentages = _create_tax_percentages()
    zero_tax = next(tax for tax in tax_percentages if float(tax.value) == 0.0)

    pricings: list[ReservationUnitPricing] = []
    for reservation_unit in reservation_units:
        pricing_type = random.choice(PricingType.values)

        pricing = ReservationUnitPricing(
            begins=date(2021, 1, 1),
            pricing_type=pricing_type,
            price_unit=random.choice(PriceUnit.values),
            lowest_price=0,
            lowest_price_net=0,
            highest_price=0,
            highest_price_net=0,
            tax_percentage=zero_tax,
            status=PricingStatus.PRICING_STATUS_ACTIVE.value,
            reservation_unit=reservation_unit,
        )
        pricings.append(pricing)

        # Around 1/5 of the reservation units have two pricings
        add_another: bool = random.choices([True, False], weights=[1, 5])[0]
        if not add_another:
            continue

        tax_percentage: TaxPercentage = random.choice(tax_percentages)
        multiplier = Decimal(f"1.{int(tax_percentage.value)}")

        lowest_net = random.randint(0, 100)
        highest_net = random.randint(lowest_net, 1000)
        lowest = float(lowest_net * multiplier)
        highest = float(highest_net * multiplier)

        # Around 1/10 of the pricings are inactive
        pricing_status: str = random.choices(PricingStatus.values, weights=[1, 10, 0])

        pricing = ReservationUnitPricing(
            begins=date(2021, 1, 1),
            pricing_type=pricing_type,
            price_unit=random.choice(PriceUnit.values),
            lowest_price=lowest,
            lowest_price_net=lowest_net,
            highest_price=highest,
            highest_price_net=highest_net,
            tax_percentage=tax_percentage,
            status=pricing_status,
            reservation_unit=reservation_unit,
        )
        pricings.append(pricing)

    return ReservationUnitPricing.objects.bulk_create(pricings)


@with_logs(
    text_entering="Creating tax percentages...",
    text_exiting="Tax percentages created!",
)
def _create_tax_percentages() -> list[TaxPercentage]:
    tax_percentages: list[TaxPercentage] = []
    percentages = (0, 10, 14, 24)
    for percentage in percentages:
        # Creation is done one-by-one since 'value' is a not defined as unique
        # and 'bulk_create' doesn't support 'update_conflicts' without a unique constraint:
        # https://docs.djangoproject.com/en/4.2/ref/models/querysets/#bulk-create
        tax_percentage, _ = TaxPercentage.objects.get_or_create(value=percentage)
        tax_percentages.append(tax_percentage)

    return tax_percentages


@with_logs(
    text_entering="Creating reservations...",
    text_exiting="Reservations created!",
)
def _create_reservations(
    user: User,
    reservation_units: list[ReservationUnit],
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cancel_reasons: list[ReservationCancelReason],
    deny_reasons: list[ReservationDenyReason],
    *,
    number: int = 200,
) -> list[Reservation]:
    past_date_start = datetime(year=2021, month=1, day=1, tzinfo=timezone.utc)
    half = number // 2

    reservations: list[Reservation] = []
    reservation_units_chosen: list[ReservationUnit] = []
    for i in range(number):
        if i == half:
            past_date_start = past_date_start.replace(year=2027)

        reservation_unit: ReservationUnit = random.choice(reservation_units)

        persons = random.randint(
            reservation_unit.min_persons, reservation_unit.max_persons
        )
        min_hours = math.ceil(
            reservation_unit.min_reservation_duration.total_seconds() / 3600
        )
        max_hours = math.ceil(
            reservation_unit.max_reservation_duration.total_seconds() / 3600
        )

        begin = past_date_start + timedelta(days=i)
        begin = begin.replace(
            hour=random.choice(range(8, 20 - max_hours)),
            minute=random.choice([0, 15, 30, 45]),
        )
        end = begin + timedelta(hours=random.choice(range(min_hours, max_hours)))

        state = STATE_CHOICES.CONFIRMED

        pricing: ReservationUnitPricing = random.choice(
            list(reservation_unit.pricings.all())
        )
        if pricing.highest_price != Decimal("0"):
            state = random.choice(
                [STATE_CHOICES.WAITING_FOR_PAYMENT, STATE_CHOICES.CONFIRMED]
            )

        deny_reason: ReservationDenyReason | None = None
        cancel_reason = random.choices(
            [None, random.choice(cancel_reasons)], weights=[3, 1]
        )[0]
        if cancel_reason is None:
            deny_reason = random.choices(
                [None, random.choice(deny_reasons)], weights=[3, 1]
            )[0]
            if deny_reason is not None:
                state = STATE_CHOICES.DENIED
        else:
            state = STATE_CHOICES.CANCELLED

        reservation = Reservation(
            age_group=random.choice(age_groups),
            applying_for_free_of_charge=random.choice([True, False]),
            begin=begin,
            billing_address_city=faker_fi.city(),
            billing_address_street=faker_fi.street_name(),
            billing_address_zip=faker_fi.postcode(),
            billing_email=faker_fi.email(),
            billing_first_name=user.first_name,
            billing_last_name=user.last_name,
            billing_phone=faker_fi.phone_number(),
            buffer_time_after=timedelta(hours=random.choice(range(2))),
            buffer_time_before=timedelta(hours=random.choice(range(2))),
            cancel_reason=cancel_reason,
            confirmed_at=begin,
            deny_reason=deny_reason,
            description=faker_fi.sentence(),
            end=end,
            free_of_charge_reason=faker_fi.sentence(),
            name=f"Reservation {i}",
            num_persons=persons,
            price=pricing.highest_price,
            price_net=pricing.highest_price_net,
            purpose=random.choice(reservation_purposes),
            reservee_address_city=faker_fi.city(),
            reservee_address_street=faker_fi.street_name(),
            reservee_address_zip=faker_fi.postcode(),
            reservee_email=faker_fi.email(),
            reservee_first_name=user.first_name,
            reservee_id=faker_fi.company_business_id(),
            reservee_language="fi",
            reservee_last_name=user.last_name,
            reservee_organisation_name=faker_fi.company(),
            reservee_phone=faker_fi.phone_number(),
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            state=state,
            tax_percentage_value=pricing.tax_percentage.value,
            user=user,
        )
        reservations.append(reservation)
        reservation_units_chosen.append(reservation_unit)

    reservations = Reservation.objects.bulk_create(reservations)
    for reservation, reservation_unit in zip(
        reservations, reservation_units_chosen, strict=True
    ):
        reservation.reservation_unit.add(reservation_unit)

    return reservations


@with_logs(
    text_entering="Creating application rounds...",
    text_exiting="Application rounds created!",
)
def _create_application_rounds(
    reservation_units: list[ReservationUnit],
    reservation_purposes: list[ReservationPurpose],
    service_sectors: list[ServiceSector],
    *,
    number: int = 15,
) -> list[ApplicationRound]:

    service_sectors_loop = cycle(service_sectors)
    period_options = cycle(
        [
            # past
            (
                datetime(2021, 1, 1, tzinfo=timezone.utc),
                datetime(2023, 1, 1, tzinfo=timezone.utc),
            ),
            # current
            (
                datetime(2022, 1, 1, tzinfo=timezone.utc),
                datetime(2027, 1, 1, tzinfo=timezone.utc),
            ),
            # future
            (
                datetime.now(tz=timezone.utc) + timedelta(days=365),
                datetime(2027, 1, 1, tzinfo=timezone.utc),
            ),
        ]
    )

    application_rounds: list[ApplicationRound] = []

    for i in range(number):
        criteria = get_paragraphs()

        period = next(period_options)

        application_round = ApplicationRound(
            name=f"Application Round {i}",
            name_fi=f"Application Round {i}",
            name_en=f"Application Round {i}",
            name_sv=f"Application Round {i}",
            target_group=random.choice(ApplicationRound.TARGET_GROUP_CHOICES)[0],
            application_period_begin=period[0],
            application_period_end=period[1],
            reservation_period_begin=period[0],
            reservation_period_end=period[1],
            public_display_begin=datetime(2021, 1, 1, tzinfo=timezone.utc),
            public_display_end=datetime(2027, 1, 1, tzinfo=timezone.utc),
            service_sector=next(service_sectors_loop),
            criteria=criteria.fi,
            criteria_fi=criteria.fi,
            criteria_en=criteria.en,
            criteria_sv=criteria.sv,
        )
        application_rounds.append(application_round)

    application_rounds = ApplicationRound.objects.bulk_create(application_rounds)
    for application_round in application_rounds:
        application_round.reservation_units.add(
            *random_subset(reservation_units, max_size=10)
        )
        application_round.purposes.add(*random_subset(reservation_purposes, max_size=5))

    return application_rounds


@with_logs(
    text_entering="Creating applications...",
    text_exiting="Applications created!",
)
def _create_applications(
    application_rounds: list[ApplicationRound],
    users: list[User],
    age_groups: list[AgeGroup],
    reservation_purposes: list[ReservationPurpose],
    reservation_units: list[ReservationUnit],
    *,
    number: int = 20,
) -> list[Application]:

    contact_persons = _create_persons(number=number)
    billing_addresses = _create_addresses(number=number)
    organisations = _create_organisation(billing_addresses)
    applications: list[Application] = []

    items: zip[tuple[Person, Address, tuple[str, Organisation | None]]]
    items = zip(contact_persons, billing_addresses, organisations, strict=True)
    for contact_person, billing_address, (applicant_type, organisation) in items:
        # User is the overall admin mode often, but other users are also possible
        user: User = random.choices(
            users, weights=[len(users)] + ([1] * (len(users) - 1))
        )[0]

        application = Application(
            applicant_type=applicant_type,
            contact_person=contact_person,
            user=user,
            organisation=organisation,
            application_round=random.choice(application_rounds),
            billing_address=billing_address,
            additional_information=faker_fi.sentence(),
        )
        applications.append(application)

    applications = Application.objects.bulk_create(applications)
    _create_application_events(
        applications, age_groups, reservation_purposes, reservation_units
    )
    return applications


@with_logs(
    text_entering="Creating persons...",
    text_exiting="Persons created!",
)
def _create_persons(
    *,
    number: int = 20,
) -> list[Person]:
    contact_persons: list[Person] = []

    for _ in range(number):
        contact_person = Person(
            first_name=faker_fi.first_name(),
            last_name=faker_fi.last_name(),
            phone_number=faker_fi.phone_number(),
            email=faker_fi.email(),
        )
        contact_persons.append(contact_person)

    return Person.objects.bulk_create(contact_persons)


@with_logs(
    text_entering="Creating addresses...",
    text_exiting="Adresses created!",
)
def _create_addresses(
    *,
    number: int = 20,
) -> list[Address]:
    billing_addresses: list[Address] = []

    for _ in range(number):
        street_address = faker_fi.street_address()
        city = faker_fi.city()
        billing_address = Address(
            street_address=street_address,
            street_address_fi=street_address,
            street_address_en=faker_en.street_address(),
            street_address_sv=faker_sv.street_address(),
            post_code=faker_fi.postcode(),
            city=city,
            city_fi=city,
            city_en=faker_en.city(),
            city_sv=faker_sv.city(),
        )
        billing_addresses.append(billing_address)

    return Address.objects.bulk_create(billing_addresses)


@with_logs(
    text_entering="Creating organisations...",
    text_exiting="Organisations created!",
)
def _create_organisation(
    contact_persons: list[Person],
) -> list[tuple[str, Organisation | None]]:
    organisations: list[Organisation] = []
    applicant_types: list[str] = []

    for billing_address in contact_persons:
        applicant_type = random.choice(APPLICANT_TYPES.APPLICANT_TYPE_CHOICES)[0]

        organisation: Organisation | None = None
        if applicant_type == APPLICANT_TYPES.APPLICANT_TYPE_COMMUNITY:
            organisation = Organisation(
                name=faker_fi.company(),
                identifier=faker_fi.company_business_id(),
                organisation_type=Organisation.RELIGIOUS_COMMUNITY,
                year_established=random.randint(1900, 2022),
                address=billing_address,
                active_members=random.randint(1, 1000),
                core_business=faker_fi.sentence(),
                email=faker_fi.email(),
            )
        elif applicant_type == APPLICANT_TYPES.APPLICANT_TYPE_COMPANY:
            organisation = Organisation(
                name=faker_fi.company(),
                identifier=faker_fi.company_business_id(),
                organisation_type=Organisation.COMPANY,
                year_established=random.randint(1900, 2022),
                address=billing_address,
                active_members=random.randint(1, 1000),
                core_business=faker_fi.sentence(),
                email=faker_fi.email(),
            )
        elif applicant_type == APPLICANT_TYPES.APPLICANT_TYPE_ASSOCIATION:
            organisation = Organisation(
                name=faker_fi.company(),
                identifier=faker_fi.company_business_id(),
                organisation_type=random.choice(
                    [
                        Organisation.REGISTERED_ASSOCIATION,
                        Organisation.PUBLIC_ASSOCIATION,
                        Organisation.UNREGISTERED_ASSOCIATION,
                        Organisation.MUNICIPALITY_CONSORTIUM,
                    ],
                ),
                year_established=random.randint(1900, 2022),
                address=billing_address,
                active_members=random.randint(1, 1000),
                core_business=faker_fi.sentence(),
                email=faker_fi.email(),
            )

        if organisation is not None:
            organisations.append(organisation)
            applicant_types.append(applicant_type)
        else:
            applicant_types.append(applicant_type)

    organisations = Organisation.objects.bulk_create(organisations)
    organisations_iter = iter(organisations)

    # Add Nones where organization was not created
    return [
        (applicant_type, None)
        if applicant_type == APPLICANT_TYPES.APPLICANT_TYPE_INDIVIDUAL
        else (applicant_type, next(organisations_iter))
        for applicant_type in applicant_types
    ]


@with_logs(
    text_entering="Creating application events...",
    text_exiting="Application events created!",
)
def _create_application_events(
    applications: list[Application],
    age_groups: list[AgeGroup],
    reservation_purposes: list[ReservationPurpose],
    reservation_units: list[ReservationUnit],
) -> list[ApplicationEvent]:
    application_events: list[ApplicationEvent] = []

    for application in applications:
        for _ in range(random.randint(1, 3)):
            name = faker_fi.word()
            min_duration = random.randint(1, 2)
            max_duration = random.randint(min_duration, 5)

            event = ApplicationEvent(
                name=name,
                name_fi=name,
                name_en=faker_en.word(),
                name_sv=faker_sv.word(),
                num_persons=random.randint(1, 100),
                age_group=random.choice(age_groups),
                min_duration=timedelta(hours=min_duration),
                max_duration=timedelta(hours=max_duration),
                events_per_week=random.randint(1, 10),
                biweekly=random.choices([True, False], weights=[1, 5])[0],
                begin=application.application_round.reservation_period_begin,
                end=application.application_round.reservation_period_end,
                application=application,
                purpose=random.choice(reservation_purposes),
            )
            application_events.append(event)

    application_events = ApplicationEvent.objects.bulk_create(application_events)
    _create_event_reservation_units(application_events, reservation_units)
    _create_application_event_schedules(application_events)
    return application_events


@with_logs(
    text_entering="Creating application reservation units...",
    text_exiting="Application reservation units created!",
)
def _create_event_reservation_units(
    application_events: list[ApplicationEvent],
    reservation_units: list[ReservationUnit],
) -> list[EventReservationUnit]:
    event_units: list[EventReservationUnit] = []
    for application_event in application_events:
        amount = random.randint(1, 4)
        units: list[ReservationUnit] = random.sample(reservation_units, k=amount)

        for i, unit in enumerate(units):
            event_unit = EventReservationUnit(
                priority=i,
                application_event=application_event,
                reservation_unit=unit,
            )
            event_units.append(event_unit)

    return EventReservationUnit.objects.bulk_create(event_units)


@with_logs(
    text_entering="Creating application event schedules...",
    text_exiting="Application event schedules created!",
)
def _create_application_event_schedules(
    application_events: list[ApplicationEvent],
) -> list[ApplicationEventSchedule]:
    schedules: list[ApplicationEventSchedule] = []
    for application_event in application_events:
        weekdays: list[int] = [choice for choice, _ in WEEKDAYS.CHOICES]
        for _ in range(random.randint(1, 4)):
            weekday = weekdays.pop(random.randint(0, len(weekdays) - 1))
            begin = random.randint(8, 20)
            end = random.randint(begin + 1, 21)

            schedule = ApplicationEventSchedule(
                day=weekday,
                begin=time(hour=begin, tzinfo=timezone.utc),
                end=time(hour=end, tzinfo=timezone.utc),
                priority=random.choice(PRIORITIES.PRIORITY_CHOICES)[0],
                application_event=application_event,
            )
            schedules.append(schedule)

    return ApplicationEventSchedule.objects.bulk_create(schedules)
