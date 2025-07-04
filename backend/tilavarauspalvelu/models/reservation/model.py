from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.db.models.functions import Concat, Trim
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import (
    AccessType,
    MunicipalityChoice,
    ReservationCancelReasonChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReserveeType,
)
from utils.auditlog_util import AuditLogger
from utils.date_utils import datetime_range_as_string
from utils.decimal_utils import round_decimal
from utils.fields.model import StrChoiceField
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import (
        AgeGroup,
        ReservationDenyReason,
        ReservationPurpose,
        ReservationSeries,
        ReservationUnit,
        Unit,
        User,
    )

    from .actions import ReservationActions
    from .queryset import ReservationManager
    from .validators import ReservationValidator


__all__ = [
    "Reservation",
]


class Reservation(SerializableMixin, models.Model):
    # Basic information
    ext_uuid: uuid.UUID = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # ID for external systems
    name: str = models.CharField(max_length=255, blank=True, default="")
    description: str = models.CharField(max_length=255, blank=True, default="")
    num_persons: int | None = models.PositiveIntegerField(null=True, blank=True)
    state: str = models.CharField(
        max_length=32,
        choices=ReservationStateChoice.choices,
        default=ReservationStateChoice.CREATED,
        db_index=True,
    )
    type: str | None = models.CharField(
        max_length=50,
        null=True,
        blank=False,
        choices=ReservationTypeChoice.choices,
        default=ReservationTypeChoice.NORMAL,
    )
    municipality: str | None = StrChoiceField(enum=MunicipalityChoice, null=True, blank=True)
    handling_details: str = models.TextField(blank=True, default="")
    working_memo: str = models.TextField(blank=True, default="")

    # Cancellation information
    cancel_details: str = models.TextField(blank=True, default="")
    cancel_reason: ReservationCancelReasonChoice | None = models.CharField(
        choices=ReservationCancelReasonChoice.choices,
        max_length=255,
        null=True,
        blank=True,
    )

    # Time information
    begins_at: datetime.datetime = models.DateTimeField(db_index=True)
    ends_at: datetime.datetime = models.DateTimeField(db_index=True)
    buffer_time_before: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    buffer_time_after: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    handled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    confirmed_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    created_at: datetime.datetime | None = models.DateTimeField(null=True, default=timezone.now)  # noqa: TID251

    # Access information
    access_type: str = models.CharField(
        max_length=20,
        choices=AccessType.choices,
        default=AccessType.UNRESTRICTED.value,
    )
    access_code_generated_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    access_code_is_active: bool = models.BooleanField(default=False)

    # Pricing details
    price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    non_subsidised_price: Decimal = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    unit_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_percentage_value: Decimal = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Free of charge information
    applying_for_free_of_charge: bool = models.BooleanField(default=False, blank=True)
    free_of_charge_reason: str | None = models.TextField(null=True, blank=True)

    # Reservee information
    reservee_identifier: str = models.CharField(max_length=255, blank=True, default="")
    reservee_first_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_last_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_email: str | None = models.EmailField(null=True, blank=True)
    reservee_phone: str = models.CharField(max_length=255, blank=True, default="")
    reservee_organisation_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_street: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_city: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_zip: str = models.CharField(max_length=255, blank=True, default="")
    reservee_used_ad_login: bool = models.BooleanField(default=False, blank=True)
    reservee_type: str | None = StrChoiceField(enum=ReserveeType, null=True, blank=True)

    # Relations
    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="reservations",
        on_delete=models.PROTECT,
    )
    user: User = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="reservations",
        on_delete=models.PROTECT,
    )

    reservation_series: ReservationSeries | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationSeries",
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    deny_reason: ReservationDenyReason | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationDenyReason",
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    purpose: ReservationPurpose | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationPurpose",
        related_name="reservations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    age_group: AgeGroup | None = models.ForeignKey(
        "tilavarauspalvelu.AgeGroup",
        related_name="reservations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    objects: ClassVar[ReservationManager] = LazyModelManager.new()
    actions: ReservationActions = LazyModelAttribute.new()
    validators: ReservationValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation"
        base_manager_name = "objects"
        verbose_name = _("reservation")
        verbose_name_plural = _("reservations")
        ordering = ["begins_at"]
        constraints = [
            models.CheckConstraint(
                check=~models.Q(access_code_generated_at=None, access_code_is_active=True),
                name="no_access_code_but_active",
                violation_error_message=_("Reservation cannot have active access code if one is not generated"),
            ),
        ]

    # For GDPR API
    serialize_fields = (
        {"name": "name"},
        {"name": "description"},
        {"name": "begins_at"},
        {"name": "ends_at"},
        {"name": "reservee_first_name"},
        {"name": "reservee_last_name"},
        {"name": "reservee_email"},
        {"name": "reservee_phone"},
        {"name": "reservee_address_zip"},
        {"name": "reservee_address_city"},
        {"name": "reservee_address_street"},
        {"name": "reservee_identifier"},
        {"name": "reservee_organisation_name"},
        {"name": "free_of_charge_reason"},
        {"name": "cancel_details"},
    )

    def __str__(self) -> str:
        return _("reservation") + f" {self.name} ({self.type})"

    def __repr__(self) -> str:
        dt_range = datetime_range_as_string(start_datetime=self.begins_at, end_datetime=self.ends_at)
        return f"<Reservation {self.name} ({dt_range})>"

    @property
    def price_net(self) -> Decimal:
        """Return the net price of the reservation. (Price without VAT)"""
        return round_decimal(self.price / (1 + self.tax_percentage_value / Decimal(100)), 2)

    @property
    def price_vat_amount(self) -> Decimal:
        """Return the VAT amount of the reservation."""
        return round_decimal(self.price - self.price_net, 2)

    @property
    def non_subsidised_price_net(self) -> Decimal:
        return round_decimal(self.non_subsidised_price / (1 + self.tax_percentage_value / Decimal(100)), 2)

    @lookup_property(joins=["reservation_series", "user"])
    def reservee_name() -> str:
        return models.Case(  # type: ignore[return-value]
            # Blocking reservation
            models.When(
                condition=(
                    models.Q(type=ReservationTypeChoice.BLOCKED.value)  #
                ),
                then=models.Value(str(_("Closed"))),
            ),
            # Internal reservations created by STAFF
            models.When(
                condition=(
                    models.Q(type=ReservationTypeChoice.STAFF.value)  #
                    & models.Q(reservation_series__isnull=False)
                    & ~models.Q(reservation_series__name="")
                ),
                then=models.F("reservation_series__name"),
            ),
            models.When(
                condition=(
                    models.Q(type=ReservationTypeChoice.STAFF.value)  #
                    & (models.Q(reservation_series__isnull=True) | models.Q(reservation_series__name=""))
                    & ~models.Q(name="")
                ),
                then=models.F("name"),
            ),
            # Organisation reservee
            models.When(
                condition=(
                    models.Q(reservee_type__in=ReserveeType.organisation_types)  #
                    & ~models.Q(reservee_organisation_name="")
                ),
                then=models.F("reservee_organisation_name"),
            ),
            # Individual reservee
            models.When(
                condition=(
                    ~models.Q(reservee_type__in=ReserveeType.organisation_types)  #
                    & (~models.Q(reservee_first_name="") | ~models.Q(reservee_last_name=""))
                ),
                then=Trim(Concat("reservee_first_name", models.Value(" "), "reservee_last_name")),
            ),
            # Use reservation name when reservee name as first fallback
            models.When(
                condition=~models.Q(name=""),
                then=models.F("name"),
            ),
            # Use the name of the User who made the reservation as the last fallback
            models.When(
                condition=(
                    models.Q(user__isnull=False)  #
                    & (
                        ~models.Q(user__first_name="")  #
                        | ~models.Q(user__last_name="")
                    )
                ),
                then=Trim(Concat("user__first_name", models.Value(" "), "user__last_name")),
            ),
            default=models.Value(""),
            output_field=models.CharField(),
        )

    @property
    def requires_handling(self) -> bool:
        return self.reservation_unit.require_reservation_handling or self.applying_for_free_of_charge

    @property
    def is_handled_paid(self) -> bool:
        return (
            self.price > 0
            and self.handled_at is not None
            and hasattr(self, "payment_order")
            and self.payment_order.is_handled_payment
        )

    @property
    def units_for_permissions(self) -> list[Unit]:
        from tilavarauspalvelu.models import Unit

        if hasattr(self, "_units_for_permissions"):
            return self._units_for_permissions

        self._units_for_permissions = list(
            Unit.objects.filter(reservation_units__reservations=self).prefetch_related("unit_groups").distinct()
        )
        return self._units_for_permissions

    @units_for_permissions.setter
    def units_for_permissions(self, value: list[Unit]) -> None:
        # The setter is used by ReservationQuerySet to pre-evaluate units for multiple Reservations.
        # Should not be used by anything else!
        self._units_for_permissions = value

    @lookup_property
    def access_code_should_be_active() -> bool:
        """
        Whether the reservation's access code _should_ be active or not. This is used by background tasks
        to update access code state in Pindora in case an API call to Pindora fails in the endpoint.
        """
        case = models.Case(
            models.When(
                (
                    models.Q(access_type=AccessType.ACCESS_CODE.value)
                    & models.Q(state=ReservationStateChoice.CONFIRMED.value)
                    & ~models.Q(type=ReservationTypeChoice.BLOCKED.value)
                ),
                then=models.Value(True),  # noqa: FBT003
            ),
            default=models.Value(False),  # noqa: FBT003
            output_field=models.BooleanField(),
        )
        return case  # noqa: RET504 type: ignore[return-value]

    @lookup_property
    def is_access_code_is_active_correct() -> bool:
        """Does the reservation's access code's "is_active" state match what is expected for the reservation?"""
        # We don't care about whether the access code is generated or not:
        # 1. Not generated AND active -> Not possible
        # 2. Not generated AND not active -> Reservation doesn't use an access code
        # Otherwise, we should generate the access code if its are somehow missing.
        case = models.Case(
            models.When(
                L(access_code_should_be_active=True),
                then=models.Q(access_code_is_active=True),
            ),
            default=models.Q(access_code_is_active=False),
        )
        return case  # noqa: RET504 type: ignore[return-value]


AuditLogger.register(
    Reservation,
    # Exclude lookup properties, since they are calculated values.
    exclude_fields=[
        "_reservee_name",
        "_access_code_should_be_active",
        "_is_access_code_is_active_correct",
    ],
)
