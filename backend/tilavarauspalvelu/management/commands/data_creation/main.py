from __future__ import annotations

import os

from django.core.management import call_command

from .create_caisa import _create_caisa
from .create_misc import _create_banner_notifications, _create_general_terms_of_use, _create_periodic_tasks
from .create_permissions import _create_unit_groups, _set_user_group_permissions, _set_user_roles
from .create_reservation_related_things import (
    _create_age_groups,
    _create_cancellation_rules,
    _create_hauki_resources,
    _create_reservation_purposes,
    _create_specific_terms_of_use,
    _create_tax_percentages,
)
from .create_reservation_units import _create_reservation_units
from .create_reservations import _create_reservation_series, _create_reservations
from .create_seasonal_booking import _create_application_rounds
from .create_users import _create_users
from .utils import defer_reservation_unit_create_operations, with_logs


@with_logs
@defer_reservation_unit_create_operations
def create_test_data(*, flush: bool = True) -> None:
    if flush:
        _clear_database()

    _create_users()
    _create_general_terms_of_use()

    hauki_resources = _create_hauki_resources()
    terms_of_use = _create_specific_terms_of_use()
    cancellation_rules = _create_cancellation_rules()
    tax_percentages = _create_tax_percentages()

    _create_reservation_units(
        terms_of_use=terms_of_use,
        cancellation_rules=cancellation_rules,
        hauki_resources=hauki_resources,
        tax_percentages=tax_percentages,
    )

    reservation_purposes = _create_reservation_purposes()
    age_groups = _create_age_groups()

    _create_reservations(
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
    )

    _create_reservation_series(
        terms_of_use=terms_of_use,
        cancellation_rules=cancellation_rules,
        hauki_resources=hauki_resources,
        tax_percentage=tax_percentages["0"],
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
    )

    _create_unit_groups()

    _set_user_group_permissions()
    _set_user_roles()

    _create_application_rounds(
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
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
