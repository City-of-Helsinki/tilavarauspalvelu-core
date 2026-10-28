from __future__ import annotations

import dataclasses
import datetime
from typing import TYPE_CHECKING

from django.db import models
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationRoundReservationCreationStatusChoice, PriceComponentKind
from tilavarauspalvelu.models import ApplicationRound, PriceComponent, PriceOption, ReservationUnitPricingGroup
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

if TYPE_CHECKING:
    from collections.abc import Collection, Iterable

    from tilavarauspalvelu.models import PricingGroup

__all__ = [
    "RoundOptionError",
    "application_round_price_options",
    "check_application_round_change",
    "check_price_option_change_keeps_round_options",
    "check_pricing_change_keeps_round_options",
]


@dataclasses.dataclass(frozen=True, slots=True)
class RoundOptionError:
    code: error_codes
    message: str


def application_round_price_options(application_round: ApplicationRound) -> list[PriceOption]:
    """
    Return the price options that the application round offers, ordered by name.

    A round offers an option if the pricing groups of all its reservation units offer it
    on every day of the reservation period. A group offers an option on a date if it has
    an active base component for that option. An active base component without an option
    offers every active option of the group's unit group.
    """
    reservation_unit_pks = list(application_round.reservation_units.values_list("pk", flat=True))
    round_pricing = _load_round_pricing(
        reservation_unit_pks=reservation_unit_pks,
        period_begin=application_round.reservation_period_begin_date,
        period_end=application_round.reservation_period_end_date,
    )
    option_pks = _offered_option_pks(round_pricing)
    return list(PriceOption.objects.filter(pk__in=option_pks).order_by("name"))


def check_application_round_change(
    *,
    application_round_pk: int | None,
    reservation_unit_pks: Collection[int],
    period_begin: datetime.date,
    period_end: datetime.date,
) -> list[RoundOptionError]:
    """
    Check the new reservation units and reservation period of an application round.

    :param application_round_pk: The saved round, or None for a new round.

    Every reservation unit must have the same price options on every day of the reservation period.
    If the reservations of a saved round are not made yet, the round must not lose any of the options it offers.
    """
    new_pricing = _load_round_pricing(
        reservation_unit_pks=reservation_unit_pks,
        period_begin=period_begin,
        period_end=period_end,
    )
    errors = _check_consistency(new_pricing)
    if application_round_pk is None:
        return errors

    saved_round = ApplicationRound.objects.get(pk=application_round_pk)
    if not _reservations_are_pending(saved_round):
        return errors

    saved_reservation_unit_pks = list(saved_round.reservation_units.values_list("pk", flat=True))
    saved_pricing = _load_round_pricing(
        reservation_unit_pks=saved_reservation_unit_pks,
        period_begin=saved_round.reservation_period_begin_date,
        period_end=saved_round.reservation_period_end_date,
    )
    errors += _check_no_lost_options(saved_pricing=saved_pricing, new_pricing=new_pricing)
    return errors


