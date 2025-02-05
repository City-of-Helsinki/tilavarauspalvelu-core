from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.frontend_testing_api.serializers import TestingBaseSerializer
from tilavarauspalvelu.api.frontend_testing_api.viewsets import TestingBaseViewSet
from tilavarauspalvelu.enums import OrderStatus, PaymentType, ReservationStateChoice
from tilavarauspalvelu.models import ReservationMetadataField
from utils.date_utils import local_datetime

from tests.factories import (
    RecurringReservationFactory,
    ReservationMetadataFieldFactory,
    ReservationMetadataSetFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
)
from tests.factories.payment_order import PaymentOrderBuilder
from tests.factories.reservation import ReservationBuilder

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation, ReservationMetadataSet, ReservationUnit


class TestingReservationParamsSerializer(TestingBaseSerializer):
    state = serializers.ChoiceField(choices=ReservationStateChoice, default=ReservationStateChoice.CONFIRMED)
    is_archived = serializers.BooleanField(default=False)
    is_draft = serializers.BooleanField(default=False)
    is_cancellable = serializers.BooleanField(default=False)
    is_paid_reservation = serializers.BooleanField(default=False)
    is_paid_on_site = serializers.BooleanField(default=False)
    is_past = serializers.BooleanField(default=False)
    is_part_of_series = serializers.BooleanField(default=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        state = attrs["state"]
        is_paid_reservation = attrs["is_paid_reservation"]
        is_paid_on_site = attrs["is_paid_on_site"]

        if not is_paid_reservation and (state == ReservationStateChoice.WAITING_FOR_PAYMENT or is_paid_on_site):
            msg = "is_paid_reservation must be True if state is WAITING_FOR_PAYMENT or is_paid_on_site is True"
            raise ValidationError(msg)

        return super().validate(attrs)

    def create(self, validated_data: dict[str, Any]) -> Reservation:
        reservation_unit = self._create_reservation_unit(validated_data)

        # Create Reservation
        begin_datetime = local_datetime() + datetime.timedelta(days=-1 if validated_data["is_past"] else 1)
        reservation = (
            ReservationBuilder()
            .set(
                reservation_units=[reservation_unit],
                begin=begin_datetime,
                end=begin_datetime + datetime.timedelta(hours=2),
            )
            .for_state(validated_data["state"])
            .for_user(self.context["user"])
            .for_reservation_unit(reservation_unit)
            .for_individual()
            .use_reservation_unit_price()
            .create()
        )

        if validated_data["is_paid_reservation"]:
            self._create_payment_order(validated_data, reservation)

        if validated_data["is_part_of_series"]:
            self._create_recurring_reservation(reservation)

        return reservation

    def _create_reservation_unit(self, validated_data: dict[str, Any]) -> ReservationUnit:
        is_cancellable = validated_data["is_cancellable"]
        reservation_unit = ReservationUnitFactory.create(
            is_archived=validated_data["is_archived"],
            is_draft=validated_data["is_draft"],
            require_reservation_handling=validated_data["state"] == ReservationStateChoice.REQUIRES_HANDLING,
            cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(hours=24) if is_cancellable else None,
            min_reservation_duration=datetime.timedelta(hours=1),
            max_reservation_duration=datetime.timedelta(hours=4),
            metadata_set=self._create_metadata_set(),
        )

        if validated_data["is_paid_reservation"]:
            ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)
        else:
            ReservationUnitPricingFactory.create_free(reservation_unit=reservation_unit)

        return reservation_unit

    def _create_metadata_set(self) -> ReservationMetadataSet:
        required_fields = {
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
        }
        supported_fields = {
            "name",
            "reservee_is_unregistered_association",
        } | required_fields

        ReservationMetadataField.objects.bulk_create(
            [ReservationMetadataFieldFactory.build(field_name=field_name) for field_name in supported_fields],
            ignore_conflicts=True,
        )

        return ReservationMetadataSetFactory.create_basic(
            supported_fields=supported_fields,
            required_fields=required_fields,
        )

    def _create_payment_order(self, validated_data: dict[str, Any], reservation: Reservation) -> None:
        order_builder = PaymentOrderBuilder().for_reservation(reservation=reservation).for_mock_order(reservation)
        if validated_data["is_paid_on_site"]:
            order_builder.set(payment_type=PaymentType.ON_SITE)
            if validated_data["state"] == ReservationStateChoice.CONFIRMED:
                order_builder.set(status=OrderStatus.PAID_MANUALLY)
        order_builder.create()

    def _create_recurring_reservation(self, reservation: Reservation) -> None:
        recurring_reservation = RecurringReservationFactory.create(
            reservation_unit=reservation.reservation_units.first(),
            user=self.context["user"],
            begin_date=(reservation.begin - datetime.timedelta(days=7)).date(),
            end_date=(reservation.end + datetime.timedelta(days=7)).date(),
            end_time=reservation.begin.time(),
            begin_time=reservation.end.time(),
            weekdays=f"{reservation.begin.weekday()}",
        )
        reservation.recurring_reservation = recurring_reservation
        reservation.save()


class TestingReservationViewSet(TestingBaseViewSet):
    params_serializer_class = TestingReservationParamsSerializer
