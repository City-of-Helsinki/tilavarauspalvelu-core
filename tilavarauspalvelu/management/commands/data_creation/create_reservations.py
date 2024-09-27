# ruff: noqa: S311

import math
import random
from datetime import datetime, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import CustomerTypeChoice, ReservationStateChoice
from tilavarauspalvelu.models import (
    AgeGroup,
    City,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataField,
    ReservationMetadataSet,
    ReservationPurpose,
    ReservationUnit,
    User,
)
from utils.date_utils import local_start_of_day

from .utils import FieldCombination, SetName, faker_fi, weighted_choice, with_logs

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models import ReservationUnitPricing


@with_logs()
def _create_reservations(  # NOSONAR (python:S3776)
    user: User,
    reservation_units: list[ReservationUnit],
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cancel_reasons: list[ReservationCancelReason],
    deny_reasons: list[ReservationDenyReason],
    cities: list[City],
) -> list[Reservation]:
    # Pick out the through model for the many-to-many relationship and use if for bulk creation
    ThroughModel: type[models.Model] = Reservation.reservation_unit.through  # noqa: N806

    reservations: list[Reservation] = []
    through_models: list[models.Model] = []

    for reservation_unit in reservation_units:
        start_date = local_start_of_day() + timedelta(hours=4)
        # 1 out of 10 reservations are busy.
        # A busy reservation unit contains 100 reservations instead of 10.
        busy = weighted_choice([False, True], weights=[10, 1])
        number = 100 if busy else 20
        min_interval = 1 if busy else 5
        max_interval = 3 if busy else 10
        if busy:
            reservation_unit.name_fi = f"{reservation_unit.name_fi} (kiireinen)"
            reservation_unit.name_sv = f"{reservation_unit.name_sv} (upptagen)"
            reservation_unit.name_en = f"{reservation_unit.name_en} (busy)"
            reservation_unit.save()

        for i in range(number):
            persons = random.randint(reservation_unit.min_persons, reservation_unit.max_persons)
            min_hours = math.ceil(reservation_unit.min_reservation_duration.total_seconds() / 3600)
            max_hours = math.ceil(reservation_unit.max_reservation_duration.total_seconds() / 3600)

            # Create reservations every 5-10 hours (1-3 hours if busy).
            begin = start_date + timedelta(hours=random.randint(min_interval, max_interval))

            # If the reservation would go over to the next day, create it on the next day instead.
            duration: int = random.choice(range(min_hours, max_hours))
            if begin.hour + duration >= 24:
                begin = begin.replace(hour=random.randint(6, 10)) + timedelta(days=1)

            end = start_date = begin + timedelta(hours=duration)

            state = ReservationStateChoice.CREATED
            applying_for_free_of_charge = weighted_choice([False, True], weights=[10, 1])
            free_of_charge_reason: str = ""
            confirmed_at: datetime | None = begin
            handled_at: datetime | None = None

            pricing: ReservationUnitPricing = random.choice(list(reservation_unit.pricings.all()))
            if pricing.highest_price != Decimal("0") and applying_for_free_of_charge:
                state = ReservationStateChoice.REQUIRES_HANDLING
                free_of_charge_reason = faker_fi.sentence()
                confirmed_at = None
                handled_at = begin

            deny_reason: ReservationDenyReason | None = None
            cancel_reason = weighted_choice([None, random.choice(cancel_reasons)], weights=[10, 1])
            if cancel_reason is None:
                deny_reason = weighted_choice([None, random.choice(deny_reasons)], weights=[10, 1])
                if deny_reason is not None:
                    state = ReservationStateChoice.DENIED
                    free_of_charge_reason = faker_fi.sentence()
                    confirmed_at = None
                    handled_at = begin
            else:
                state = ReservationStateChoice.CANCELLED

            reservee_organisation_name: str = ""
            reservee_id: str = ""
            reservee_is_unregistered_association: bool = False

            reservee_type: str = random.choice(CustomerTypeChoice.values)
            if reservee_type == CustomerTypeChoice.BUSINESS:
                reservee_organisation_name = faker_fi.company()
                reservee_id = faker_fi.company_business_id()
            elif reservee_type == CustomerTypeChoice.NONPROFIT:
                reservee_organisation_name = faker_fi.company()
                reservee_is_unregistered_association = random.choice([True, False])
                if not reservee_is_unregistered_association:
                    reservee_id = faker_fi.company_business_id()

            reservation = Reservation(
                age_group=random.choice(age_groups),
                applying_for_free_of_charge=applying_for_free_of_charge,
                begin=begin,
                billing_address_city=faker_fi.city(),
                billing_address_street=faker_fi.street_name(),
                billing_address_zip=faker_fi.postcode(),
                billing_email=faker_fi.email(),
                billing_first_name=user.first_name,
                billing_last_name=user.last_name,
                billing_phone=faker_fi.phone_number(),
                buffer_time_after=timedelta(hours=random.choice(range(2))),
                buffer_time_before=timedelta(hours=random.choice(range(2))),
                cancel_reason=cancel_reason,
                confirmed_at=confirmed_at,
                deny_reason=deny_reason,
                description=faker_fi.sentence(),
                home_city=random.choice(cities),
                end=end,
                free_of_charge_reason=free_of_charge_reason,
                handled_at=handled_at,
                name=f"Reservation {i}",
                num_persons=persons,
                price=pricing.highest_price,
                purpose=random.choice(reservation_purposes),
                reservee_address_city=faker_fi.city(),
                reservee_address_street=faker_fi.street_name(),
                reservee_address_zip=faker_fi.postcode(),
                reservee_email=faker_fi.email(),
                reservee_first_name=user.first_name,
                reservee_id=reservee_id,
                reservee_is_unregistered_association=reservee_is_unregistered_association,
                reservee_language="fi",
                reservee_last_name=user.last_name,
                reservee_organisation_name=reservee_organisation_name,
                reservee_phone=faker_fi.phone_number(),
                reservee_type=reservee_type,
                state=state,
                tax_percentage_value=pricing.tax_percentage.value,
                user=user,
            )
            reservations.append(reservation)

            through = ThroughModel(reservation=reservation, reservationunit=reservation_unit)
            through_models.append(through)

    reservations = Reservation.objects.bulk_create(reservations)
    ThroughModel.objects.bulk_create(through_models)

    return reservations


