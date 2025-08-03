import datetime
from collections.abc import Iterable
from decimal import Decimal
from typing import Any

from auditlog.models import LogEntry
from django.conf import settings
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.api.graphql.types.reservation_unit.mutations.validators import (
    validate_for_publish,
    validate_reservation_duration,
    validate_translations,
)
from tilavarauspalvelu.enums import AccessType, Weekday
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tilavarauspalvelu.models import (
    ApplicationRoundTimeSlot,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitImage,
    ReservationUnitPricing,
    User,
)
from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet
from tilavarauspalvelu.typing import (
    ReservationUnitAccessTypeUpdateData,
    ReservationUnitPricingUpdateData,
    ReservationUnitUpdateData,
    TimeSlot,
    error_codes,
)
from tilavarauspalvelu.validators import validate_reservable_times_begin_end, validate_reservable_times_overlap
from utils.date_utils import local_date, local_datetime
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationUnitUpdateMutation",
]


class ReservationUnitImageUpdateInput(MutationType[ReservationUnitImage], kind="related"):
    pk = Input()
    image = Input()
    image_type = Input()


class ReservationUnitPricingUpdateInput(MutationType[ReservationUnitPricing], kind="related"):
    pk = Input()
    begins = Input()
    is_activated_on_begins = Input()
    payment_type = Input()
    price_unit = Input()
    lowest_price = Input()
    highest_price = Input()
    tax_percentage = Input()


class ReservationUnitAccessTypeUpdateInput(MutationType[ReservationUnitAccessType], kind="related"):
    pk = Input()
    access_type = Input()
    begin_date = Input()


class ApplicationRoundTimeSlotUpdateInput(MutationType[ApplicationRoundTimeSlot], kind="related"):
    pk = Input()
    weekday = Input()
    is_closed = Input()
    reservable_times = Input(list[TimeSlot])

    @reservable_times.validate
    def validate_reservable_times(self, info: GQLInfo[User], *, value: list[TimeSlot]) -> None:
        validate_reservable_times_begin_end(value)
        validate_reservable_times_overlap(value)


