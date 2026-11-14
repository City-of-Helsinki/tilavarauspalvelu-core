from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.core.exceptions import FieldDoesNotExist
from django.db import models, router, transaction
from django.db.models.signals import post_save, pre_save

if TYPE_CHECKING:
    from collections.abc import Sequence


__all__ = [
    "UpdateWithSignalsFieldError",
    "bulk_create_with_signals",
    "bulk_update_with_signals",
    "update_with_signals",
]


class UpdateWithSignalsFieldError(Exception):
    def __init__(self, *, model: type[models.Model], field_name: str) -> None:
        msg = f"'{field_name}' is not a concrete field of '{model.__name__}'."
        super().__init__(msg)


def bulk_create_with_signals[TModel: models.Model](instances: Sequence[TModel]) -> list[TModel]:
    """
    Create the instances like 'QuerySet.bulk_create()', but send 'pre_save' and 'post_save' for each instance.
    The audit log and the receivers in 'tilavarauspalvelu/signals.py' work through these signals.
    """
    if not instances:
        return []

    model = type(instances[0])

    # Receivers can start work on commit. Without a transaction, each instance would start its own work at once.
    with transaction.atomic():
        if pre_save.has_listeners(model):
            for instance in instances:
                pre_save.send(
                    sender=model,
                    instance=instance,
                    raw=False,
                    using=router.db_for_write(model, instance=instance),
                    update_fields=None,
                )

        created_instances = model._default_manager.bulk_create(instances)  # noqa: SLF001

        if post_save.has_listeners(model):
            for instance in created_instances:
                post_save.send(
                    sender=model,
                    instance=instance,
                    created=True,
                    update_fields=None,
                    raw=False,
                    using=router.db_for_write(model, instance=instance),
                )

    return created_instances


def bulk_update_with_signals(instances: Sequence[models.Model], *, fields: Sequence[str]) -> None:
    """
    Update the fields of the instances like 'QuerySet.bulk_update()',
    but send 'pre_save' and 'post_save' for each instance.
    The audit log and the receivers in 'tilavarauspalvelu/signals.py' work through these signals.
    """
    if not instances:
        return

    model = type(instances[0])

    # 'bulk_update()' does not set 'auto_now' fields, so set them like a full 'Model.save()' does.
    auto_now_fields = [
        field
        for field in model._meta.concrete_fields
        if isinstance(field, models.DateField) and field.auto_now and field.name not in fields
    ]
    for instance in instances:
        for field in auto_now_fields:
            field.pre_save(instance, add=False)

    update_field_names = [*fields, *(field.name for field in auto_now_fields)]
    update_fields = frozenset(update_field_names)

    # Receivers can start work on commit. Without a transaction, each instance would start its own work at once.
    with transaction.atomic():
        if pre_save.has_listeners(model):
            for instance in instances:
                pre_save.send(
                    sender=model,
                    instance=instance,
                    raw=False,
                    using=router.db_for_write(model, instance=instance),
                    update_fields=update_fields,
                )

        model._default_manager.bulk_update(instances, fields=update_field_names)  # noqa: SLF001

        if post_save.has_listeners(model):
            for instance in instances:
                post_save.send(
                    sender=model,
                    instance=instance,
                    created=False,
                    update_fields=update_fields,
                    raw=False,
                    using=router.db_for_write(model, instance=instance),
                )


def update_with_signals(queryset: models.QuerySet, /, **values: Any) -> int:
    """
    Update the rows in the queryset like 'QuerySet.update()', but send 'pre_save' and 'post_save' for each row.
    Values can be plain values, model instances or expressions.
    Expressions cannot refer to annotations of the queryset, since the rows are read with a new queryset.
    """
    # Same as 'QuerySet.update()', which writes nothing when no values are given.
    if not values:
        return 0

    model: type[models.Model] = queryset.model
    fields = [_get_concrete_field(model=model, field_name=field_name) for field_name in values]

    # Annotate only the expressions. Plain values are set on the instances directly.
    expressions = {
        _annotation_name(field): value
        for field, value in zip(fields, values.values(), strict=True)
        if hasattr(value, "resolve_expression")
    }

    with transaction.atomic():
        # Use a new queryset and lock only this table, since 'select_for_update' fails with 'distinct' and outer joins.
        locked_queryset = (
            model._default_manager  # noqa: SLF001
            .filter(pk__in=queryset.values("pk"))
            .order_by("pk")
            .select_for_update(of=("self",))
        )
        locked_pks = list(locked_queryset.values_list("pk", flat=True))

        # A parallel write can change a row while this waits for the lock. Check the filter again after the lock.
        matching_pks = queryset.filter(pk__in=locked_pks).values("pk")
        matching_queryset = model._default_manager.filter(pk__in=matching_pks).order_by("pk")  # noqa: SLF001
        instances = list(matching_queryset.annotate(**expressions))

        for instance in instances:
            for field, value in zip(fields, values.values(), strict=True):
                annotation_name = _annotation_name(field)
                if annotation_name in expressions:
                    # Expressions give the raw column value, e.g. the primary key of a foreign key.
                    setattr(instance, field.attname, getattr(instance, annotation_name))
                elif isinstance(value, models.Model):
                    setattr(instance, field.name, value)
                else:
                    # 'QuerySet.update()' also accepts the primary key for a foreign key.
                    setattr(instance, field.attname, value)

        update_fields = [field.name for field in fields]

        bulk_update_with_signals(instances, fields=update_fields)

    return len(instances)


# Internals


def _get_concrete_field(*, model: type[models.Model], field_name: str) -> models.Field:
    try:
        field = model._meta.get_field(field_name)
    except FieldDoesNotExist as error:
        raise UpdateWithSignalsFieldError(model=model, field_name=field_name) from error

    if not getattr(field, "concrete", False) or field.many_to_many:
        raise UpdateWithSignalsFieldError(model=model, field_name=field_name)

    return field


def _annotation_name(field: models.Field) -> str:
    return f"_update_with_signals_{field.name}"
