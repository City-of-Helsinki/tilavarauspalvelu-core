from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import IntegerPrimaryKeyField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import DateTimeField, IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import AccessType, PaymentType
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationUnit
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import AnyUser, ReservationCreateData, WSGIRequest


__all__ = [
    "ReservationCreateSerializer",
]


class ReservationCreateSerializer(NestingModelSerializer):
    """Create a tentative reservation before moving to the checkout flow."""

    instance: None

    pk = IntegerField(read_only=True)
    reservation_unit = IntegerPrimaryKeyField(queryset=ReservationUnit.objects, required=True, write_only=True)

    begin = DateTimeField(required=True, write_only=True)
    end = DateTimeField(required=True, write_only=True)

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "reservation_unit",
            "begin",
            "end",
        ]

    def validate(self, data: ReservationCreateData) -> ReservationCreateData:
        reservation_unit = data["reservation_unit"]
        begin = data["begin"].astimezone(DEFAULT_TIMEZONE)
        end = data["end"].astimezone(DEFAULT_TIMEZONE)

        # Endpoint requires users to be logged in
        user: User = self.context["request"].user

        user.validators.validate_is_internal_user_if_ad_user()

        reservation_unit.validators.validate_reservation_unit_is_direct_bookable()
        reservation_unit.validators.validate_reservation_unit_is_published()
        reservation_unit.validators.validate_reservation_unit_is_reservable_at(begin=begin)
        reservation_unit.validators.validate_user_is_adult_if_required(user=user)
        reservation_unit.validators.validate_user_has_not_exceeded_max_reservations(user=user)
        reservation_unit.validators.validate_begin_before_end(begin=begin, end=end)
        reservation_unit.validators.validate_duration_is_allowed(duration=end - begin)
        reservation_unit.validators.validate_reservation_days_before(begin=begin)
        reservation_unit.validators.validate_reservation_unit_is_open(begin=begin, end=end)
        reservation_unit.validators.validate_not_in_open_application_round(begin=begin.date(), end=end.date())
        reservation_unit.validators.validate_reservation_begin_time(begin=begin)
        reservation_unit.validators.validate_no_overlapping_reservations(begin=begin, end=end)

        pricing = reservation_unit.actions.get_active_pricing(by_date=begin.date())

        if pricing is None:
            msg = "No pricing found for the given date."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NO_ACTIVE_PRICING)

        if pricing.highest_price > 0:
            pricing.validators.validate_has_payment_type()

            if pricing.payment_type != PaymentType.ON_SITE:
                reservation_unit.validators.validate_has_payment_product()

        data["sku"] = reservation_unit.sku
        data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begin)
        data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(end)
        data["user"] = user
        data["reservee_used_ad_login"] = getattr(user.id_token, "is_ad_login", False)

        data["price"] = pricing.actions.calculate_reservation_price(duration=end - begin)
        data["unit_price"] = pricing.highest_price
        data["tax_percentage_value"] = pricing.tax_percentage.value
        data["non_subsidised_price"] = data["price"]
        data["access_type"] = reservation_unit.actions.get_access_type_at(begin, default=AccessType.UNRESTRICTED)

        if settings.PREFILL_RESERVATION_WITH_PROFILE_DATA:
            self.prefill_reservation_from_profile(data)

        return data

    def prefill_reservation_from_profile(self, data: ReservationCreateData) -> None:
        request: WSGIRequest = self.context["request"]
        user: AnyUser = request.user
        if user.is_anonymous:
            return

        id_token = user.id_token
        if id_token is None or id_token.is_ad_login:
            return

        try:
            prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session=request.session)
        except ExternalServiceError:
            prefill_info = None
        except Exception as error:  # noqa: BLE001
            msg = "Unexpected error reading profile data"
            SentryLogger.log_exception(error, details=msg, user=user.pk)
            return

        # Primarily use the prefill info directly from the profile, but if it is not available,
        # use the prefill info stored in the session.
        reservation_prefill_info = prefill_info or request.session.get("reservation_prefill_info")
        if reservation_prefill_info is not None:
            data.update({key: value for key, value in reservation_prefill_info.items() if value is not None})

    def create(self, validated_data: ReservationCreateData) -> Reservation:
        with transaction.atomic():
            # Must be able to link reservation unit to the reservation
            reservation_unit: ReservationUnit = validated_data.pop("reservation_unit")
            reservation: Reservation = super().create(validated_data)
            reservation.reservation_units.set([reservation_unit])

        # After creating the reservation, check again if there are any overlapping reservations.
        # This can fail if two reservations are created for reservation units in the same
        # space-resource hierarchy at almost the same time, meaning when we check for overlapping
        # reservations during validation, neither of the reservations are yet created.
        if reservation.actions.overlapping_reservations().exists():
            reservation.delete()
            msg = "Overlapping reservations were created at the same time."
            raise ValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        # Pindora request must succeed, otherwise the reservation is removed.
        # Do this after the second overlapping reservation check, so that we don't need to
        # remove the access code in Pindora from the removed reservation.
        if reservation.access_type == AccessType.ACCESS_CODE:
            try:
                PindoraService.create_access_code(obj=reservation)

            except Exception as error:
                reservation.delete()
                code = error_codes.PINDORA_ERROR if isinstance(error, ExternalServiceError) else None
                raise ValidationError(str(error), code=code) from error

        return reservation
