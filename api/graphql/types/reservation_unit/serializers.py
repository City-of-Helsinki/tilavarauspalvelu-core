from datetime import timedelta
from typing import Any

from auditlog.models import LogEntry
from django.conf import settings
from graphene.utils.str_converters import to_camel_case
from graphene_django_extensions import NestingModelSerializer
from graphql import GraphQLError
from rest_framework.exceptions import ValidationError

from api.graphql.extensions import error_codes
from api.graphql.types.application_round_time_slot.serializers import ApplicationRoundTimeSlotSerializer
from api.graphql.types.reservation_unit_image.serializers import ReservationUnitImageFieldSerializer
from api.graphql.types.reservation_unit_pricing.serializers import ReservationUnitPricingSerializer
from applications.choices import WeekdayChoice
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from reservation_units.enums import PricingStatus, ReservationStartInterval
from reservation_units.models import ReservationUnit, ReservationUnitPricing
from reservation_units.utils.reservation_unit_pricing_helper import ReservationUnitPricingHelper
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationUnitSerializer",
]


class ReservationUnitSerializer(NestingModelSerializer):
    instance: ReservationUnit | None

    images = ReservationUnitImageFieldSerializer(many=True, required=False)
    pricings = ReservationUnitPricingSerializer(many=True, required=False)
    application_round_time_slots = ApplicationRoundTimeSlotSerializer(many=True, required=False)

    class Meta:
        model = ReservationUnit
        fields = [
            #
            # IDs
            "pk",
            "uuid",
            #
            # Strings
            "name",
            "description",
            "terms_of_use",
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
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
            "min_reservation_duration",
            "max_reservation_duration",
            "buffer_time_before",
            "buffer_time_after",
            #
            # Booleans
            "is_draft",
            "is_archived",
            "require_introduction",
            "require_reservation_handling",
            "reservation_block_whole_day",
            "can_apply_free_of_charge",
            "allow_reservations_without_opening_hours",
            #
            # Enums
            "authentication",
            "reservation_start_interval",
            "reservation_kind",
            "state",
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
            "services",
            "payment_types",
            "qualifiers",
            #
            # Reverse one-to-many related
            "images",
            "pricings",
            "application_round_time_slots",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        is_draft = data.get("is_draft", getattr(self.instance, "is_draft", False))

        self.validate_reservation_duration_fields(data)

        if self.instance is not None:
            self.validate_updated_pricings(data)
        else:
            data = self.validate_created_pricings(data)

        if not is_draft:
            self.validate_for_publish(data)

        return data

    def validate_reservation_duration_fields(self, data: dict[str, Any]) -> None:
        """
        Validates:
        - min_reservation_duration
        - max_reservation_duration
        - reservation_start_interval
        """
        min_duration: timedelta | None = self.get_or_default("min_reservation_duration", data)
        max_duration: timedelta | None = self.get_or_default("max_reservation_duration", data)
        start_interval: str | None = self.get_or_default("reservation_start_interval", data)

        if min_duration and max_duration and min_duration > max_duration:
            raise ValidationError(
                "minReservationDuration can't be greater than maxReservationDuration",
                code=error_codes.RESERVATION_UNIT_MIN_MAX_RESERVATION_DURATIONS_INVALID,
            )

        if start_interval is None:
            return

        interval_minutes = ReservationStartInterval(start_interval).as_number
        if min_duration:
            min_duration_minutes = min_duration.total_seconds() // 60
            if min_duration_minutes < interval_minutes:
                raise ValidationError(
                    "minReservationDuration must be at least the reservation start interval",
                    code=error_codes.RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID,
                )
            if min_duration_minutes % interval_minutes != 0:
                raise ValidationError(
                    "minReservationDuration must be a multiple of the reservation start interval",
                    code=error_codes.RESERVATION_UNIT_MIN_RESERVATION_DURATION_INVALID,
                )

        if max_duration:
            max_duration_minutes = max_duration.total_seconds() // 60
            if max_duration_minutes < interval_minutes:
                raise ValidationError(
                    "maxReservationDuration must be at least the reservation start interval",
                    code=error_codes.RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID,
                )
            if max_duration_minutes % interval_minutes != 0:
                raise ValidationError(
                    "maxReservationDuration must be a multiple of the reservation start interval",
                    code=error_codes.RESERVATION_UNIT_MAX_RESERVATION_DURATION_INVALID,
                )

    def validate_for_publish(self, data: dict[str, Any]) -> None:
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

    def validate_created_pricings(self, data: dict[str, Any]) -> dict[str, Any]:
        is_draft = self.get_or_default("is_draft", data)
        ReservationUnitPricingHelper.check_pricing_required(is_draft, data)
        ReservationUnitPricingHelper.check_pricing_dates(data)
        ReservationUnitPricingHelper.check_pricing_counts(is_draft, data)
        data["pricings"] = ReservationUnitPricingHelper.calculate_vat_prices(data)
        return data

    def validate_updated_pricings(self, data: dict[str, Any]) -> dict[str, Any]:
        current_active_pricing = ReservationUnitPricingHelper.get_active_price(self.instance)
        current_future_pricing = ReservationUnitPricingHelper.get_future_price(self.instance)

        for pricing in data.get("pricings", []):
            if (
                ReservationUnitPricingHelper.is_active(pricing)
                and current_active_pricing
                and current_active_pricing.pk != pricing.get("pk", 0)
            ):
                raise GraphQLError("ACTIVE pricing is already defined. Only one ACTIVE pricing is allowed")

            if (
                ReservationUnitPricingHelper.is_future(pricing)
                and current_future_pricing
                and current_future_pricing.pk != pricing.get("pk", 0)
            ):
                raise GraphQLError("FUTURE pricing is already defined. Only one FUTURE pricing is allowed")

        return ReservationUnitPricingHelper.calculate_vat_prices(data)

    @staticmethod
    def validate_application_round_time_slots(timeslots: list[dict[str, Any]]) -> list[dict[str, Any]]:
        errors: list[str] = []
        weekdays_seen: set[int] = set()

        for timeslot in timeslots:
            weekday = timeslot["weekday"]
            closed = timeslot.get("closed", False)
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
                raise GraphQLError("Sending reservation unit as resource to HAUKI failed.") from err

    @staticmethod
    def handle_pricings(pricings: list[dict[Any, Any]], reservation_unit):
        # Delete pricings that are not in the payload
        if not ReservationUnitPricingHelper.contains_status(PricingStatus.PRICING_STATUS_ACTIVE, pricings):
            ReservationUnitPricing.objects.filter(
                reservation_unit=reservation_unit,
                status=PricingStatus.PRICING_STATUS_ACTIVE,
            ).delete()

        if not ReservationUnitPricingHelper.contains_status(PricingStatus.PRICING_STATUS_FUTURE, pricings):
            ReservationUnitPricing.objects.filter(
                reservation_unit=reservation_unit,
                status=PricingStatus.PRICING_STATUS_FUTURE,
            ).delete()

        for pricing in pricings:
            if "pk" in pricing:  # Update existing pricings
                ReservationUnitPricing.objects.update_or_create(pk=pricing["pk"], defaults=pricing)

            else:  # Create new pricings
                status = pricing.get("status")
                ReservationUnitPricing.objects.filter(reservation_unit=reservation_unit, status=status).delete()
                ReservationUnitPricing.objects.create(**pricing, reservation_unit=reservation_unit)

    def update(self, instance: ReservationUnit, validated_data: dict[str, Any]) -> ReservationUnit:
        pricings = validated_data.pop("pricings", [])
        reservation_unit = super().update(instance, validated_data)
        self.handle_pricings(pricings, instance)
        return reservation_unit
