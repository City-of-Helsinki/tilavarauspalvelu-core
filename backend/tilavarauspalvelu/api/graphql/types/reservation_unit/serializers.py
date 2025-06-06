from __future__ import annotations

from typing import TYPE_CHECKING, Any

from auditlog.models import LogEntry
from django.conf import settings
from django.db import transaction
from graphene.utils.str_converters import to_camel_case
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.errors import GQLCodeError
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.api.graphql.types.application_round_time_slot.serializers import (
    ApplicationRoundTimeSlotSerializer,
)
from tilavarauspalvelu.api.graphql.types.reservation_unit_access_type.serializers import (
    ReservationUnitAccessTypeSerializer,
)
from tilavarauspalvelu.api.graphql.types.reservation_unit_image.serializers import ReservationUnitImageFieldSerializer
from tilavarauspalvelu.api.graphql.types.reservation_unit_pricing.serializers import ReservationUnitPricingSerializer
from tilavarauspalvelu.enums import AccessType, ReservationStartInterval, ReservationUnitPublishingState, WeekdayChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitAccessType, ReservationUnitPricing
from utils.date_utils import local_date, local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    import datetime

__all__ = [
    "ReservationUnitSerializer",
]


class ReservationUnitSerializer(NestingModelSerializer):
    instance: ReservationUnit | None

    images = ReservationUnitImageFieldSerializer(many=True, required=False)
    pricings = ReservationUnitPricingSerializer(many=True, required=False)
    application_round_time_slots = ApplicationRoundTimeSlotSerializer(many=True, required=False)
    access_types = ReservationUnitAccessTypeSerializer(many=True, required=False)

    class Meta:
        model = ReservationUnit
        fields = [
            #
            # IDs
            "pk",
            "ext_uuid",
            #
            # Strings
            "name",
            "description",
            "notes_when_applying",
            "contact_information",
            "reservation_pending_instructions",
            "reservation_confirmed_instructions",
            "reservation_cancelled_instructions",
            #
            # Integers
            "surface_area",
            "min_persons",
            "max_persons",
            "max_reservations_per_user",
            "reservations_min_days_before",
            "reservations_max_days_before",
            #
            # Datetime
            "reservation_begins_at",
            "reservation_ends_at",
            "publish_begins_at",
            "publish_ends_at",
            "min_reservation_duration",
            "max_reservation_duration",
            "buffer_time_before",
            "buffer_time_after",
            #
            # Booleans
            "is_draft",
            "is_archived",
            "require_adult_reservee",
            "require_reservation_handling",
            "reservation_block_whole_day",
            "can_apply_free_of_charge",
            "allow_reservations_without_opening_hours",
            #
            # Enums
            "authentication",
            "reservation_start_interval",
            "reservation_kind",
            "publishing_state",
            #
            # List fields
            "search_terms",
            #
            # Forward many-to-one related
            "unit",
            "reservation_unit_type",
            "cancellation_rule",
            "metadata_set",
            "cancellation_terms",
            "service_specific_terms",
            "pricing_terms",
            "payment_terms",
            #
            # Forward many-to-many related
            "spaces",
            "resources",
            "purposes",
            "equipments",
            #
            # Reverse one-to-many related
            "images",
            "pricings",
            "access_types",
            "application_round_time_slots",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        is_draft = self.get_or_default("is_draft", data)
        is_archived = self.get_or_default("is_archived", data)

        self._validate_reservation_duration_fields(data)
        self._validate_pricings(data)
        self._validate_access_types(access_types=data.get("access_types", []), is_draft=is_draft)

        if not is_draft and not is_archived:
            self._validate_for_publish(data)

        return data

    def _validate_reservation_duration_fields(self, data: dict[str, Any]) -> None:
        """
        Validates:
        - min_reservation_duration
        - max_reservation_duration
        - reservation_start_interval
        """
        min_duration: datetime.timedelta | None = self.get_or_default("min_reservation_duration", data)
        max_duration: datetime.timedelta | None = self.get_or_default("max_reservation_duration", data)
        start_interval: str | None = self.get_or_default("reservation_start_interval", data)

        if min_duration and max_duration and min_duration > max_duration:
            msg = "minReservationDuration can't be greater than maxReservationDuration"
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_MAX_RESERVATION_DURATIONS_INVALID)

        if start_interval is None:
            return

        interval_minutes = ReservationStartInterval(start_interval).as_number
        if min_duration:
            min_duration_minutes = min_duration.total_seconds() // 60
            if min_duration_minutes < interval_minutes:
                msg = "minReservationDuration must be at least the reservation start interval"
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID)
            if min_duration_minutes % interval_minutes != 0:
                msg = "minReservationDuration must be a multiple of the reservation start interval"
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID)

        if max_duration:
            max_duration_minutes = max_duration.total_seconds() // 60
            if max_duration_minutes < interval_minutes:
                msg = "maxReservationDuration must be at least the reservation start interval"
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID)
            if max_duration_minutes % interval_minutes != 0:
                msg = "maxReservationDuration must be a multiple of the reservation start interval"
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID)

    def _validate_for_publish(self, data: dict[str, Any]) -> None:
        required_translations: list[str] = [
            "name_fi",
            "name_sv",
            "name_en",
            "description_fi",
            "description_sv",
            "description_en",
        ]

        for field in required_translations:
            value = self.get_or_default(field, data)
            if not value or value.isspace():
                msg = (
                    f"Not draft state reservation units must have a translations. "
                    f"Missing translation for {to_camel_case(field)}."
                )
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_TRANSLATIONS)

        spaces = self.get_or_default("spaces", data)
        resources = self.get_or_default("resources", data)
        if not (spaces or resources):
            msg = "Not draft state reservation unit must have one or more space or resource defined"
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_SPACES_OR_RESOURCES)

        reservation_unit_type = self.get_or_default("reservation_unit_type", data)
        if not reservation_unit_type:
            msg = "Not draft reservation unit must have a reservation unit type."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_RESERVATION_UNIT_TYPE)

        min_persons = self.get_or_default("min_persons", data)
        max_persons = self.get_or_default("max_persons", data)
        if min_persons is not None and max_persons is not None and min_persons > max_persons:
            msg = "minPersons can't be more than maxPersons"
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_PERSONS_GREATER_THAN_MAX_PERSONS)

    def _validate_pricings(self, data: dict[str, Any]) -> None:
        """
        When reservation unit is draft, pricings are not required,
        but if they are given, they must be valid.
        """
        is_draft = self.get_or_default("is_draft", data)
        pricings = data.get("pricings")

        # Pricings are optional when reservation unit is draft
        if is_draft and pricings is None:
            return

        # If the pricings were not given, but the reservation unit has some, skip validation and assume they are valid
        if pricings is None and self.instance and self.instance.pricings.exists():
            return

        if pricings is None:
            msg = "Pricings are required for non-draft reservation units."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_MISSING)

        # At least one given pricing must be currently active (begin date is today or earlier)
        today = local_date()
        has_active_pricing = any(p["begins"] <= today for p in pricings)
        if pricings and not has_active_pricing:
            msg = "At least one active pricing is required."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING)

        # Only one pricing per date is allowed
        pricing_dates = [p.get("begins") for p in pricings]
        if len(pricing_dates) != len(set(pricing_dates)):
            msg = "Reservation unit can have only one pricing per date."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE)

        # Highest price cannot be less than the lowest price
        for pricing in pricings:
            highest_price = pricing.get("highest_price")
            lowest_price = pricing.get("lowest_price")

            if not lowest_price and not highest_price:  # = Free
                continue
            if lowest_price is None or highest_price is None:
                msg = "Both lowest and highest price must be given or neither."
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_INVALID_PRICES)
            if highest_price < lowest_price:
                msg = "Highest price cannot be less than lowest price."
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_INVALID_PRICES)

            if pricing.get("payment_type") is None:
                msg = "Pricing has no payment type defined"
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICING_NO_PAYMENT_TYPE)

    def _validate_access_types(self, *, access_types: list[dict[str, Any]], is_draft: bool) -> None:  # noqa: PLR0912
        editing = getattr(self.instance, "pk", None) is not None

        today = local_date()
        has_active: bool = False
        if editing:
            has_active = self.instance.access_types.filter(begin_date__lte=today).exists()

        if not access_types:
            if is_draft:
                return

            if not has_active:
                msg = "At least one active access type is required."
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_ACTIVE_ACCESS_TYPE)

            return

        need_to_check_pindora: bool = False

        existing: dict[int, ReservationUnitAccessType] = {}
        if editing:
            pks: set[int] = {int(at["pk"]) for at in access_types if "pk" in at}
            existing = {at.pk: at for at in self.instance.access_types.filter(pk__in=pks).order_by("begin_date")}

        for access_type in access_types:
            existing_access_type: ReservationUnitAccessType | None = None

            pk: int | None = access_type.get("pk")
            if pk is not None:
                existing_access_type = existing.get(pk)
                if existing_access_type is None:
                    msg = "Access type with this primary key doesn't belong to this reservation unit"
                    raise ValidationError(msg)

            new_access_type: str = access_type["access_type"]
            begin_date: datetime.date = access_type["begin_date"]

            if not editing:
                ReservationUnitAccessType.validators.validate_not_access_code(new_access_type)

            if not need_to_check_pindora:
                # Check from Pindora even if changed access type begin date is in the past since
                # it could be the currently active one. For more precision, we would need to calculate
                # the end dates for the new access types, but that would add a lot of complexity.
                need_to_check_pindora = new_access_type == AccessType.ACCESS_CODE and (
                    existing_access_type is None
                    or (existing_access_type is not None and existing_access_type.access_type != AccessType.ACCESS_CODE)
                )

            if existing_access_type is not None:
                existing_access_type.validators.validate_not_past(begin_date)
                existing_access_type.validators.validate_not_moved_to_past(begin_date)
            else:
                ReservationUnitAccessType.validators.validate_new_not_in_past(begin_date)

            has_active = has_active or begin_date <= today

        if not has_active:
            msg = "At least one active access type is required."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_ACTIVE_ACCESS_TYPE)

        if need_to_check_pindora:
            try:
                PindoraClient.get_reservation_unit(self.instance)
            except ExternalServiceError as error:
                raise ValidationError(str(error)) from error

    @staticmethod
    def validate_application_round_time_slots(timeslots: list[dict[str, Any]]) -> list[dict[str, Any]]:
        errors: list[str] = []
        weekdays_seen: set[int] = set()

        for timeslot in timeslots:
            weekday = timeslot["weekday"]
            closed = timeslot.get("is_closed", False)
            reservable_times = timeslot.get("reservable_times", [])

            if closed and len(reservable_times) > 0:
                errors.append("Closed timeslots cannot have reservable times.")
            elif not closed and len(reservable_times) == 0:
                errors.append("Open timeslots must have reservable times.")

            if weekday in weekdays_seen:
                day = WeekdayChoice(weekday).name.capitalize()
                errors.append(f"Got multiple timeslots for {day}.")

            weekdays_seen.add(weekday)

        if errors:
            raise ValidationError(errors)

        return timeslots

    def save(self, **kwargs: Any) -> ReservationUnit:
        instance = super().save(**kwargs)
        self.remove_personal_data_and_logs_on_archive(instance)
        self.update_hauki(instance)
        return instance

    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> ReservationUnit:
        pricings = validated_data.pop("pricings", [])
        access_types = validated_data.pop("access_types", [])
        reservation_unit = super().create(validated_data)
        self.handle_pricings(pricings, reservation_unit)
        self.handle_access_types(access_types, reservation_unit)
        return reservation_unit

    @transaction.atomic
    def update(self, instance: ReservationUnit, validated_data: dict[str, Any]) -> ReservationUnit:
        # The ReservationUnit can't be archived if it has active reservations in the future
        if instance.publishing_state != ReservationUnitPublishingState.ARCHIVED and validated_data.get("is_archived"):
            future_reservations = instance.reservations.going_to_occur().filter(ends_at__gt=local_datetime())
            if future_reservations.exists():
                msg = "Reservation unit can't be archived if it has any reservations in the future"
                raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_HAS_FUTURE_RESERVATIONS)

        pricings = validated_data.pop("pricings", [])
        access_types = validated_data.pop("access_types", [])
        self.handle_pricings(pricings, instance)
        self.handle_access_types(access_types, instance)
        # Reservation Unit needs to be updated last, due to post_save signals.
        # Verkkokauppa payment product update is triggered by the post_save signal of the ReservationUnit,
        # and requires a paid pricing to already be present in the database.
        return super().update(instance, validated_data)

    def remove_personal_data_and_logs_on_archive(self, instance: ReservationUnit) -> None:
        """
        When reservation unit is archived, we want to delete all personally identifiable information (GDPR stuff).
        Because all changes are stored to the audit log, we also need to delete old audit events related to the unit.
        """
        if not self.validated_data.get("is_archived", False) and not instance.is_archived:
            return

        # Reset contact information and mark reservation unit as draft
        instance.contact_information = ""
        instance.is_draft = True
        instance.save()

        # Remove all logs related to the reservation unit
        LogEntry.objects.get_for_object(instance).delete()

    @staticmethod
    def update_hauki(instance: ReservationUnit) -> None:
        """
        After mutating the instance, check if the reservation unit
        was published and thus should be sent to HAUKI and do it here.
        """
        if instance.origin_hauki_resource is not None:
            HaukiResourceHashUpdater([instance.origin_hauki_resource.id]).run(force_refetch=True)

        if settings.HAUKI_EXPORTS_ENABLED:
            try:
                instance.actions.send_reservation_unit_to_hauki()
            except ExternalServiceError as err:
                msg = "Sending reservation unit as resource to HAUKI failed."
                raise GQLCodeError(msg, code=error_codes.HAUKI_EXPORTS_ERROR) from err

    @staticmethod
    def handle_pricings(pricings: list[dict[Any, Any]], reservation_unit: ReservationUnit) -> None:
        with transaction.atomic():
            # Delete future pricings that are not in the payload.
            # Past or Active pricings can not be deleted.
            pricing_pks = [pricing.get("pk") for pricing in pricings if "pk" in pricing]
            ReservationUnitPricing.objects.filter(
                reservation_unit=reservation_unit,
                begins__gt=local_date(),
            ).exclude(
                pk__in=pricing_pks,
            ).delete()

            for pricing in pricings:
                if "pk" in pricing:  # Update existing pricings
                    ReservationUnitPricing.objects.update_or_create(pk=pricing["pk"], defaults=pricing)
                else:  # Create new pricings
                    ReservationUnitPricing.objects.create(**pricing, reservation_unit=reservation_unit)

    @staticmethod
    def handle_access_types(access_types: list[dict[Any, Any]], reservation_unit: ReservationUnit) -> None:
        """Update access types for a reservation unit."""
        access_type_pks = [access_type.get("pk") for access_type in access_types if "pk" in access_type]
        today = local_date()

        with transaction.atomic():
            # Delete future access types that are not in the payload.
            # Past or active access types should not be deleted.
            ReservationUnitAccessType.objects.filter(
                reservation_unit=reservation_unit,
                begin_date__gt=today,
            ).exclude(pk__in=access_type_pks).delete()

            ReservationUnitAccessType.objects.bulk_create(
                objs=[
                    ReservationUnitAccessType(**access_type, reservation_unit=reservation_unit)
                    for access_type in access_types
                ],
                update_conflicts=True,
                update_fields=["access_type", "begin_date"],
                unique_fields=["pk"],
            )

        reservation_unit.actions.update_access_types_for_reservations()
