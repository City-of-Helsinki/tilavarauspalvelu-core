from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.db.models.functions import Coalesce
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager
from lookup_property import lookup_property
from undine.utils.model_fields import TextChoicesField

from tilavarauspalvelu.enums import AccessType

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

    from .actions import ReservationUnitAccessTypeActions
    from .queryset import ReservationUnitAccessTypeManager
    from .validators import ReservationUnitAccessTypeValidator


__all__ = [
    "ReservationUnitAccessType",
]


class ReservationUnitAccessType(models.Model):
    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="access_types",
        on_delete=models.CASCADE,
    )
    access_type: AccessType = TextChoicesField(choices_enum=AccessType, default=AccessType.UNRESTRICTED)
    begin_date: datetime.date = models.DateField()

    objects: ClassVar[ReservationUnitAccessTypeManager] = LazyModelManager.new()
    actions: ReservationUnitAccessTypeActions = LazyModelAttribute.new()
    validators: ReservationUnitAccessTypeValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_unit_access_type"
        base_manager_name = "objects"
        verbose_name = _("reservation unit access type")
        verbose_name_plural = _("reservation unit access types")
        ordering = ["reservation_unit", "begin_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["reservation_unit", "begin_date"],
                name="single_access_type_per_day_per_reservation_unit",
                violation_error_message=_("Access type already exists for this reservation unit and date"),
            )
        ]

    def __str__(self) -> str:
        return f"{AccessType(self.access_type).label} for {self.reservation_unit} from {self.begin_date.isoformat()}"

    @lookup_property(skip_codegen=True)
    def end_date() -> datetime.date:
        """End date of the access type (exclusive)."""
        sq = Coalesce(
            models.Subquery(
                queryset=(
                    ReservationUnitAccessType.objects.filter(
                        begin_date__gt=models.OuterRef("begin_date"),
                        reservation_unit=models.OuterRef("reservation_unit"),
                    )
                    .order_by("begin_date")
                    .values("begin_date")[:1]
                ),
                output_field=models.DateField(),
            ),
            models.Value(datetime.date.max),
        )
        return sq  # type: ignore[return-value]  # noqa: RET504

    @end_date.override
    def _(self) -> datetime.date:
        access_type = (
            ReservationUnitAccessType.objects.filter(begin_date__gt=self.begin_date).order_by("begin_date").first()
        )
        if access_type is None:
            return datetime.date.max
        return access_type.begin_date
