import operator

from graphql.pyutils import Path
from undine.exceptions import GraphQLErrorGroup, GraphQLValidationError

from tilavarauspalvelu.models import ApplicationRound, ApplicationSection, ReservationUnitOption
from tilavarauspalvelu.typing import (
    ApplicationSectionRelatedCreateData,
    ApplicationSectionRelatedUpdateData,
    ErrorList,
    ReservationUnitOptionRelatedCreateData,
    ReservationUnitOptionRelatedUpdateData,
)
from utils.utils import comma_sep_str

__all__ = [
    "validate_reservation_period",
    "validate_reservation_unit_options",
]


def validate_reservation_period(
    application_round: ApplicationRound,
    section_data: ApplicationSectionRelatedCreateData | ApplicationSectionRelatedUpdateData,
    *,
    path: Path,
) -> None:
    pk = section_data.get("pk")

    reservation_period_begin_date = application_round.reservation_period_begin_date
    reservation_period_end_date = application_round.reservation_period_end_date

    if pk is not None:
        section = ApplicationSection.objects.get(pk=pk)
        section_period_begin_date = section_data.get("reservations_begin_date", section.reservations_begin_date)
        section_period_end_date = section_data.get("reservations_end_date", section.reservations_end_date)
    else:
        section_period_begin_date = section_data.get("reservations_begin_date", reservation_period_begin_date)
        section_period_end_date = section_data.get("reservations_end_date", reservation_period_begin_date)

    errors: ErrorList = []

    if section_period_begin_date < reservation_period_begin_date:
        msg = (
            "Application section reservations begin date cannot be before "
            "the application round's reservation period begin date."
        )
        error = GraphQLValidationError(msg, path=path.as_list())
        errors.append(error)

    if reservation_period_end_date < section_period_end_date:
        msg = (
            "Application section reservations end date cannot be after "
            "the application round's reservation period end date."
        )
        error = GraphQLValidationError(msg, path=path.as_list())
        errors.append(error)

    if errors:
        raise GraphQLErrorGroup(errors)


def validate_reservation_unit_options(
    option_data: list[ReservationUnitOptionRelatedCreateData | ReservationUnitOptionRelatedUpdateData],
    *,
    path: Path,
    instance: ApplicationSection | None = None,
) -> None:
    # Fetch current ordering for existing event reservation units
    current_ordering: dict[str, int] = {}
    if instance is not None:
        qs = ReservationUnitOption.objects.filter(application_section=instance).values("pk", "preferred_order")
        current_ordering = {option["pk"]: option["preferred_order"] for option in qs}

    errors: ErrorList = []

    # Check if there are duplicates in the new ordering.
    tracked_ordering: dict[int, list[str]] = {}
    for i, item in enumerate(option_data):
        sub_path = path.add_key(i)

        # Use #1, #2, ... in error messages for new reservation units
        pk_or_order = item.get("pk", f"#{i + 1}")

        order: int | None = item.get("preferred_order", current_ordering.get(pk_or_order))
        if order is None:
            msg = "Field 'preferred_order' is required"
            error = GraphQLValidationError(msg, path=sub_path.as_list())
            errors.append(error)
            continue

        if order in tracked_ordering:
            orders = comma_sep_str(tracked_ordering[order])
            msg = f"Duplicate 'preferred_order' {order} with: {orders}"
            error = GraphQLValidationError(msg, path=sub_path.as_list())
            errors.append(error)

        tracked_ordering.setdefault(order, [])
        tracked_ordering[order].append(pk_or_order)

    # Return early since the sequential check would always fail if there are duplicates
    if errors:
        raise GraphQLErrorGroup(errors)

    # Check preferred_order is sequential, starting from zero
    for index, (tracked, pks) in enumerate(sorted(tracked_ordering.items(), key=operator.itemgetter(0))):
        if index != tracked:
            # There should be only one pk in the list, since we raised errors early
            msg = f"Option {pks[0]} has 'preferred_order' {tracked} but should be {index}"
            error = GraphQLValidationError(msg, path=path.as_list())
            errors.append(error)

    if errors:
        raise GraphQLErrorGroup(errors)