def check_pricing_change_keeps_round_options(
    *,
    pricing_group: PricingGroup,
    components: Iterable[PriceComponent],
    reservation_unit_rows: Iterable[ReservationUnitPricingGroup] | None,
) -> list[RoundOptionError]:
    """
    Check a change to the components or the reservation units of a pricing group
    against the application rounds whose reservations are not made yet.

    Each such round must stay consistent and must not lose any of the options it offers.

    :param pricing_group: The pricing group to change.
    :param components: All components of the pricing group after the change, saved or not.
    :param reservation_unit_rows: All reservation unit rows of the pricing group after the change, saved or not.
                                  None if the rows do not change.
    """
    components = list(components)
    saved_rows: list[ReservationUnitPricingGroup] = []
    if pricing_group.pk is not None:
        saved_rows = list(ReservationUnitPricingGroup.objects.filter(pricing_group=pricing_group))

    new_rows = saved_rows if reservation_unit_rows is None else list(reservation_unit_rows)

    reservation_unit_pks = {row.reservation_unit_id for row in saved_rows} | {
        row.reservation_unit_id for row in new_rows
    }
    application_rounds = (
        ApplicationRound.objects
        .filter(pk__in=ApplicationRound.objects.filter(reservation_units__in=reservation_unit_pks).values("pk"))
        .exclude(L(reservation_creation_status=ApplicationRoundReservationCreationStatusChoice.COMPLETED))
        # A handled round without allocations never becomes completed.
        .exclude(reservation_period_end_date__lt=local_date())
        .order_by("pk")
    )

    errors: list[RoundOptionError] = []
    for application_round in application_rounds:
        round_reservation_unit_pks = set(application_round.reservation_units.values_list("pk", flat=True))
        saved_pricing = _load_round_pricing(
            reservation_unit_pks=round_reservation_unit_pks,
            period_begin=application_round.reservation_period_begin_date,
            period_end=application_round.reservation_period_end_date,
        )

        other_group_rows = [row for row in saved_pricing.rows if row.pricing_group_id != pricing_group.pk]
        changed_group_rows = [row for row in new_rows if row.reservation_unit_id in round_reservation_unit_pks]
        other_group_components = [
            component for component in saved_pricing.components if component.pricing_group_id != pricing_group.pk
        ]
        changed_group_components = [component for component in components if component.kind == PriceComponentKind.BASE]
        new_components = [*other_group_components, *changed_group_components]

        new_pricing = _RoundPricing(
            reservation_unit_pks=saved_pricing.reservation_unit_pks,
            period_begin=saved_pricing.period_begin,
            period_end=saved_pricing.period_end,
            rows=[*other_group_rows, *changed_group_rows],
            components=new_components,
            implicit_options=_load_implicit_options(new_components),
        )

        errors += _check_round_change(
            round_name=application_round.name,
            saved_pricing=saved_pricing,
            new_pricing=new_pricing,
        )

    return errors


def check_price_option_change_keeps_round_options(price_option: PriceOption) -> list[RoundOptionError]:
    """
    Check a new or changed price option against the application rounds whose reservations are not made yet.

    A base component without an option offers every active option of its unit group.
    So a new, deactivated or moved option can change the options of a round.
    Each such round must stay consistent and must not lose any of the options it offers.

    :param price_option: The price option with its new values, not saved yet. No pk for a new option.
    """
    unit_group_pks = {price_option.unit_group_id}
    if price_option.pk is not None:
        saved_option = PriceOption.objects.get(pk=price_option.pk)
        unit_group_pks.add(saved_option.unit_group_id)

    rounds_using_unit_groups = ApplicationRound.objects.filter(
        reservation_units__reservation_unit_pricing_groups__pricing_group__unit_group__in=unit_group_pks,
    )
    application_rounds = (
        ApplicationRound.objects
        .filter(pk__in=rounds_using_unit_groups.values("pk"))
        .exclude(L(reservation_creation_status=ApplicationRoundReservationCreationStatusChoice.COMPLETED))
        # A handled round without allocations never becomes completed.
        .exclude(reservation_period_end_date__lt=local_date())
        .order_by("pk")
    )

    errors: list[RoundOptionError] = []
    for application_round in application_rounds:
        round_reservation_unit_pks = list(application_round.reservation_units.values_list("pk", flat=True))
        saved_pricing = _load_round_pricing(
            reservation_unit_pks=round_reservation_unit_pks,
            period_begin=application_round.reservation_period_begin_date,
            period_end=application_round.reservation_period_end_date,
        )

        implicit_options = {
            unit_group_pk: [option for option in options if option.pk != price_option.pk]
            for unit_group_pk, options in saved_pricing.implicit_options.items()
        }
        if price_option.is_active and price_option.unit_group_id in implicit_options:
            implicit_options[price_option.unit_group_id].append(price_option)

        new_pricing = dataclasses.replace(saved_pricing, implicit_options=implicit_options)

        errors += _check_round_change(
            round_name=application_round.name,
            saved_pricing=saved_pricing,
            new_pricing=new_pricing,
        )

    return errors


