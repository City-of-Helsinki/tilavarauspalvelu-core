from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers

from tilavarauspalvelu.models import Reservation, ReservationSeries
from tilavarauspalvelu.tasks import create_statistics_for_reservations_task
from utils.fields.serializer import input_only_field

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import ReservationDetails

__all__ = [
    "ReservationSeriesUpdateSerializer",
]


class ReservationSeriesReservationUpdateSerializer(NestingModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            "name",
            "description",
            "num_persons",
            "working_memo",
            #
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
            "reservee_id",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_is_unregistered_association",
            "reservee_type",
            #
            "billing_first_name",
            "billing_last_name",
            "billing_email",
            "billing_phone",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            #
            "purpose",
            "home_city",
            "age_group",
        ]
        extra_kwargs = {field: {"required": False} for field in fields}


class ReservationSeriesUpdateSerializer(NestingModelSerializer):
    """Update reservation series and its reservation data."""

    instance: ReservationSeries

    reservation_details = ReservationSeriesReservationUpdateSerializer(
        required=False,
        write_only=True,
        validators=[input_only_field],
    )
    skip_reservations = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=True,
        validators=[input_only_field],
    )

    class Meta:
        model = ReservationSeries
        fields = [
            "pk",
            "name",
            "description",
            "age_group",
            "reservation_details",
            "skip_reservations",
        ]
        extra_kwargs = {
            "name": {"required": False},
            "description": {"required": False},
            "age_group": {"required": False},
        }

    def save(self, **kwargs: Any) -> ReservationSeries:
        reservation_details: ReservationDetails = self.initial_data.get("reservation_details", {})
        skip_reservations = self.initial_data.get("skip_reservations", [])

        age_group: int | None = self.validated_data.get("age_group")
        if age_group is not None:
            reservation_details.setdefault("age_group", age_group)

        description: str | None = self.validated_data.get("description")
        if description is not None:
            reservation_details.setdefault("working_memo", description)

        reservations = Reservation.objects.filter(reservation_series=self.instance).exclude(pk__in=skip_reservations)

        with transaction.atomic():
            instance = super().save()
            reservations.update(**reservation_details)

        if settings.SAVE_RESERVATION_STATISTICS:
            create_statistics_for_reservations_task.delay(
                reservation_pks=list(reservations.values_list("pk", flat=True)),
            )

        return instance
