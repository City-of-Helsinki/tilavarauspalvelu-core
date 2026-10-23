from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework.exceptions import ErrorDetail, ValidationError

from tilavarauspalvelu.models import PriceComponent, PricingGroup
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date
from utils.utils import to_drf_validation_error

from .coverage import check_pricing_group_coverage

if TYPE_CHECKING:
    from collections.abc import Collection

__all__ = [
    "save_price_component_changes",
]


def save_price_component_changes(
    *,
    pricing_group: PricingGroup,
    components: Collection[PriceComponent],
    deleted_component_pks: Collection[int],
) -> None:
    """
    Save a batch of changes to the components of a pricing group.

    The batch is merged with the saved components of the group, and the result must have full coverage.
    Past components cannot change. Active components can only get a new `valid_until` in the future.
    Future components can change freely. New components must begin in the future,
    unless the group has no saved components yet.

    :param pricing_group: The pricing group to change.
    :param components: Changed components (with a pk) and new components (without a pk). Not saved yet.
    :param deleted_component_pks: Primary keys of the components to delete.
    :raises ValidationError: If an edit rule, a constraint or the coverage check fails. Nothing is saved then.
    """
    with transaction.atomic():
        # Lock the group, so that two batches for the same group cannot both pass the coverage check.
        PricingGroup.objects.select_for_update().get(pk=pricing_group.pk)

        today = local_date()

        saved_component_queryset = PriceComponent.objects.filter(pricing_group=pricing_group).select_related(
            "price_option"
        )
        saved_components = {component.pk: component for component in saved_component_queryset}

        changed_components = [component for component in components if component.pk is not None]
        new_components = [component for component in components if component.pk is None]

        for component in changed_components:
            saved_component = saved_components.get(component.pk)
            if saved_component is None:
                msg = f"Price component {component.pk} does not belong to this pricing group."
                raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_NOT_IN_PRICING_GROUP)

            saved_component.validators.validate_change(component)

            component.pricing_group = pricing_group
            try:
                component.validate_constraints()
            except DjangoValidationError as error:
                raise to_drf_validation_error(error) from error

            component.validators.validate_option_belongs_to_pricing_group_unit_group()
            if component.price_option_id != saved_component.price_option_id:
                component.validators.validate_option_is_active()

        for component in new_components:
            if saved_components and component.valid_from <= today:
                msg = f"New price component must begin after today, not on {component.valid_from.isoformat()}."
                raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_VALID_FROM_NOT_IN_FUTURE)

            component.pricing_group = pricing_group
            try:
                component.validate_constraints()
            except DjangoValidationError as error:
                raise to_drf_validation_error(error) from error

            component.validators.validate_option_belongs_to_pricing_group_unit_group()
            component.validators.validate_option_is_active()

        for pk in deleted_component_pks:
            saved_component = saved_components.get(pk)
            if saved_component is None:
                msg = f"Price component {pk} does not belong to this pricing group."
                raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_NOT_IN_PRICING_GROUP)

            saved_component.validators.validate_can_delete()

        deleted_pks = set(deleted_component_pks)
        merged_components = {pk: component for pk, component in saved_components.items() if pk not in deleted_pks}
        for component in changed_components:
            merged_components[component.pk] = component

        reservation_unit_begin_dates = list(pricing_group.reservation_units.values_list("begins", flat=True))
        all_components = [*merged_components.values(), *new_components]
        coverage_errors = check_pricing_group_coverage(
            components=all_components,
            reservation_unit_begin_dates=reservation_unit_begin_dates,
        )
        if coverage_errors:
            details = [ErrorDetail(error.message, code=error.code) for error in coverage_errors]
            raise ValidationError(details)

        PriceComponent.objects.filter(pk__in=deleted_component_pks).delete()
        for component in changed_components:
            component.save()
        PriceComponent.objects.bulk_create(new_components)
