import datetime
from decimal import Decimal

from auditlog.models import LogEntry
from django.conf import settings
from django.db import transaction
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError
from undine.utils.model_utils import (
    get_bulk_create_kwargs,
    get_save_update_fields,
    use_delete_signals,
    use_save_signals,
)

from tilavarauspalvelu.api.graphql.types.reservation_unit.mutations.validators import (
    validate_for_publish,
    validate_reservation_duration,
    validate_translations,
)
from tilavarauspalvelu.enums import AccessType, Weekday
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tilavarauspalvelu.models import (
    ApplicationRoundTimeSlot,
    Equipment,
    Purpose,
    ReservationMetadataSet,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitPricing,
    ReservationUnitType,
    Resource,
    Space,
    TaxPercentage,
    TermsOfUse,
)
from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet
from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
from tilavarauspalvelu.typing import (
    ApplicationRoundTimeSlotUpdateData,
    ReservationUnitAccessTypeUpdateData,
    ReservationUnitImageUpdateData,
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
    tax_percentage = Input(TaxPercentage)


class ReservationUnitAccessTypeUpdateInput(MutationType[ReservationUnitAccessType], kind="related"):
    pk = Input()
    access_type = Input()
    begin_date = Input()


class ApplicationRoundTimeSlotUpdateInput(MutationType[ApplicationRoundTimeSlot], kind="related"):
    pk = Input()
    weekday = Input()
    is_closed = Input()
    reservable_times = Input(list[TimeSlot])


class ReservationUnitUpdateMutation(MutationType[ReservationUnit], kind="update"):
    """Update a ReservationUnit."""

    pk = Input(required=True)

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
    reservation_unit_type = Input(ReservationUnitType)
    cancellation_rule = Input(ReservationUnitCancellationRule)
    metadata_set = Input(ReservationMetadataSet)
    cancellation_terms = Input(TermsOfUse)
    service_specific_terms = Input(TermsOfUse)
    pricing_terms = Input(TermsOfUse)
    payment_terms = Input(TermsOfUse)

    # Forward many-to-many related
    spaces = Input(Space)
    resources = Input(Resource)
    purposes = Input(Purpose)
    equipments = Input(Equipment)

    # Reverse one-to-many related
    images = Input(ReservationUnitImageUpdateInput)
    pricings = Input(ReservationUnitPricingUpdateInput)
    access_types = Input(ReservationUnitAccessTypeUpdateInput)
    application_round_time_slots = Input(ApplicationRoundTimeSlotUpdateInput)

    @classmethod
    def __filter_queryset__(cls, queryset: ReservationUnitQuerySet, info: GQLInfo) -> ReservationUnitQuerySet:
        # Allow returning archived reservation units from this mutation
        return queryset

    @classmethod
    def __mutate__(  # noqa: PLR0915,PLR0912
        cls,
        instance: ReservationUnit,
        info: GQLInfo,
        input_data: ReservationUnitUpdateData,
    ) -> ReservationUnit:
        user = info.context.user
        if not user.permissions.can_manage_unit(instance.unit):
            msg = "No permission to update a reservation unit"
            raise GraphQLPermissionError(msg)

        if not input_data.get("name_fi", instance.name_fi).strip():
            msg = "This field cannot be blank."
            raise GraphQLValidationError(msg)

        is_draft = input_data.get("is_draft", instance.is_draft)
        is_archived = input_data.get("is_archived", instance.is_archived)
        min_reservation_duration = input_data.get("min_reservation_duration", instance.min_reservation_duration)
        max_reservation_duration = input_data.get("max_reservation_duration", instance.max_reservation_duration)
        reservation_start_interval = input_data.get("reservation_start_interval", instance.reservation_start_interval)

        has_spaces = "spaces" in input_data
        has_resources = "resources" in input_data
        has_purposes = "purposes" in input_data
        has_equipments = "equipments" in input_data

        spaces = input_data.get("spaces") or []
        resources = input_data.get("resources") or []
        purposes = input_data.get("purposes") or []
        equipments = input_data.get("equipments") or []

        has_images = "images" in input_data
        has_pricings = "pricings" in input_data
        has_access_types = "access_types" in input_data
        has_application_round_time_slots = "application_round_time_slots" in input_data

        images = input_data.get("images") or []
        pricings = input_data.get("pricings") or []
        access_types = input_data.get("access_types") or []
        application_round_time_slots = input_data.get("application_round_time_slots") or []

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

            reservation_unit_type = input_data.get("reservation_unit_type", instance.reservation_unit_type)
            min_persons = input_data.get("min_persons", instance.min_persons)
            max_persons = input_data.get("max_persons", instance.max_persons)

            if not has_spaces:
                spaces = list(instance.spaces.all())
            if not has_resources:
                resources = list(instance.resources.all())

            validate_for_publish(
                spaces=spaces,
                resources=resources,
                reservation_unit_type=reservation_unit_type,
                min_persons=min_persons,
                max_persons=max_persons,
            )

        was_archived = instance.is_archived

        cls._remove_to_many_fields(input_data)

        with transaction.atomic():
            # Verkkokauppa payment product update is triggered by the 'post_save' signal of the ReservationUnit,
            # and requires a paid pricing to already be present in the database.
            if has_pricings:
                cls.update_pricings(instance, pricings)

            for key, value in input_data.items():
                setattr(instance, key, value)

            update_fields = get_save_update_fields(instance, *set(input_data))
            instance.save(update_fields=update_fields)

            if has_spaces:
                instance.spaces.set(spaces)
            if has_resources:
                instance.resources.set(resources)
            if has_purposes:
                instance.purposes.set(purposes)
            if has_equipments:
                instance.equipments.set(equipments)

            if has_images:
                cls.update_images(instance, images)
            if has_access_types:
                cls.update_access_types(instance, access_types)
            if has_application_round_time_slots:
                cls.update_application_round_time_slots(instance, application_round_time_slots)

            if instance.is_archived and not was_archived:
                cls.remove_personal_data_and_logs_on_archive(instance)

            instance.actions.update_access_types_for_reservations()

        cls.update_hauki(instance)

        return instance

    @classmethod
    def _remove_to_many_fields(cls, input_data: ReservationUnitUpdateData) -> None:
        to_many_fields = [
            "spaces",
            "resources",
            "purposes",
            "equipments",
            "images",
            "pricings",
            "access_types",
            "application_round_time_slots",
        ]
        for key in to_many_fields:
            input_data.pop(key, None)

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
    def _validate_pricings(
        cls,
        instance: ReservationUnit,
        input_data: ReservationUnitUpdateData,
    ) -> None:
        is_draft = input_data.get("is_draft", instance.is_draft)
        pricings = input_data.get("pricings", [])

        today = local_date()
        has_active_pricing = instance.pricings.filter(begins__lte=today).exists()
        dates_seen: set[datetime.date] = set()

        existing = {pricing.pk: pricing for pricing in instance.pricings.all()}
        dates_seen.update(pricing.begins for pricing in existing.values() if pricing.begins <= today)

        for pricing_data in pricings:
            pk = pricing_data.get("pk")

            # Modifying or picking an existing pricing
            if pk is not None:
                existing_pricing = existing.get(pk)
                if existing_pricing is None:
                    msg = f"Pricing with primary key {pk!r} doesn't belong to this reservation unit"
                    raise GraphQLValidationError(msg)

                # Date might have been changed, we'll add the new date back.
                dates_seen.discard(existing_pricing.begins)

                begins = pricing_data.get("begins", existing_pricing.begins)
                highest_price = pricing_data.get("highest_price", existing_pricing.highest_price)
                lowest_price = pricing_data.get("lowest_price", existing_pricing.lowest_price)

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
    def _validate_access_types(  # noqa: PLR0912,PLR0915
        cls,
        instance: ReservationUnit,
        input_data: ReservationUnitUpdateData,
    ) -> None:
        is_draft = input_data.get("is_draft", instance.is_draft)
        access_types = input_data.get("access_types", [])

        today = local_date()
        need_to_check_pindora: bool = False
        has_active_access_type = instance.access_types.filter(begin_date__lte=today).exists()
        dates_seen: set[datetime.date] = set()

        existing = {access_type.pk: access_type for access_type in instance.access_types.all()}
        dates_seen.update(ac.begin_date for ac in existing.values() if ac.begin_date <= today)

        for access_type_data in access_types:
            pk = access_type_data.get("pk")

            # Modifying or picking an existing access type
            if pk is not None:
                existing_access_type = existing.get(pk)
                if existing_access_type is None:
                    msg = f"Access type with primary key {pk!r} doesn't belong to this reservation unit"
                    raise GraphQLValidationError(msg)

                # Date might have been changed, we'll add the new date back.
                dates_seen.discard(existing_access_type.begin_date)

                access_type = access_type_data.get("access_type", existing_access_type.access_type)
                begin_date = access_type_data.get("begin_date", existing_access_type.begin_date)

                same_begin_date = existing_access_type.begin_date == begin_date
                same_access_type = existing_access_type.access_type == access_type

                if existing_access_type.begin_date < today and not (same_begin_date and same_access_type):
                    msg = "Past or active access type cannot be changed."
                    raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_CANNOT_CHANGE_PAST)

                if existing_access_type.begin_date == today and not same_begin_date:
                    msg = "Active access type cannot be moved to another date."
                    raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_CANNOT_CHANGE_ACTIVE)

                if begin_date < today < existing_access_type.begin_date:
                    msg = "Access type cannot be moved to the past."
                    raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_BEGIN_DATE_IN_PAST)

                if not need_to_check_pindora:
                    need_to_check_pindora = not same_access_type and access_type == AccessType.ACCESS_CODE

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

            if begin_date in dates_seen:
                msg = "Reservation unit can have only one access type per date."
                raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_ACCESS_TYPE_DUPLICATE_DATE)

            dates_seen.add(begin_date)

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

            except PindoraNotFoundError as err:
                raise GraphQLValidationError(str(err), code=error_codes.RESERVATION_UNIT_NOT_FOUND_IN_PINDORA) from err

            except ExternalServiceError as err:
                raise GraphQLValidationError(str(err)) from err

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

                reservable_times = timeslot.get("reservable_times")
                if reservable_times is None:
                    reservable_times = [
                        TimeSlot(
                            begin=datetime.time.fromisoformat(existing["begin"]),
                            end=datetime.time.fromisoformat(existing["end"]),
                        )
                        for existing in existing_time_slot.reservable_times
                    ]

            # Create new time slot
            else:
                weekday = timeslot.get("weekday")
                if weekday is None:
                    msg = "'weekday' is required for new timeslots."
                    raise GraphQLValidationError(msg, code=error_codes.APPLICATION_ROUND_TIME_SLOTS_MISSING_WEEKDAY)

                closed = timeslot.get("is_closed", False)
                reservable_times = timeslot.get("reservable_times", [])

            validate_reservable_times_begin_end(reservable_times)
            validate_reservable_times_overlap(reservable_times)

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
    def update_images(cls, instance: ReservationUnit, images_data: list[ReservationUnitImageUpdateData]) -> None:
        pks: list[int] = []
        images: list[ReservationUnitImage] = []
        fields: set[str] = {name for field in images_data for name in field}
        fields.add("reservation_unit")

        for data in images_data:
            if "pk" in data:
                pks.append(data["pk"])
                # If only pk selected, leave as is
                if len(data) == 1:
                    continue

            images.append(ReservationUnitImage(reservation_unit=instance, **data))

        qs = instance.images.all().exclude(pk__in=pks)
        instances = list(qs)
        with use_delete_signals(ReservationUnitImage, instances=instances):
            qs.delete()

        kwargs = get_bulk_create_kwargs(ReservationUnitImage, *fields)
        with use_save_signals(ReservationUnitImage, instances=images, update_fields=kwargs.update_fields):
            ReservationUnitImage.objects.bulk_create(images, **kwargs)

    @classmethod
    def update_pricings(cls, instance: ReservationUnit, pricings_data: list[ReservationUnitPricingUpdateData]) -> None:
        pks: list[int] = []
        pricings: list[ReservationUnitPricing] = []
        fields: set[str] = {name for field in pricings_data for name in field}
        fields.add("reservation_unit")

        for data in pricings_data:
            if "pk" in data:
                pks.append(data["pk"])
                # If only pk selected, leave as is
                if len(data) == 1:
                    continue

            pricings.append(ReservationUnitPricing(reservation_unit=instance, **data))

        # Delete future pricings that are not in the payload.
        # Past or Active pricings can not be deleted.
        qs = instance.pricings.filter(begins__gt=local_date()).exclude(pk__in=pks)
        instances = list(qs)
        with use_delete_signals(ReservationUnitPricing, instances=instances):
            qs.delete()

        kwargs = get_bulk_create_kwargs(ReservationUnitPricing, *fields)
        with use_save_signals(ReservationUnitPricing, instances=pricings, update_fields=kwargs.update_fields):
            ReservationUnitPricing.objects.bulk_create(pricings, **kwargs)

    @classmethod
    def update_access_types(
        cls,
        instance: ReservationUnit,
        access_types_data: list[ReservationUnitAccessTypeUpdateData],
    ) -> None:
        pks: list[int] = []
        access_types: list[ReservationUnitAccessType] = []
        fields: set[str] = {name for field in access_types_data for name in field}
        fields.add("reservation_unit")

        for data in access_types_data:
            if "pk" in data:
                pks.append(data["pk"])
                # If only pk selected, leave as is
                if len(data) == 1:
                    continue

            access_types.append(ReservationUnitAccessType(reservation_unit=instance, **data))

        # Delete future access types that are not in the payload.
        # Past or active access types should not be deleted.
        qs = instance.access_types.filter(begin_date__gt=local_date()).exclude(pk__in=pks)
        instances = list(qs)
        with use_delete_signals(ReservationUnitAccessType, instances=instances):
            qs.delete()

        kwargs = get_bulk_create_kwargs(ReservationUnitAccessType, *fields)
        with use_save_signals(ReservationUnitAccessType, instances=access_types, update_fields=kwargs.update_fields):
            ReservationUnitAccessType.objects.bulk_create(access_types, **kwargs)

    @classmethod
    def update_application_round_time_slots(
        cls,
        instance: ReservationUnit,
        application_round_time_slots_data: list[ApplicationRoundTimeSlotUpdateData],
    ) -> None:
        pks: list[int] = []
        time_slots: list[ApplicationRoundTimeSlot] = []
        fields: set[str] = {name for field in application_round_time_slots_data for name in field}
        fields.add("reservation_unit")

        for data in application_round_time_slots_data:
            if "pk" in data:
                pks.append(data["pk"])
                # If only pk selected, leave as is
                if len(data) == 1:
                    continue

            time_slots.append(ApplicationRoundTimeSlot(reservation_unit=instance, **data))

        qs = instance.application_round_time_slots.all().exclude(pk__in=pks)
        instances = list(qs)
        with use_delete_signals(ApplicationRoundTimeSlot, instances=instances):
            qs.delete()

        kwargs = get_bulk_create_kwargs(ApplicationRoundTimeSlot, *fields)
        with use_save_signals(ApplicationRoundTimeSlot, instances=time_slots, update_fields=kwargs.update_fields):
            ApplicationRoundTimeSlot.objects.bulk_create(time_slots, **kwargs)

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
