import operator
from typing import TYPE_CHECKING, Any, TypedDict

from django.db import models
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.serializers import NotProvided
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.api.graphql.types.reservation_unit_option.serializers import (
    ReservationUnitOptionApplicantSerializer,
)
from tilavarauspalvelu.api.graphql.types.suitable_time_range.serializers import SuitableTimeRangeSerializer
from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import (
    AllocatedTimeSlot,
    Application,
    ApplicationRound,
    ApplicationSection,
    Reservation,
    ReservationCancelReason,
)
from utils.date_utils import local_datetime
from utils.db import NowTT
from utils.utils import comma_sep_str

if TYPE_CHECKING:
    import datetime

__all__ = [
    "ApplicationSectionSerializer",
]


class ApplicationSectionSerializer(NestingModelSerializer):
    instance: ApplicationSection | None

    reservation_unit_options = ReservationUnitOptionApplicantSerializer(many=True)
    suitable_time_ranges = SuitableTimeRangeSerializer(many=True)

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
            "name",
            "num_persons",
            "reservations_begin_date",
            "reservations_end_date",
            "reservation_min_duration",
            "reservation_max_duration",
            "applied_reservations_per_week",
            "application",
            "purpose",
            "age_group",
            "reservation_unit_options",
            "suitable_time_ranges",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: list[str] = []

        # Using serializer as a sub-serializer, and trying to reuse the same object.
        if "pk" in data and not self.instance:
            self.instance = ApplicationSection.objects.get(pk=data["pk"])

        if "reservation_unit_options" in data:
            self.validate_option_preferred_ordering(data["reservation_unit_options"], errors)

        self.validate_reservation_period(data, errors)

        if errors:
            raise ValidationError(errors)

        return data

    def validate_option_preferred_ordering(self, data: list[dict[str, Any]], errors: list[str]) -> None:
        from tilavarauspalvelu.models import ReservationUnitOption

        option_errors: list[str] = []

        # Fetch current ordering for existing event reservation units
        current_ordering: dict[str, int] = {}
        if self.instance is not None:
            current_ordering: dict[str, int] = {
                option["pk"]: option["preferred_order"]
                for option in ReservationUnitOption.objects.filter(application_section=self.instance).values(
                    "preferred_order", "pk"
                )
            }

        # Check if there are duplicates in the new ordering.
        tracked_ordering: dict[int, list[str]] = {}
        for num, item in enumerate(data, start=1):
            # Use #1, #2, ... in error messages for new reservation units
            pk_or_order = item.get("pk", f"#{num}")

            order: int | None = item.get("preferred_order", current_ordering.get(pk_or_order))
            if order is None:
                option_errors.append("Field 'preferred_order' is required")
                continue

            if order in tracked_ordering:
                option_errors.append(
                    f"Reservation Unit Option {pk_or_order} has duplicate 'preferred_order' "
                    f"{order} with these Reservation Unit Options: {comma_sep_str(tracked_ordering[order])}",
                )

            tracked_ordering.setdefault(order, [])
            tracked_ordering[order].append(pk_or_order)

        # Return early since the sequential check would always fail if there are duplicates
        if option_errors:
            errors.extend(option_errors)
            return

        # Check preferred_order is sequential, starting from zero
        for index, (tracked, pks) in enumerate(sorted(tracked_ordering.items(), key=operator.itemgetter(0))):
            if index != tracked:
                # There should be only one pk in the list, since we raised errors early
                option_errors.append(
                    f"Reservation Unit Option {pks[0]} has 'preferred_order' {tracked} but should be {index}",
                )

        errors.extend(option_errors)

    def validate_reservation_period(self, data: dict[str, Any], errors: list[str]) -> None:
        reservations_begin_date: datetime.date = self.get_or_default("reservations_begin_date", data)
        reservations_end_date: datetime.date = self.get_or_default("reservations_end_date", data)

        application: Application | NotProvided = self.get_or_default("application", data)

        # Creating/updating application with application section
        if application is NotProvided:
            parent_serializer = self.parent.parent
            application_round = parent_serializer.get_or_default("application_round", parent_serializer.initial_data)
            if isinstance(application_round, ApplicationRound):
                application_round = application_round.pk

            reservation_period = (
                ApplicationRound.objects.filter(pk=application_round)
                .values("reservation_period_begin", "reservation_period_end")
                .first()
            )

        else:
            reservation_period: dict[str, datetime.date] = (
                Application.objects.select_related("application_round")
                .filter(pk=application.pk)
                .annotate(
                    reservation_period_begin=models.F("application_round__reservation_period_begin"),
                    reservation_period_end=models.F("application_round__reservation_period_end"),
                )
                .values("reservation_period_begin", "reservation_period_end")
                .first()
            )

        if reservation_period["reservation_period_begin"] > reservations_begin_date:
            msg = "Reservations begin date cannot be before the application round's reservation period begin date."
            errors.append(msg)

        if reservation_period["reservation_period_end"] < reservations_end_date:
            msg = "Reservations end date cannot be after the application round's reservation period end date."
            errors.append(msg)


