# ruff: noqa: S311

from django.core.management import call_command

from reservation_units.models import ReservationUnitHierarchy

from .create_caisa import _create_caisa
from .create_misc import _create_banner_notifications, _create_periodic_tasks
from .create_permissions import (
    _create_roles_and_permissions,
    _create_service_sectors,
    _set_user_group_permissions,
    _set_user_roles,
)
from .create_reservables import (
    _create_equipments,
    _create_purposes,
    _create_qualifiers,
    _create_resources,
    _create_services,
    _create_spaces,
    create_spaces_in_hierarchy,
)
from .create_reservation_units import (
    _create_cancellation_rules,
    _create_hauki_resources,
    _create_pricings,
    _create_reservation_unit_types,
    _create_reservation_units,
    _create_terms_of_use,
)
from .create_reservations import (
    _create_cancel_reasons,
    _create_deny_reasons,
    _create_reservation_metadata_sets,
    _create_reservation_purposes,
    _create_reservations,
)
from .create_seasonal_booking import (
    _create_age_groups,
    _create_application_rounds,
    _create_applications,
    _create_cities,
)
from .create_units import _create_unit_groups_for_units, _create_units, _rename_empty_units
from .create_users import _create_users
from .utils import with_logs


@with_logs("Starting test data creation...", "Test data created!")
def create_test_data(flush: bool = True) -> None:
    if flush:
        _clear_database()
    users = _create_users()
    _set_user_group_permissions(users)
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
    extra_units = create_spaces_in_hierarchy()
    resources = _create_resources(spaces)
    equipments = _create_equipments()
    qualifiers = _create_qualifiers()
    purposes = _create_purposes()
    services = _create_services()
    hauki_resources = _create_hauki_resources()

    empty_units, units = units[-3:], units[:-3]  # leave few units without reservation units
    _rename_empty_units(empty_units)

    reservation_units = _create_reservation_units(
        units + extra_units,
        reservation_unit_types,
        terms_of_use,
        cancellation_rules,
        metadata_sets,
        equipments,
        purposes,
        qualifiers,
        resources,
        services,
        hauki_resources,
    )
    _create_pricings(reservation_units)

    _create_caisa(metadata_sets)

    age_groups = _create_age_groups()
    reservation_purposes = _create_reservation_purposes()
    cancel_reasons = _create_cancel_reasons()
    deny_reasons = _create_deny_reasons()
    cities = _create_cities()

    _create_reservations(
        users[0],
        reservation_units,
        reservation_purposes,
        age_groups,
        cancel_reasons,
        deny_reasons,
        cities,
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
        cities,
    )
    _create_banner_notifications()
    _create_periodic_tasks()

    ReservationUnitHierarchy.refresh()


@with_logs("Flushing database...", "Database flushed!")
def _clear_database() -> None:
    call_command("flush", "--noinput")
