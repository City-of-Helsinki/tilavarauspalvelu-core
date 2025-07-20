from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, ClassVar

from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields.array import ArrayField, IndexTransform
from django.db import models
from django.db.models import Exists
from django.db.models.functions import Coalesce
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import AccessType, AccessTypeWithMultivalued, Weekday
from utils.db import SubqueryArray
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import (
        AgeGroup,
        AllocatedTimeSlot,
        RejectedOccurrence,
        Reservation,
        ReservationUnit,
        User,
    )
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.rejected_occurrence.queryset import RejectedOccurrenceQuerySet
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet

    from .actions import ReservationSeriesActions
    from .queryset import ReservationSeriesManager
    from .validators import ReservationSeriesValidator


__all__ = [
    "ReservationSeries",
]


class ReservationSeries(models.Model):
    """Defines a series of reservations that are created using given recurrence rules."""

    ext_uuid: uuid.UUID = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # ID for external systems
    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)

    name: str = models.CharField(max_length=255, blank=True, default="")
    description: str = models.CharField(max_length=500, blank=True, default="")

    begin_date: datetime.date = models.DateField()
    begin_time: datetime.time = models.TimeField()
    end_date: datetime.date = models.DateField()
    end_time: datetime.time = models.TimeField()

    recurrence_in_days: int | None = models.PositiveIntegerField(null=True, blank=True)  # TODO: Nullable?

    weekdays: list[Weekday] = ArrayField(TextChoicesField(choices_enum=Weekday), size=7, default=list)

    # Relations

    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="reservation_series",
        on_delete=models.PROTECT,
    )
    user: User = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="reservation_series",
        on_delete=models.PROTECT,
    )

    allocated_time_slot: AllocatedTimeSlot | None = models.OneToOneField(
        "tilavarauspalvelu.AllocatedTimeSlot",
        related_name="reservation_series",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    age_group: AgeGroup | None = models.ForeignKey(
        "tilavarauspalvelu.AgeGroup",
        related_name="reservation_series",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    objects: ClassVar[ReservationSeriesManager] = LazyModelManager.new()
    actions: ReservationSeriesActions = LazyModelAttribute.new()
    validators: ReservationSeriesValidator = LazyModelAttribute.new()

    rejected_occurrences: OneToManyRelatedManager[RejectedOccurrence, RejectedOccurrenceQuerySet]
    reservations: OneToManyRelatedManager[Reservation, ReservationQuerySet]

    class Meta:
        db_table = "reservation_series"
        base_manager_name = "objects"
        verbose_name = _("reservation series")
        verbose_name_plural = _("reservation series")
        ordering = [
            "begin_date",
            "begin_time",
            "reservation_unit",
        ]

    def __str__(self) -> str:
        return f"{self.name}"

    @lookup_property(skip_codegen=True)
    def should_have_active_access_code() -> bool:
        """Should at least one reservation in this series contain an active access code?"""
        from tilavarauspalvelu.models import Reservation

        exists = Exists(
            queryset=Reservation.objects.filter(
                L(access_code_should_be_active=True),
                reservation_series=models.OuterRef("pk"),
            ),
        )
        return exists  # type: ignore[return-value]  # noqa: RET504

    @should_have_active_access_code.override
    def _(self) -> bool:
        return self.reservations.filter(L(access_code_should_be_active=True)).exists()

    @lookup_property(skip_codegen=True)
    def is_access_code_is_active_correct() -> bool:
        """Check if all reservations in the series have their access code's "is_active" state correctly set."""
        from tilavarauspalvelu.models import Reservation

        exists = ~Exists(
            queryset=Reservation.objects.filter(
                L(is_access_code_is_active_correct=False),
                reservation_series=models.OuterRef("pk"),
            )
        )
        return exists  # type: ignore[return-value]  # noqa: RET504

    @is_access_code_is_active_correct.override
    def _(self) -> bool:
        return not self.reservations.filter(L(is_access_code_is_active_correct=False)).exists()

    @lookup_property(skip_codegen=True)
    def used_access_types() -> list[AccessType]:
        """List of all unique access types used in the reservations of this reservation series."""
        from tilavarauspalvelu.models import Reservation

        sq = SubqueryArray(
            (
                Reservation.objects.going_to_occur()
                .filter(reservation_series=models.OuterRef("pk"))
                .values("access_type")
            ),
            agg_field="access_type",
            distinct=True,
            coalesce_output_type="varchar",
            output_field=TextChoicesField(choices_enum=AccessType),
        )
        return sq  # type: ignore[return-value]  # noqa: RET504

    @used_access_types.override
    def _(self) -> list[AccessType]:
        qs = self.reservations.going_to_occur().aggregate(
            used_access_types=Coalesce(ArrayAgg("access_type", distinct=True), [])
        )
        return [AccessType(access_type) for access_type in qs["used_access_types"]]

    @lookup_property(joins=["reservations"], skip_codegen=True)
    def access_type() -> AccessTypeWithMultivalued:
        """
        If reservations in this reservation series have different access types,
        return the 'MULTIVALUED' access type, otherwise return the common access type.
        """
        case = models.Case(
            models.When(
                L(used_access_types__len__gt=1),
                then=models.Value(AccessTypeWithMultivalued.MULTIVALUED.value),
            ),
            default=Coalesce(
                # "used_access_types__1" doesn't work with lookup properties.
                # Note: Postgres arrays are 1-indexed by default.
                IndexTransform(1, models.CharField(), L("used_access_types")),
                models.Value(AccessTypeWithMultivalued.UNRESTRICTED.value),  # If no reservations in series
            ),
            output_field=TextChoicesField(choices_enum=AccessTypeWithMultivalued),
        )
        return case  # type: ignore[return-value]  # noqa: RET504

    @access_type.override
    def _(self) -> AccessTypeWithMultivalued:
        access_types: list[str] = self.used_access_types  # type: ignore[attr-defined]
        if len(access_types) == 0:
            return AccessTypeWithMultivalued.UNRESTRICTED
        if len(access_types) == 1:
            return AccessTypeWithMultivalued(access_types[0])
        return AccessTypeWithMultivalued.MULTIVALUED