class ApplicationSectionForApplicationSerializer(ApplicationSectionSerializer):
    class Meta:
        model = ApplicationSection
        fields = [item for item in ApplicationSectionSerializer.Meta.fields if item != "application"]


class RejectAllSectionOptionsSerializer(NestingModelSerializer):
    instance: ApplicationSection

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        slots_exist = AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section=self.instance,
        ).exists()

        if slots_exist:
            msg = "Application section has allocated time slots and cannot be rejected."
            raise ValidationError(msg, code=error_codes.CANNOT_REJECT_SECTION_OPTIONS)

        return data

    def save(self, **kwargs: Any) -> ApplicationSection:
        self.instance.reservation_unit_options.all().update(rejected=True)
        return self.instance


class RestoreAllSectionOptionsSerializer(NestingModelSerializer):
    instance: ApplicationSection

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
        ]

    def save(self, **kwargs: Any) -> ApplicationSection:
        self.instance.reservation_unit_options.all().update(rejected=False)
        return self.instance


class CancellationOutput(TypedDict):
    expected_cancellations: int
    actual_cancellations: int


class ApplicationSectionReservationCancellationInputSerializer(NestingModelSerializer):
    instance: ApplicationSection

    cancel_reason = serializers.IntegerField(required=True)
    cancel_details = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
            "cancel_reason",
            "cancel_details",
        ]
        extra_kwargs = {
            "cancel_reason": {"required": True},
            "cancel_details": {"required": False},
        }

    @staticmethod
    def validate_cancel_reason(value: int) -> int:
        if ReservationCancelReason.objects.filter(pk=value).exists():
            return value
        msg = f"Cancel reason with pk {value} does not exist."
        raise ValidationError(msg, code=error_codes.CANCEL_REASON_DOES_NOT_EXIST)

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        if self.instance.application.application_round.status != ApplicationRoundStatusChoice.RESULTS_SENT:
            msg = "Application sections application round is not in 'RESULTS_SENT' state."
            raise ValidationError(msg, code=error_codes.APPLICATION_ROUND_NOT_IN_RESULTS_SENT_STATE)

        return data

    def save(self, **kwargs: Any) -> CancellationOutput:
        future_reservations = Reservation.objects.filter(
            user=self.instance.application.user,
            begin__gt=local_datetime(),
            recurring_reservation__allocated_time_slot__reservation_unit_option__application_section=self.instance,
        )

        cancellable_reservations = (
            future_reservations.filter(
                type=ReservationTypeChoice.SEASONAL,
                state=ReservationStateChoice.CONFIRMED,
                price=0,
                reservation_units__cancellation_rule__isnull=False,
            )
            .alias(
                cancellation_time=models.F("reservation_units__cancellation_rule__can_be_cancelled_time_before"),
                cancellation_cutoff=NowTT() + models.F("cancellation_time"),
            )
            .filter(
                begin__gt=models.F("cancellation_cutoff"),
            )
            .distinct()
        )

        data = CancellationOutput(
            expected_cancellations=future_reservations.count(),
            actual_cancellations=cancellable_reservations.count(),
        )

        cancellable_reservations.update(
            state=ReservationStateChoice.CANCELLED,
            cancel_reason=self.validated_data["cancel_reason"],
            cancel_details=self.validated_data.get("cancel_details", ""),
        )

        return data


class ApplicationSectionReservationCancellationOutputSerializer(NestingModelSerializer):
    future = serializers.IntegerField(required=True)
    cancelled = serializers.IntegerField(required=True)

    class Meta:
        model = ApplicationSection
        fields = [
            "future",
            "cancelled",
        ]
        extra_kwargs = {
            "future": {"required": True},
            "cancelled": {"required": True},
        }
