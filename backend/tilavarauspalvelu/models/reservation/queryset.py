from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Self

from django.conf import settings
from django.contrib.postgres.aggregates import ArrayAgg
from django.db import IntegrityError, models, transaction
from django.db.models.functions import Coalesce
from helsinki_gdpr.models import SerializableMixin
from lookup_property import L

from tilavarauspalvelu.enums import (
    AccessType,
    OrderStatus,
    ReservationCancelReasonChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.models import ReservationStatistic, ReservationUnit, Unit
from tilavarauspalvelu.tasks import delete_pindora_reservation_task
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound, ApplicationSection, Reservation
    from tilavarauspalvelu.typing import AnyUser


__all__ = [
    "ReservationManager",
    "ReservationQuerySet",
]


class ReservationQuerySet(models.QuerySet):
    def with_buffered_begin_and_end(self) -> Self:
        """Annotate the queryset with buffered begin and end times."""
        return self.annotate(
            buffered_begin=models.F("begin") - models.F("buffer_time_before"),
            buffered_end=models.F("end") + models.F("buffer_time_after"),
        )

    def filter_buffered_reservations_period(self, start_date: datetime.date, end_date: datetime.date) -> Self:
        """Filter reservations that are on the given period."""
        return (
            self.with_buffered_begin_and_end()
            .filter(
                buffered_begin__date__lte=end_date,
                buffered_end__date__gte=start_date,
            )
            .distinct()
            .order_by("buffered_begin")
        )

    def total_duration(self) -> datetime.timedelta:
        return (
            self.annotate(duration=models.F("end") - models.F("begin"))
            .aggregate(total_duration=models.Sum("duration"))
            .get("total_duration")
        ) or datetime.timedelta()

    def total_seconds(self) -> int:
        return int(self.total_duration().total_seconds())

    def within_application_round_period(self, app_round: ApplicationRound) -> Self:
        return self.within_period(
            app_round.reservation_period_begin_date,
            app_round.reservation_period_end_date,
        )

    def within_period(self, period_start: datetime.date, period_end: datetime.date) -> Self:
        """All reservation fully withing a period."""
        return self.filter(
            begin__date__gte=period_start,
            end__date__lte=period_end,
        )

    def overlapping_period(self, period_start: datetime.date, period_end: datetime.date) -> Self:
        """All reservations that overlap with a period, even partially."""
        return self.filter(
            begin__date__lte=period_end,
            end__date__gte=period_start,
        )

    def overlapping_reservations(
        self,
        reservation_unit: ReservationUnit,
        begin: datetime.datetime,
        end: datetime.datetime,
        *,
        buffer_time_before: datetime.timedelta | None = None,
        buffer_time_after: datetime.timedelta | None = None,
    ) -> Self:
        """
        All reservations that are going to occur in the given reservation unit
        that overlap with a period, even partially.
        """
        begin = begin.astimezone(datetime.UTC)
        end = end.astimezone(datetime.UTC)

        if buffer_time_before is None:
            buffer_time_before = reservation_unit.actions.get_actual_before_buffer(begin)
        if buffer_time_after is None:
            buffer_time_after = reservation_unit.actions.get_actual_after_buffer(end)

        qs = (
            self.with_buffered_begin_and_end()
            .going_to_occur()
            .filter(
                # In any reservation unit related through the reservation unit hierarchy
                models.Q(reservation_units__in=reservation_unit.actions.reservation_units_with_common_hierarchy),
            )
        )

        return qs.filter(
            models.Case(
                # Don't account for buffers on blocked reservations
                models.When(
                    type=ReservationTypeChoice.BLOCKED,
                    then=models.Q(end__gt=begin, begin__lt=end),
                ),
                default=(
                    # Existing reservations (with buffers) overlap the given period (without buffers)
                    (models.Q(buffered_end__gt=begin) & models.Q(buffered_begin__lt=end))
                    # The given period (with buffers) overlap the existing reservations (without buffers)
                    | (models.Q(end__gt=begin - buffer_time_before) & models.Q(begin__lt=end + buffer_time_after))
                ),
                output_field=models.BooleanField(),
            ),
        )

    def going_to_occur(self) -> Self:
        return self.filter(state__in=ReservationStateChoice.states_going_to_occur)

    def active(self) -> Self:
        """
        Filter reservations that have not ended yet.

        Note:
        - There might be older reservations with buffers that are still active,
          even if the reservation itself is not returned by this queryset.
        - Returned data may contain some 'Inactive' reservations, before they are deleted by a periodic task.
        """
        return self.going_to_occur().filter(end__gte=local_datetime())

    def future(self) -> Self:
        """Filter reservations have yet not begun."""
        return self.going_to_occur().filter(begin__gt=local_datetime())

    def unconfirmed(self) -> Self:
        return self.exclude(state=ReservationStateChoice.CONFIRMED)

    def affecting_reservations(self, units: list[int] = (), reservation_units: list[int] = ()) -> Self:
        """Filter reservations that affect other reservations in the given units and/or reservation units."""
        qs = ReservationUnit.objects.all()
        if units:
            qs = qs.filter(unit__in=units)
        if reservation_units:
            qs = qs.filter(pk__in=reservation_units)

        return self.filter(
            reservation_units__in=models.Subquery(qs.affected_reservation_unit_ids),
        ).exclude(
            # Cancelled or denied reservations never affect any reservations
            state__in=[
                ReservationStateChoice.CANCELLED,
                ReservationStateChoice.DENIED,
            ]
        )

    def _fetch_all(self) -> None:
        super()._fetch_all()
        if "FETCH_UNITS_FOR_PERMISSIONS_FLAG" in self._hints:
            self._hints.pop("FETCH_UNITS_FOR_PERMISSIONS_FLAG", None)
            self._add_units_for_permissions()

    def with_permissions(self) -> Self:
        """Indicates that we need to fetch units for permissions checks when the queryset is evaluated."""
        self._hints["FETCH_UNITS_FOR_PERMISSIONS_FLAG"] = True
        return self

    def _add_units_for_permissions(self) -> None:
        # This works sort of like a 'prefetch_related', since it makes another query
        # to fetch units and unit groups for the permission checks when the queryset is evaluated,
        # and 'joins' them to the correct model instances in python.

        items: list[Reservation] = list(self)
        if not items:
            return

        units = (
            Unit.objects.prefetch_related("unit_groups")
            .filter(reservation_units__reservations__in=items)
            .annotate(
                reservation_ids=Coalesce(
                    ArrayAgg(
                        "reservation_units__reservations",
                        distinct=True,
                        filter=(
                            models.Q(reservation_units__isnull=False)
                            & models.Q(reservation_units__reservations__isnull=False)
                        ),
                    ),
                    models.Value([]),
                )
            )
            .distinct()
        )

        for item in items:
            item.units_for_permissions = [unit for unit in units if item.pk in unit.reservation_ids]

    def filter_for_user_num_active_reservations(
        self,
        reservation_unit: ReservationUnit | models.OuterRef,
        user: AnyUser,
    ) -> Self:
        return self.active().filter(
            reservation_units=reservation_unit,
            user=user,
            type=ReservationTypeChoice.NORMAL.value,
        )

    def requires_active_access_code(self) -> Self:
        return self.filter(L(access_code_should_be_active=True))

    def dont_require_active_access_code(self) -> Self:
        return self.filter(~L(access_code_should_be_active=True))

    def update_access_code_info(
        self,
        *,
        access_code_generated_at: datetime.datetime | None,
        access_code_is_active: bool,
    ) -> None:
        """
        Sets access code info to reservations in the queryset so that reservation that should have
        active access codes get the given values, and the rest get empty values.
        """
        self.update(
            access_code_generated_at=models.Case(
                models.When(
                    L(access_code_should_be_active=True),
                    then=models.Value(access_code_generated_at),
                ),
                default=models.Value(None),
                output_field=models.DateTimeField(null=True),
            ),
            access_code_is_active=models.Case(
                models.When(
                    L(access_code_should_be_active=True),
                    then=models.Value(access_code_is_active),
                ),
                default=models.Value(False),  # noqa: FBT003
                output_field=models.BooleanField(),
            ),
        )

    def update_access_code_is_active(self) -> None:
        """
        Sets access code info to reservations in the queryset so that reservation that should have
        active access codes get the given values, and the rest get empty values.
        """
        self.update(
            access_code_is_active=models.Case(
                models.When(
                    L(access_code_should_be_active=True),
                    then=models.Value(True),  # noqa: FBT003
                ),
                default=models.Value(False),  # noqa: FBT003
                output_field=models.BooleanField(),
            ),
        )

    def upsert_statistics(self) -> None:
        reservations = self.select_related(
            "user",
            "reservation_series",
            "reservation_series__allocated_time_slot",
            "deny_reason",
            "purpose",
            "home_city",
            "age_group",
        ).prefetch_related(
            models.Prefetch(
                "reservation_units",
                queryset=ReservationUnit.objects.select_related("unit"),
            ),
        )

        new_statistics: list[ReservationStatistic] = [
            ReservationStatistic.for_reservation(reservation) for reservation in reservations
        ]

        fields_to_update: list[str] = [
            field.name
            for field in ReservationStatistic._meta.get_fields()
            # Update all fields that can be updated
            if field.concrete and not field.many_to_many and not field.primary_key
        ]

        try:
            with transaction.atomic():
                ReservationStatistic.objects.bulk_create(
                    new_statistics,
                    update_conflicts=True,
                    update_fields=fields_to_update,
                    unique_fields=["reservation"],
                )

        except IntegrityError as error:
            # Avoid logging errors in Sentry for situations where the reservation is deleted
            # between the moment a statistic is constructed to when it's created.
            # Background tasks will try to create the statistics again after a while.
            reservation_missing = 'is not present in table "reservation".'
            if reservation_missing not in str(error):
                raise

    def requiring_access_code(self) -> Self:
        """Return all reservations that should have an access code but don't."""
        return self.filter(
            state=ReservationStateChoice.CONFIRMED,
            access_type=AccessType.ACCESS_CODE,
            access_code_generated_at=None,
            end__gt=local_datetime(),
        )

    def has_incorrect_access_code_is_active(self) -> Self:
        """Return all reservations where the access code is active when it should be inactive, or vice versa."""
        return self.filter(
            (
                (models.Q(access_code_is_active=True) & L(access_code_should_be_active=False))
                | (models.Q(access_code_is_active=False) & L(access_code_should_be_active=True))
            ),
            access_code_generated_at__isnull=False,
            end__gt=local_datetime(),
        )

    def for_application_section(self, ref: ApplicationSection | models.OuterRef) -> Self:
        """Return all reservations for the given application section."""
        return self.filter(reservation_series__allocated_time_slot__reservation_unit_option__application_section=ref)

    def for_application_round(self, ref: ApplicationRound | models.OuterRef) -> Self:
        """Return all reservations for the given application round."""
        lookup = (
            "reservation_series"  #
            "__allocated_time_slot"
            "__reservation_unit_option"
            "__application_section"
            "__application"
            "__application_round"
        )
        return self.filter(**{lookup: ref})

    def unfinished(self) -> Self:
        """Reservations that have not completed checkout in time."""
        now = local_datetime()

        max_checkout_time = datetime.timedelta(minutes=settings.PRUNE_RESERVATIONS_OLDER_THAN_MINUTES)
        draft_expires_at = now - max_checkout_time

        order_expiration = datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
        order_expires_at = now - order_expiration

        return self.filter(
            models.Q(
                state=ReservationStateChoice.CREATED,
                created_at__lte=draft_expires_at,
            )
            | models.Q(
                state=ReservationStateChoice.WAITING_FOR_PAYMENT,
                payment_order__isnull=False,
                payment_order__remote_id__isnull=False,
                payment_order__status__in=[OrderStatus.EXPIRED, OrderStatus.CANCELLED],
                payment_order__created_at__lte=order_expires_at,
            )
        )

    def unpaid_handled(self) -> Self:
        """Reservations that where handled by then left unpaid are thus not valid."""
        now = local_datetime()
        return self.filter(
            state=ReservationStateChoice.CONFIRMED,
            type__in=ReservationTypeChoice.types_created_by_the_reservee,
            begin__gt=now,
            payment_order__isnull=False,
            payment_order__status__in=[OrderStatus.EXPIRED, OrderStatus.CANCELLED],
            payment_order__handled_payment_due_by__lt=now,
        )


# Need to do this to get proper type hints in the manager methods, since
# 'from_queryset' returns a subclass of Manager, but is not typed correctly...
# 'SerializableMixin.SerializableManager' contains custom queryset methods and GDPR serialization
_BaseManager: type[models.Manager] = SerializableMixin.SerializableManager.from_queryset(ReservationQuerySet)  # type: ignore[assignment]


class ReservationManager(_BaseManager):
    # Define to get type hints for queryset methods.
    def all(self) -> ReservationQuerySet:
        return super().all()  # type: ignore[return-value]

    def delete_unfinished(self) -> None:
        """Delete any reservations that have not completed checkout in time. Handle required integrations."""
        qs = self.all().unfinished()

        reservation: Reservation
        for reservation in qs:
            if reservation.access_code_generated_at is not None:
                try:
                    PindoraClient.delete_reservation(reservation=reservation)
                except Exception:  # noqa: BLE001
                    delete_pindora_reservation_task.delay(str(reservation.ext_uuid))

            reservation.delete()

    def cancel_handled_with_payment_overdue(self) -> None:
        """Cancel all unpaid handled reservations that were not paid on time. Handle required integrations."""
        qs = self.all().unpaid_handled()

        reservation: Reservation
        for reservation in qs:
            if reservation.access_code_generated_at is not None:
                try:
                    PindoraClient.delete_reservation(reservation=reservation)
                except Exception:  # noqa: BLE001
                    delete_pindora_reservation_task.delay(str(reservation.ext_uuid))

            reservation.state = ReservationStateChoice.CANCELLED
            reservation.cancel_reason = ReservationCancelReasonChoice.NOT_PAID
            reservation.save(update_fields=["state", "cancel_reason"])

            EmailService.send_reservation_cancelled_email(reservation=reservation)
