from typing import Any

from graphene.utils.str_converters import to_camel_case
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.graphql.extensions.duration_field import DurationField
from api.graphql.extensions.legacy_helpers import (
    OldChoiceCharField,
    OldPrimaryKeySerializer,
    OldPrimaryKeyUpdateSerializer,
    get_all_translatable_fields,
)
from api.graphql.extensions.validating_list_field import ValidatingListField
from api.graphql.types.application_round_time_slot.serializers import ApplicationRoundTimeSlotSerializer
from api.graphql.types.reservation_unit_pricing.serializers import (
    ReservationUnitPricingCreateSerializer,
    ReservationUnitPricingUpdateSerializer,
)
from api.legacy_rest_api.serializers import ReservationUnitSerializer
from applications.choices import WeekdayChoice
from applications.models import ApplicationRoundTimeSlot
from common.fields.serializer import IntegerPrimaryKeyField
from reservation_units.enums import (
    PricingStatus,
    ReservationKind,
    ReservationStartInterval,
)
from reservation_units.models import (
    Equipment,
    Purpose,
    Qualifier,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
    ReservationUnitType,
)
from reservation_units.utils.reservation_unit_pricing_helper import ReservationUnitPricingHelper
from reservations.models import ReservationMetadataSet
from resources.models import Resource
from services.models import Service
from spaces.models import Space, Unit
from terms_of_use.models import TermsOfUse


