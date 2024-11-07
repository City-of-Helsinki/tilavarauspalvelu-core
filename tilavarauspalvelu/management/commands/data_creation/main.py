import os

from django.core.management import call_command

from .create_caisa import _create_caisa
from .create_misc import _create_banner_notifications, _create_general_terms_of_use, _create_periodic_tasks
from .create_permissions import _create_unit_groups, _set_user_group_permissions, _set_user_roles
from .create_reservation_related_things import (
    _create_age_groups,
    _create_cities,
    _create_locations,
    _create_reservation_purposes,
)
from .create_reservation_units import _create_reservation_units
from .create_reservations import _create_reservations
from .create_seasonal_booking import _create_application_rounds
from .create_users import _create_users
from .utils import refresh_materialized_views_at_the_end, with_logs


@with_logs
@refresh_materialized_views_at_the_end
def create_test_data(flush: bool = True) -> None:
    if flush:
        _clear_database()

    _create_users()
    _create_general_terms_of_use()

    _create_reservation_units()

    reservation_purposes = _create_reservation_purposes()
    age_groups = _create_age_groups()
    cities = _create_cities()

    _create_reservations(
        reservation_purposes,
        age_groups,
        cities,
    )

    _create_unit_groups()
    _create_locations()

    _set_user_group_permissions()
    _set_user_roles()

    _create_application_rounds(
        reservation_purposes,
        age_groups,
        cities,
    )

    _create_banner_notifications()
    _create_periodic_tasks()

    _create_caisa()


@with_logs
def _clear_database() -> None:
    if os.getenv("DJANGO_SETTINGS_ENVIRONMENT") == "Production":
        msg = "Hey! This is the production environment! Don't just go flushing the database! >:("
        raise RuntimeError(msg)

    call_command("flush", "--noinput", allow_cascade=True)