@with_logs()
def _create_reservation_metadata_sets() -> dict[SetName, ReservationMetadataSet]:
    metadata_fields = {field.field_name: field for field in _create_metadata_fields()}

    field_combinations: dict[SetName, FieldCombination] = {
        SetName.set_1: FieldCombination(
            supported=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_email",
                "reservee_phone",
            ],
            required=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_email",
                "reservee_phone",
            ],
        ),
        SetName.set_2: FieldCombination(
            supported=[
                "description",
                "num_persons",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "description",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_3: FieldCombination(
            supported=[
                "description",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "description",
                "home_city",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_4: FieldCombination(
            supported=[
                "age_group",
                "description",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "age_group",
                "description",
                "home_city",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_5: FieldCombination(
            supported=[
                "applying_for_free_of_charge",
                "description",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "description",
                "home_city",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_6: FieldCombination(
            supported=[
                "age_group",
                "applying_for_free_of_charge",
                "description",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[
                "age_group",
                "description",
                "home_city",
                "num_persons",
                "purpose",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
        ),
        SetName.set_all: FieldCombination(
            supported=[
                "age_group",
                "applying_for_free_of_charge",
                "billing_address_city",
                "billing_address_street",
                "billing_address_zip",
                "billing_email",
                "billing_first_name",
                "billing_last_name",
                "billing_phone",
                "description",
                "free_of_charge_reason",
                "home_city",
                "name",
                "num_persons",
                "purpose",
                "reservee_address_city",
                "reservee_address_street",
                "reservee_address_zip",
                "reservee_email",
                "reservee_first_name",
                "reservee_id",
                "reservee_is_unregistered_association",
                "reservee_last_name",
                "reservee_organisation_name",
                "reservee_phone",
                "reservee_type",
            ],
            required=[],
        ),
    }

    metadata_sets: list[ReservationMetadataSet] = []
    for name in field_combinations:
        reservation_metadata_set = ReservationMetadataSet(name=name.value)
        metadata_sets.append(reservation_metadata_set)

    metadata_sets: dict[SetName, ReservationMetadataSet] = {
        SetName(metadata_set.name): metadata_set
        for metadata_set in ReservationMetadataSet.objects.bulk_create(metadata_sets)
    }

    zipped: zip[tuple[ReservationMetadataSet, tuple[SetName, FieldCombination]]]
    zipped = zip(metadata_sets.values(), field_combinations.items(), strict=True)

    for metadata_set, (_, fields) in zipped:
        supported = [metadata_fields[field] for field in fields.supported]
        required = [metadata_fields[field] for field in fields.required]
        metadata_set.supported_fields.add(*supported)
        metadata_set.required_fields.add(*required)

    return metadata_sets


@with_logs()
def _create_metadata_fields() -> list[ReservationMetadataField]:
    form_fields = [
        "reservee_type",
        "reservee_first_name",
        "reservee_last_name",
        "reservee_organisation_name",
        "reservee_phone",
        "reservee_email",
        "reservee_id",
        "reservee_is_unregistered_association",
        "reservee_address_street",
        "reservee_address_city",
        "reservee_address_zip",
        "billing_first_name",
        "billing_last_name",
        "billing_phone",
        "billing_email",
        "billing_address_street",
        "billing_address_city",
        "billing_address_zip",
        "home_city",
        "age_group",
        "applying_for_free_of_charge",
        "free_of_charge_reason",
        "name",
        "description",
        "num_persons",
        "purpose",
    ]

    metadata_fields: list[ReservationMetadataField] = []
    for field_name in form_fields:
        field = ReservationMetadataField(field_name=field_name)
        metadata_fields.append(field)

    ReservationMetadataField.objects.bulk_create(
        metadata_fields,
        update_conflicts=True,
        update_fields=["field_name"],
        unique_fields=["field_name"],
    )
    # Re-fetching is required to get the primary keys after 'update_conflicts':
    # https://docs.djangoproject.com/en/4.2/ref/models/querysets/#bulk-create
    return list(ReservationMetadataField.objects.filter(field_name__in=form_fields))


@with_logs()
def _create_reservation_purposes(*, number: int = 10) -> list[ReservationPurpose]:
    reservation_purposes: list[ReservationPurpose] = []
    for i in range(number):
        reservation_purpose = ReservationPurpose(
            name=f"Reservation Purpose {i}",
            name_fi=f"Reservation Purpose {i}",
            name_sv=f"Reservation Purpose {i}",
            name_en=f"Reservation Purpose {i}",
        )
        reservation_purposes.append(reservation_purpose)

    return ReservationPurpose.objects.bulk_create(reservation_purposes)


@with_logs()
def _create_cancel_reasons(*, number: int = 10) -> list[ReservationCancelReason]:
    cancel_reasons: list[ReservationCancelReason] = []
    for i in range(number):
        cancel_reason = ReservationCancelReason(
            reason=f"Reservation Cancel Reason {i}",
            reason_fi=f"Reservation Cancel Reason {i}",
            reason_sv=f"Reservation Cancel Reason {i}",
            reason_en=f"Reservation Cancel Reason {i}",
        )
        cancel_reasons.append(cancel_reason)

    return ReservationCancelReason.objects.bulk_create(cancel_reasons)


@with_logs()
def _create_deny_reasons(*, number: int = 10) -> list[ReservationDenyReason]:
    deny_reasons: list[ReservationDenyReason] = []
    for i in range(number):
        deny_reason = ReservationDenyReason(
            reason=f"Reservation Deny Reason {i}",
            reason_fi=f"Reservation Deny Reason {i}",
            reason_sv=f"Reservation Deny Reason {i}",
            reason_en=f"Reservation Deny Reason {i}",
        )
        deny_reasons.append(deny_reason)

    return ReservationDenyReason.objects.bulk_create(deny_reasons)