class ReservationUnitUpdateMutation(MutationType[ReservationUnit], kind="update"):
    """Update a ReservationUnit."""

    # Strings
    name_fi = Input(str, required=False)
    name_sv = Input(str, required=False)
    name_en = Input(str, required=False)
    description_fi = Input(str, required=False)
    description_sv = Input(str, required=False)
    description_en = Input(str, required=False)
    notes_when_applying_fi = Input(str, required=False)
    notes_when_applying_sv = Input(str, required=False)
    notes_when_applying_en = Input(str, required=False)
    reservation_pending_instructions_fi = Input(str, required=False)
    reservation_pending_instructions_sv = Input(str, required=False)
    reservation_pending_instructions_en = Input(str, required=False)
    reservation_confirmed_instructions_fi = Input(str, required=False)
    reservation_confirmed_instructions_sv = Input(str, required=False)
    reservation_confirmed_instructions_en = Input(str, required=False)
    reservation_cancelled_instructions_fi = Input(str, required=False)
    reservation_cancelled_instructions_sv = Input(str, required=False)
    reservation_cancelled_instructions_en = Input(str, required=False)

    contact_information = Input()

    # Integers
    surface_area = Input()
    min_persons = Input()
    max_persons = Input()
    max_reservations_per_user = Input()
    reservations_min_days_before = Input()
    reservations_max_days_before = Input()

    # Datetime
    reservation_begins_at = Input()
    reservation_ends_at = Input()
    publish_begins_at = Input()
    publish_ends_at = Input()
    min_reservation_duration = Input()
    max_reservation_duration = Input()
    buffer_time_before = Input()
    buffer_time_after = Input()

    # Booleans
    is_draft = Input()
    is_archived = Input()
    require_adult_reservee = Input()
    require_reservation_handling = Input()
    reservation_block_whole_day = Input()
    can_apply_free_of_charge = Input()
    allow_reservations_without_opening_hours = Input()

    # Enums
    authentication = Input()
    reservation_start_interval = Input()
    reservation_kind = Input()
    reservation_form = Input()

    # List Inputs
    search_terms = Input()

    # Forward many-to-one related
    reservation_unit_type = Input()
    cancellation_rule = Input()
    metadata_set = Input()
    cancellation_terms = Input()
    service_specific_terms = Input()
    pricing_terms = Input()
    payment_terms = Input()

    # Forward many-to-many related
    spaces = Input()
    resources = Input()
    purposes = Input()
    equipments = Input()

    # Reverse one-to-many related
    images = Input(ReservationUnitImageUpdateInput)
    pricings = Input(ReservationUnitPricingUpdateInput)
    access_types = Input(ReservationUnitAccessTypeUpdateInput)
    application_round_time_slots = Input(ApplicationRoundTimeSlotUpdateInput)

    @classmethod
    def __permissions__(
        cls, instance: ReservationUnit, info: GQLInfo[User], input_data: ReservationUnitUpdateData
    ) -> None:
        user = info.context.user
        if not user.permissions.can_manage_unit(instance):
            msg = "No permission to update a reservation unit"
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(
        cls, instance: ReservationUnit, info: GQLInfo[User], input_data: ReservationUnitUpdateData
    ) -> None:
        is_draft = input_data.get("is_draft", instance.is_draft)
        is_archived = input_data.get("is_archived", instance.is_archived)
        min_reservation_duration = input_data.get("min_reservation_duration", instance.min_reservation_duration)
        max_reservation_duration = input_data.get("max_reservation_duration", instance.max_reservation_duration)
        reservation_start_interval = input_data.get("reservation_start_interval", instance.reservation_start_interval)

        validate_reservation_duration(
            min_reservation_duration=min_reservation_duration,
            max_reservation_duration=max_reservation_duration,
            reservation_start_interval=reservation_start_interval,
        )

        cls._validate_pricings(instance, input_data)
        cls._validate_access_types(instance, input_data)
        cls._validate_application_round_time_slots(instance, input_data)
        cls._validate_archival(instance, input_data)

        if not is_draft and not is_archived:
            name_fi = input_data.get("name_fi", instance.name_fi)
            name_sv = input_data.get("name_sv", instance.name_sv)
            name_en = input_data.get("name_en", instance.name_en)
            description_fi = input_data.get("description_fi", instance.description_fi)
            description_sv = input_data.get("description_sv", instance.description_sv)
            description_en = input_data.get("description_en", instance.description_en)

            validate_translations(
                name_fi=name_fi,
                name_sv=name_sv,
                name_en=name_en,
                description_fi=description_fi,
                description_sv=description_sv,
                description_en=description_en,
            )

            spaces = input_data.get("spaces", list(instance.spaces.values_list("pk", flat=True)))
            resources = input_data.get("resources", list(instance.resources.values_list("pk", flat=True)))
            reservation_unit_type = input_data.get("reservation_unit_type", instance.reservation_unit_type_id)
            min_persons = input_data.get("min_persons", instance.min_persons)
            max_persons = input_data.get("max_persons", instance.max_persons)

            validate_for_publish(
                spaces=spaces,
                resources=resources,
                reservation_unit_type=reservation_unit_type,
                min_persons=min_persons,
                max_persons=max_persons,
            )

    @classmethod
    def _validate_archival(
        cls,
        instance: ReservationUnit,
        input_data: ReservationUnitUpdateData,
    ) -> None:
        going_to_be_archived = input_data.get("is_archived", False)

        if instance.is_archived or not going_to_be_archived:
            return

        reservations: ReservationQuerySet = instance.reservations.all()  # type: ignore[assignment]
        future_reservations = reservations.going_to_occur().filter(ends_at__gt=local_datetime())

        if future_reservations.exists():
            msg = "Reservation unit can't be archived if it has any reservations in the future"
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_HAS_FUTURE_RESERVATIONS)

    @classmethod
    def _validate_pricings(  # noqa: PLR0912
        cls,
        instance: ReservationUnit,
        input_data: ReservationUnitUpdateData,
    ) -> None:
        is_draft = input_data.get("is_draft", instance.is_draft)

        today = local_date()
        has_active_pricing = instance.pricings.filter(begins__lte=today).exists()
        dates_seen: set[datetime.date] = set()

        existing_pricings = {pricing.pk: pricing for pricing in instance.pricings.all()}

        input_data["pricings"] = cls.retain_past_and_active_pricings(
            existing_pricings=existing_pricings.values(),
            new_pricings=input_data.get("pricings", []),
        )

        for pricing_data in input_data["pricings"]:
            pk = pricing_data.get("pk")

            # Modifying or picking an existing pricing
            if pk is not None:
                existing_pricing = existing_pricings.get(pk)
                if existing_pricing is None:
                    msg = f"Pricing with primary key {pk!r} doesn't belong to this reservation unit"
                    raise GraphQLValidationError(msg)

                begins = pricing_data.get("begins", existing_pricing.begins)
                highest_price = pricing_data.get("highest_price", existing_pricing.highest_price)
                lowest_price = pricing_data.get("lowest_price", existing_pricing.lowest_price)

                same_begin_date = existing_pricing.begins == begins
                has_changed = len(pricing_data) == 1  # only "pk" in data and nothing else

                if existing_pricing.begins < today and has_changed:
                    msg = "Past or active pricing cannot be changed."
                    raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICING_CANNOT_CHANGE_PAST)

                if existing_pricing.begins == today and not same_begin_date:
                    msg = "Active pricing cannot be moved to another date."
                    raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICING_CANNOT_CHANGE_ACTIVE)

                if begins < today < existing_pricing.begins:
                    msg = "Pricing cannot be moved to the past."
                    raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICING_BEGIN_DATE_IN_PAST)

            # Create new pricing
            else:
                begins = pricing_data.get("begins")
                if begins is None:
                    msg = "'begins' is required for new pricings."
                    raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_MISSING_BEGIN_DATE)

                highest_price = pricing_data.get("highest_price", Decimal(0))
                lowest_price = pricing_data.get("lowest_price", Decimal(0))

            if highest_price < lowest_price:
                msg = "Highest price cannot be less than lowest price."
                raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_INVALID_PRICES)

            if begins in dates_seen:
                msg = "Reservation unit can have only one pricing per date."
                raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_DUPLICATE_DATE)

            dates_seen.add(begins)

            if not has_active_pricing:
                has_active_pricing = begins <= today

        if not has_active_pricing:
            if is_draft:
                return

            msg = "At least one active pricing is required for non-draft reservation units."
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICINGS_NO_ACTIVE_PRICING)

    @classmethod
    def retain_past_and_active_pricings(
        cls,
        existing_pricings: Iterable[ReservationUnitPricing],
        new_pricings: list[ReservationUnitPricingUpdateData],
    ) -> list[ReservationUnitPricingUpdateData]:
        today = local_date()
        updated_pks: set[int] = {data["pk"] for data in new_pricings if "pk" in data}

        for pricing in existing_pricings:
            if today < pricing.begins:
                continue
            if pricing.pk not in updated_pks:
                new_pricings.append(ReservationUnitPricingUpdateData(pk=pricing.pk))

        return new_pricings

    @classmethod
    def _validate_access_types(  # noqa: PLR0912
        cls,
        instance: ReservationUnit,
        input_data: ReservationUnitUpdateData,
    ) -> None:
        is_draft = input_data["is_draft"]

        today = local_date()
        need_to_check_pindora: bool = False
        has_active_access_type = instance.access_types.filter(begin_date__lte=today).exists()

        existing_access_types = {access_type.pk: access_type for access_type in instance.access_types.all()}

        input_data["access_types"] = cls.retain_past_and_active_access_types(
            existing_access_types=existing_access_types.values(),
            new_access_types=input_data.get("access_types", []),
        )

        for access_type_data in input_data["access_types"]:
            pk = access_type_data.get("pk")

            # Modifying or picking an existing access type
            if pk is not None:
                existing_access_type = existing_access_types.get(pk)
                if existing_access_type is None:
                    msg = f"Access type with primary key {pk!r} doesn't belong to this reservation unit"
                    raise GraphQLValidationError(msg)

                access_type = access_type_data.get("access_type", existing_access_type.access_type)
                begin_date = access_type_data.get("begin_date", existing_access_type.begin_date)

                same_begin_date = existing_access_type.begin_date == begin_date
                has_changed = len(access_type_data) == 1  # only "pk" in data and nothing else

                if existing_access_type.begin_date < today and has_changed:
                    msg = "Past or active access type cannot be changed."
                    raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_CANNOT_CHANGE_PAST)

                if existing_access_type.begin_date == today and not same_begin_date:
                    msg = "Active access type cannot be moved to another date."
                    raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_CANNOT_CHANGE_ACTIVE)

                if begin_date < today < existing_access_type.begin_date:
                    msg = "Access type cannot be moved to the past."
                    raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_BEGIN_DATE_IN_PAST)

                if not need_to_check_pindora:
                    need_to_check_pindora = access_type == AccessType.ACCESS_CODE

            # Create new access type
            else:
                access_type = access_type_data.get("access_type")
                if access_type is None:
                    msg = "'accessType' is required for new access types."
                    raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_ACCESS_TYPE)

                begin_date = access_type_data.get("begin_date")
                if begin_date is None:
                    msg = "'beginDate' is required for new access types."
                    raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_BEGIN_DATE)

                ReservationUnitAccessType.validators.validate_new_not_in_past(begin_date)

                if not need_to_check_pindora:
                    need_to_check_pindora = access_type == AccessType.ACCESS_CODE

            if not has_active_access_type:
                has_active_access_type = begin_date <= today

        if not has_active_access_type:
            if is_draft:
                return

            msg = "At least one active access type is required for non-draft reservation units."
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_ACCESS_TYPE_MISSING)

        if need_to_check_pindora:
            try:
                PindoraClient.get_reservation_unit(instance.ext_uuid)
            except ExternalServiceError as error:
                raise GraphQLValidationError(str(error)) from error

    @classmethod
    def retain_past_and_active_access_types(
        cls,
        existing_access_types: Iterable[ReservationUnitAccessType],
        new_access_types: list[ReservationUnitAccessTypeUpdateData],
    ) -> list[ReservationUnitAccessTypeUpdateData]:
        today = local_date()
        updated_pks: set[int] = {data["pk"] for data in new_access_types if "pk" in data}

        for access_type in existing_access_types:
            if today < access_type.begin_date:
                continue
            if access_type.pk not in updated_pks:
                new_access_types.append(ReservationUnitAccessTypeUpdateData(pk=access_type.pk))

        return new_access_types

    @classmethod
    def _validate_application_round_time_slots(
        cls,
        instance: ReservationUnit,
        input_data: ReservationUnitUpdateData,
    ) -> None:
        time_slots = input_data.get("application_round_time_slots", [])

        existing_time_slots = {slot.pk: slot for slot in instance.application_round_time_slots.all()}

        weekdays_seen: set[Weekday] = set()

        for timeslot in time_slots:
            pk = timeslot.get("pk")

            # Modifying or picking an existing time slot
            if pk is not None:
                existing_time_slot = existing_time_slots.get(pk)
                if existing_time_slot is None:
                    msg = f"Time slot with primary key {pk!r} doesn't belong to this reservation unit"
                    raise GraphQLValidationError(msg)

                weekday = timeslot.get("weekday", existing_time_slot.weekday)
                closed = timeslot.get("is_closed", existing_time_slot.is_closed)
                reservable_times = timeslot.get("reservable_times", existing_time_slot.reservable_times)

            # Create new time slot
            else:
                weekday = timeslot.get("weekday")
                if weekday is None:
                    msg = "'weekday' is required for new timeslots."
                    raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_TIME_SLOTS_MISSING_WEEKDAY)

                closed = timeslot.get("is_closed", False)
                reservable_times = timeslot.get("reservable_times", [])

            if closed and len(reservable_times) > 0:
                msg = "Closed timeslots cannot have reservable times."
                raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_TIME_SLOTS_INVALID_DATA)

            if not closed and len(reservable_times) == 0:
                msg = "Open timeslots must have reservable times."
                raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_TIME_SLOTS_INVALID_DATA)

            if weekday in weekdays_seen:
                msg = f"Got multiple timeslots for {weekday.name.capitalize()}."
                raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_TIME_SLOTS_MULTIPLE_WEEKDAYS)

            weekdays_seen.add(weekday)

    @classmethod
    def __after__(cls, instance: ReservationUnit, info: GQLInfo[User], previous_data: dict[str, Any]) -> None:
        was_archived = previous_data.get("is_archived", instance.is_archived)

        cls.update_hauki(instance)

        if instance.is_archived and not was_archived:
            cls.remove_personal_data_and_logs_on_archive(instance)

        instance.actions.update_access_types_for_reservations()

    @classmethod
    def update_hauki(cls, instance: ReservationUnit) -> None:
        # TODO: Why do we update here?
        if instance.origin_hauki_resource is not None:
            HaukiResourceHashUpdater([instance.origin_hauki_resource.id]).run(force_refetch=True)

        if settings.HAUKI_EXPORTS_ENABLED:
            try:
                instance.actions.send_reservation_unit_to_hauki()
            except ExternalServiceError as err:
                msg = "Sending reservation unit as resource to aukiolosovellus failed"
                raise GraphQLValidationError(msg, code=error_codes.HAUKI_EXPORTS_ERROR) from err

    @classmethod
    def remove_personal_data_and_logs_on_archive(cls, instance: ReservationUnit) -> None:
        # Remove PII
        instance.contact_information = ""
        instance.is_draft = True
        instance.save(update_fields=["contact_information", "is_draft"])

        # Remove all logs related to the reservation unit
        LogEntry.objects.get_for_object(instance).delete()


# TODO: Reservation Unit needs to be updated last, due to post_save signals.
#  Verkkokauppa payment product update is triggered by the post_save signal of the ReservationUnit,
#  and requires a paid pricing to already be present in the database.