# Internals


@dataclasses.dataclass(frozen=True, slots=True)
class _RoundPricing:
    reservation_unit_pks: list[int]
    period_begin: datetime.date
    period_end: datetime.date  # Inclusive
    rows: list[ReservationUnitPricingGroup]
    components: list[PriceComponent]  # Base components
    implicit_options: dict[int, list[PriceOption]]  # Active options by unit group, for components without an option


def _load_round_pricing(
    *,
    reservation_unit_pks: Collection[int],
    period_begin: datetime.date,
    period_end: datetime.date,
) -> _RoundPricing:
    rows = list(ReservationUnitPricingGroup.objects.filter(reservation_unit__in=reservation_unit_pks))
    pricing_group_pks = {row.pricing_group_id for row in rows}

    components = list(
        PriceComponent.objects
        .filter(models.Q(valid_until__isnull=True) | models.Q(valid_until__gt=period_begin))
        .filter(
            pricing_group__in=pricing_group_pks,
            kind=PriceComponentKind.BASE,
            valid_from__lte=period_end,
        )
        .select_related("price_option", "pricing_group")
    )

    return _RoundPricing(
        reservation_unit_pks=sorted(reservation_unit_pks),
        period_begin=period_begin,
        period_end=period_end,
        rows=rows,
        components=components,
        implicit_options=_load_implicit_options(components),
    )


def _load_implicit_options(components: Iterable[PriceComponent]) -> dict[int, list[PriceOption]]:
    unit_group_pks = {
        component.pricing_group.unit_group_id
        for component in components
        if component.price_option_id is None and component.pricing_group.unit_group_id is not None
    }

    implicit_options: dict[int, list[PriceOption]] = {}
    for option in PriceOption.objects.filter(unit_group__in=unit_group_pks, is_active=True):
        implicit_options.setdefault(option.unit_group_id, []).append(option)
    return implicit_options


def _reservations_are_pending(application_round: ApplicationRound) -> bool:
    status = application_round.reservation_creation_status
    return status != ApplicationRoundReservationCreationStatusChoice.COMPLETED


def _check_round_change(
    *,
    round_name: str,
    saved_pricing: _RoundPricing,
    new_pricing: _RoundPricing,
) -> list[RoundOptionError]:
    round_errors = [
        *_check_consistency(new_pricing),
        *_check_no_lost_options(saved_pricing=saved_pricing, new_pricing=new_pricing),
    ]
    return [
        RoundOptionError(code=error.code, message=f"Application round '{round_name}': {error.message}")
        for error in round_errors
    ]


def _check_consistency(round_pricing: _RoundPricing) -> list[RoundOptionError]:
    option_sets = _option_sets_by_reservation_unit(round_pricing)
    days = _days(round_pricing)
    if not option_sets or not days:
        return []

    option_names = _option_names(round_pricing)
    first_reservation_unit_pk = round_pricing.reservation_unit_pks[0]
    expected_options = option_sets[first_reservation_unit_pk][0]

    errors: list[RoundOptionError] = []
    for reservation_unit_pk, daily_options in option_sets.items():
        for day, options in zip(days, daily_options, strict=True):
            if options == expected_options:
                continue

            message = (
                f"Reservation unit {reservation_unit_pk} has price options "
                f"{_describe(options, option_names)} on {day.isoformat()}, but reservation unit "
                f"{first_reservation_unit_pk} has {_describe(expected_options, option_names)} "
                f"on {round_pricing.period_begin.isoformat()}. "
                f"All reservation units must have the same price options for the whole reservation period."
            )
            error = RoundOptionError(code=error_codes.APPLICATION_ROUND_PRICE_OPTIONS_INCONSISTENT, message=message)
            errors.append(error)
            break

    return errors