class ReservationUnitCreateSerializer(ReservationUnitSerializer, OldPrimaryKeySerializer):
    terms_of_use_fi = serializers.CharField(required=False, allow_null=True)
    terms_of_use_sv = serializers.CharField(required=False, allow_null=True)
    terms_of_use_en = serializers.CharField(required=False, allow_null=True)
    name_fi = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    name_sv = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    name_en = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    max_reservation_duration = DurationField(required=False, allow_null=True)
    min_reservation_duration = DurationField(required=False, allow_null=True)
    buffer_time_before = DurationField(required=False)
    buffer_time_after = DurationField(required=False)
    max_persons = serializers.IntegerField(required=False, allow_null=True)
    space_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Space.objects.all()),
        source="spaces",
        required=False,
    )
    resource_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Resource.objects.all()),
        source="resources",
        required=False,
    )
    purpose_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Purpose.objects.all()),
        source="purposes",
        required=False,
    )
    qualifier_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Qualifier.objects.all()),
        source="qualifiers",
        required=False,
    )
    equipment_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Equipment.objects.all()),
        source="equipments",
        required=False,
    )
    service_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Service.objects.all()),
        source="services",
        required=False,
    )
    reservation_unit_type_pk = IntegerPrimaryKeyField(
        source="reservation_unit_type",
        required=False,
        allow_null=True,
        queryset=ReservationUnitType.objects.all(),
    )
    unit_pk = IntegerPrimaryKeyField(
        queryset=Unit.objects.all(),
        source="unit",
        required=False,
        allow_null=True,
    )
    cancellation_rule_pk = IntegerPrimaryKeyField(
        queryset=ReservationUnitCancellationRule.objects.all(),
        source="cancellation_rule",
        required=False,
        allow_null=True,
    )
    payment_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT),
        source="payment_terms",
        required=False,
        allow_null=True,
    )
    pricing_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_PRICING),
        source="pricing_terms",
        required=False,
        allow_null=True,
    )
    cancellation_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION),
        source="cancellation_terms",
        required=False,
        allow_null=True,
    )
    service_specific_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_SERVICE),
        source="service_specific_terms",
        required=False,
        allow_null=True,
    )
    reservation_start_interval = OldChoiceCharField(
        required=False,
        choices=ReservationStartInterval.choices,
        help_text=(
            "Determines the interval for the start time of the reservation. "
            "For example an interval of 15 minutes means a reservation can "
            "begin at minutes 0, 15, 30, or 45. Possible values are "
            f"{', '.join(value.upper() for value in ReservationStartInterval.names)}."
        ),
    )
    metadata_set_pk = IntegerPrimaryKeyField(
        queryset=ReservationMetadataSet.objects.all(),
        source="metadata_set",
        required=False,
        allow_null=True,
    )
    authentication = OldChoiceCharField(
        required=False,
        choices=ReservationUnit.AUTHENTICATION_TYPES,
        help_text=(
            "Authentication required for reserving this reservation unit. Possible values are "
            f"{', '.join(value[0].upper() for value in ReservationUnit.AUTHENTICATION_TYPES)}."
        ),
    )

    reservation_kind = OldChoiceCharField(
        default=ReservationKind.DIRECT_AND_SEASON,
        choices=ReservationKind.choices,
        help_text=(
            "What kind of reservations are to be made to this is reservation unit. Possible values are: "
            f"{', '.join(value.upper() for value in ReservationKind)}."
        ),
    )

    allow_reservations_without_opening_hours = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Allow reservations without opening hours. Used for testing.",
    )

    is_archived = serializers.BooleanField(required=False, default=False, help_text="Is reservation unit archived")

    payment_types = ValidatingListField(
        child=serializers.PrimaryKeyRelatedField(queryset=ReservationUnitPaymentType.objects.all()),
        allow_empty=True,
        required=False,
    )

    pricings = ReservationUnitPricingCreateSerializer(many=True, read_only=False, required=False)

    application_round_time_slots = ApplicationRoundTimeSlotSerializer(many=True, required=False)

    translation_fields = get_all_translatable_fields(ReservationUnit)

    class Meta(ReservationUnitSerializer.Meta):
        fields = [
            "pk",
            "spaces",
            "resources",
            "services",
            "require_introduction",
            "purposes",
            "images",
            "location",
            "max_persons",
            "min_persons",
            "reservation_unit_type",
            "building",
            "equipment_pks",
            "unit_pk",
            "uuid",
            "contact_information",
            "max_reservation_duration",
            "min_reservation_duration",
            "is_draft",
            "space_pks",
            "resource_pks",
            "purpose_pks",
            "qualifier_pks",
            "service_pks",
            "reservation_unit_type_pk",
            "surface_area",
            "buffer_time_before",
            "buffer_time_after",
            "cancellation_rule_pk",
            "payment_terms_pk",
            "cancellation_terms_pk",
            "service_specific_terms_pk",
            "reservation_start_interval",
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
            "metadata_set_pk",
            "max_reservations_per_user",
            "require_reservation_handling",
            "authentication",
            "reservation_kind",
            "reservation_block_whole_day",
            "can_apply_free_of_charge",
            "reservations_max_days_before",
            "reservations_min_days_before",
            "allow_reservations_without_opening_hours",
            "is_archived",
            "state",
            "pricing_terms_pk",
            "pricing_terms",
            "payment_types",
            "pricings",
            "application_round_time_slots",
        ] + get_all_translatable_fields(ReservationUnit)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["equipment_pks"].write_only = True
        self.fields["space_pks"].write_only = True
        self.fields["resource_pks"].write_only = True
        self.fields["purpose_pks"].write_only = True
        self.fields["service_pks"].write_only = True
        self.fields["payment_terms_pk"].write_only = True
        self.fields["cancellation_terms_pk"].write_only = True
        self.fields["service_specific_terms_pk"].write_only = True
        self.fields["pricing_terms_pk"].write_only = True
        self.fields["metadata_set_pk"].write_only = True

    def _check_pk_list(self, id_list, field_name):
        for identifier in id_list:
            try:
                int(identifier)
            except ValueError:
                raise GraphQLError(f"Wrong type of id: {identifier} for {field_name}")

    def validate(self, data):
        is_draft = data.get("is_draft", getattr(self.instance, "is_draft", False))
        data = self.validate_pricing_fields(data)

        if not is_draft:
            self.validate_for_publish(data)

        if "name_fi" in data:
            name = data.get("name_fi")
            if not name or name.isspace():
                raise GraphQLError("nameFi is required for draft reservation units.")

        return data

    def validate_for_publish(self, data):
        """Validates necessary fields for published reservation unit."""
        allowed_empty_fields = [
            "reservation_confirmed_instructions_fi",
            "reservation_confirmed_instructions_sv",
            "reservation_confirmed_instructions_en",
            "reservation_pending_instructions_fi",
            "reservation_pending_instructions_sv",
            "reservation_pending_instructions_en",
            "reservation_cancelled_instructions_fi",
            "reservation_cancelled_instructions_sv",
            "reservation_cancelled_instructions_en",
            "terms_of_use_fi",
            "terms_of_use_en",
            "terms_of_use_sv",
        ]
        for field in self.translation_fields:
            value = data.get(field, getattr(self.instance, field, None))
            if field not in allowed_empty_fields and (not value or value.isspace()):
                raise GraphQLError(
                    f"Not draft state reservation units must have a translations. "
                    f"Missing translation for {to_camel_case(field)}."
                )

        spaces = data.get("spaces", getattr(self.instance, "spaces", None))
        resources = data.get("resources", getattr(self.instance, "resources", None))
        if not (spaces or resources):
            raise GraphQLError("Not draft state reservation unit must have one or more space or resource defined")

        reservation_unit_type = data.get(
            "reservation_unit_type",
            getattr(self.instance, "reservation_unit_type", None),
        )
        if not reservation_unit_type:
            raise GraphQLError("Not draft reservation unit must have a reservation unit type.")

        max_persons = data.get("max_persons", getattr(self.instance, "max_persons", None))
        if data.get("min_persons") and max_persons and data.get("min_persons") > max_persons:
            raise GraphQLError("minPersons can't be more than maxPersons")

    def validate_pricing_fields(self, data):
        is_draft = data.get("is_draft", getattr(self.instance, "is_draft", False))

        ReservationUnitPricingHelper.check_pricing_required(is_draft, data)
        ReservationUnitPricingHelper.check_pricing_dates(data)
        ReservationUnitPricingHelper.check_pricing_counts(is_draft, data)
        data["pricings"] = ReservationUnitPricingHelper.calculate_vat_prices(data)

        return data

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

    @staticmethod
    def handle_pricings(pricings: list[dict[Any, Any]], reservation_unit):
        for pricing in pricings:
            ReservationUnitPricing.objects.create(**pricing, reservation_unit=reservation_unit)

    @staticmethod
    def handle_timeslots(time_slots: list[dict[str, Any]], reservation_unit: ReservationUnit) -> None:
        for time_slot in time_slots:
            ApplicationRoundTimeSlot.objects.create(**time_slot, reservation_unit=reservation_unit)

    def create(self, validated_data):
        pricings = validated_data.pop("pricings", [])
        application_round_time_slots = validated_data.pop("application_round_time_slots", [])
        reservation_unit = super().create(validated_data)
        self.handle_pricings(pricings, reservation_unit)
        self.handle_timeslots(application_round_time_slots, reservation_unit)
        return reservation_unit


class ReservationUnitUpdateSerializer(OldPrimaryKeyUpdateSerializer, ReservationUnitCreateSerializer):
    pricings = ReservationUnitPricingUpdateSerializer(many=True, read_only=False, required=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["unit_pk"].required = False
        self.fields["pricings"].write_only = True

    class Meta(ReservationUnitCreateSerializer.Meta):
        fields = ReservationUnitCreateSerializer.Meta.fields + ["pk"]

    def validate(self, data):
        data = super().validate(data)
        self.validate_pricing(data)
        return data

    def validate_pricing(self, data) -> dict[str, Any]:
        current_active_pricing = ReservationUnitPricingHelper.get_active_price(self.instance)
        current_future_pricing = ReservationUnitPricingHelper.get_future_price(self.instance)

        for pricing in data.get("pricings"):
            if (
                ReservationUnitPricingHelper.is_active(pricing)
                and current_active_pricing
                and current_active_pricing.pk != pricing.get("pk", 0)
            ):
                raise GraphQLError("ACTIVE pricing is already defined. Only one ACTIVE pricing is allowed")
            elif (
                ReservationUnitPricingHelper.is_future(pricing)
                and current_future_pricing
                and current_future_pricing.pk != pricing.get("pk", 0)
            ):
                raise GraphQLError("FUTURE pricing is already defined. Only one FUTURE pricing is allowed")

        data = ReservationUnitPricingHelper.calculate_vat_prices(data)
        return data

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

    @staticmethod
    def handle_timeslots(time_slots: list[dict[Any, Any]], reservation_unit: ReservationUnit) -> None:
        ids: list[int] = []
        for time_slot_data in time_slots:
            weekday = time_slot_data.pop("weekday")
            time_slot, _ = ApplicationRoundTimeSlot.objects.update_or_create(
                weekday=weekday,
                reservation_unit=reservation_unit,
                defaults=time_slot_data,
            )
            ids.append(time_slot.pk)

        # Delete un-updated timeslots for this reservation unit
        ApplicationRoundTimeSlot.objects.filter(reservation_unit=reservation_unit).exclude(pk__in=ids).delete()

    def update(self, instance, validated_data):
        pricings = validated_data.pop("pricings", [])
        application_round_time_slots = validated_data.pop("application_round_time_slots", [])
        reservation_unit = super().update(instance, validated_data)
        self.handle_pricings(pricings, instance)
        self.handle_timeslots(application_round_time_slots, reservation_unit)
        return reservation_unit