def _check_no_lost_options(
    *,
    saved_pricing: _RoundPricing,
    new_pricing: _RoundPricing,
) -> list[RoundOptionError]:
    lost_options = _offered_option_pks(saved_pricing) - _offered_option_pks(new_pricing)
    if not lost_options:
        return []

    option_names = _option_names(saved_pricing)
    message = (
        f"The change removes price options {_describe(lost_options, option_names)} from the application round. "
        f"Applicants can select them until the reservations of the round are made."
    )
    error = RoundOptionError(code=error_codes.APPLICATION_ROUND_PRICE_OPTIONS_REMOVED, message=message)
    return [error]


def _offered_option_pks(round_pricing: _RoundPricing) -> set[int]:
    option_sets = _option_sets_by_reservation_unit(round_pricing)
    all_sets = [options for daily_options in option_sets.values() for options in daily_options]
    if not all_sets:
        return set()

    return set.intersection(*(set(options) for options in all_sets))


def _option_sets_by_reservation_unit(round_pricing: _RoundPricing) -> dict[int, list[frozenset[int]]]:
    """For each reservation unit, the price options it has on each day of the reservation period."""
    rows_by_reservation_unit: dict[int, list[ReservationUnitPricingGroup]] = {}
    for row in sorted(round_pricing.rows, key=lambda row: row.begins):
        rows_by_reservation_unit.setdefault(row.reservation_unit_id, []).append(row)

    # A new pricing group in the admin has no pk yet, so its rows and components are under None.
    components_by_pricing_group: dict[int | None, list[PriceComponent]] = {}
    for component in round_pricing.components:
        components_by_pricing_group.setdefault(component.pricing_group_id, []).append(component)

    days = _days(round_pricing)

    option_sets: dict[int, list[frozenset[int]]] = {}
    for reservation_unit_pk in round_pricing.reservation_unit_pks:
        rows = rows_by_reservation_unit.get(reservation_unit_pk, [])
        daily_options: list[frozenset[int]] = []

        for day in days:
            row = _row_on_day(rows=rows, day=day)
            components = [] if row is None else components_by_pricing_group.get(row.pricing_group_id, [])
            active_components = [
                component
                for component in components
                if component.valid_from <= day and (component.valid_until is None or component.valid_until > day)
            ]
            options: set[int] = set()
            for component in active_components:
                if component.price_option_id is not None:
                    options.add(component.price_option_id)
                    continue

                unit_group_options = round_pricing.implicit_options.get(component.pricing_group.unit_group_id, [])
                options.update(option.pk for option in unit_group_options)

            daily_options.append(frozenset(options))

        option_sets[reservation_unit_pk] = daily_options

    return option_sets


def _row_on_day(*, rows: list[ReservationUnitPricingGroup], day: datetime.date) -> ReservationUnitPricingGroup | None:
    """The rows are sorted by their begin date."""
    row_on_day: ReservationUnitPricingGroup | None = None
    for row in rows:
        if row.begins > day:
            break
        row_on_day = row
    return row_on_day


def _days(round_pricing: _RoundPricing) -> list[datetime.date]:
    day_count = (round_pricing.period_end - round_pricing.period_begin).days + 1
    return [round_pricing.period_begin + datetime.timedelta(days=offset) for offset in range(day_count)]


def _option_names(round_pricing: _RoundPricing) -> dict[int, str]:
    option_names = {option.pk: option.name for options in round_pricing.implicit_options.values() for option in options}
    for component in round_pricing.components:
        if component.price_option is not None:
            option_names[component.price_option_id] = component.price_option.name
    return option_names


def _describe(option_pks: Collection[int], option_names: dict[int, str]) -> str:
    if not option_pks:
        return "(none)"

    names = sorted(option_names.get(pk, str(pk)) for pk in option_pks)
    return ", ".join(f"'{name}'" for name in names)
