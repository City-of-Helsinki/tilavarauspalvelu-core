from django.conf import settings
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, PaymentType
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.helsinki_profile.typing import ReservationPrefillInfo
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationUnit, User
from tilavarauspalvelu.typing import ReservationCreateData, error_codes
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationCreateMutation",
]


class ReservationCreateMutation(MutationType[Reservation], kind="create"):
    """Create a tentative reservation before moving to the checkout flow."""

    reservation_unit = Input(ReservationUnit, required=True)
    begins_at = Input(required=True)
    ends_at = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: ReservationCreateData) -> Reservation:  # noqa: PLR0915
        user: User = info.context.user
        if not user.is_authenticated:
            msg = "Must be authenticated to create a reservation."
            raise GraphQLPermissionError(msg)

        begins_at = input_data["begins_at"].astimezone(DEFAULT_TIMEZONE)
        ends_at = input_data["ends_at"].astimezone(DEFAULT_TIMEZONE)

        user.validators.validate_is_internal_user_if_ad_user()

        reservation_unit = input_data["reservation_unit"]

        reservation_unit.validators.validate_reservation_unit_is_direct_bookable()
        reservation_unit.validators.validate_reservation_unit_is_published()
        reservation_unit.validators.validate_reservation_unit_is_reservable_at(begin=begins_at)
        reservation_unit.validators.validate_user_is_adult_if_required(user=user)
        reservation_unit.validators.validate_user_has_not_exceeded_max_reservations(user=user)
        reservation_unit.validators.validate_begin_before_end(begin=begins_at, end=ends_at)
        reservation_unit.validators.validate_duration_is_allowed(duration=ends_at - begins_at)
        reservation_unit.validators.validate_reservation_days_before(begin=begins_at)
        reservation_unit.validators.validate_reservation_unit_is_open(begin=begins_at, end=ends_at)
        reservation_unit.validators.validate_not_in_open_application_round(begin=begins_at.date(), end=ends_at.date())
        reservation_unit.validators.validate_reservation_begin_time(begin=begins_at)
        reservation_unit.validators.validate_no_overlapping_reservations(begins_at=begins_at, ends_at=ends_at)

        pricing = reservation_unit.actions.get_active_pricing(by_date=begins_at.date())
        if pricing is None:
            msg = "No pricing found for the given date."
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_NO_ACTIVE_PRICING)

        if pricing.highest_price > 0:
            pricing.validators.validate_has_payment_type()
            if pricing.payment_type != PaymentType.ON_SITE:
                reservation_unit.validators.validate_has_payment_product()

        buffer_time_before = reservation_unit.actions.get_actual_before_buffer(begins_at)
        buffer_time_after = reservation_unit.actions.get_actual_after_buffer(ends_at)

        reservee_used_ad_login = False
        if user.id_token is not None:
            reservee_used_ad_login = user.id_token.is_ad_login

        price = pricing.actions.calculate_reservation_price(duration=ends_at - begins_at)
        access_type = reservation_unit.actions.get_access_type_at(begins_at, default=AccessType.UNRESTRICTED)

        instance = Reservation()
        instance.reservation_unit = reservation_unit
        instance.begins_at = begins_at
        instance.ends_at = ends_at
        instance.user = user
        instance.buffer_time_before = buffer_time_before
        instance.buffer_time_after = buffer_time_after
        instance.reservee_used_ad_login = reservee_used_ad_login
        instance.price = price
        instance.unit_price = pricing.highest_price
        instance.tax_percentage_value = pricing.tax_percentage.value
        instance.non_subsidised_price = price
        instance.access_type = access_type

        if settings.PREFILL_RESERVATION_WITH_PROFILE_DATA:
            prefill_info = cls.get_profile_prefill_info(info) or {}
            for key, value in prefill_info.items():
                if value is not None:
                    setattr(instance, key, value)

        instance.save()

        # After creating the reservation, check again if there are any overlapping reservations.
        # This can fail if two reservations are created for reservation units in the same
        # space-resource hierarchy at almost the same time, meaning when we check for overlapping
        # reservations during validation, neither of the reservations are yet created.
        if instance.actions.overlapping_reservations().exists():
            instance.delete()
            msg = "Overlapping reservations were created at the same time."
            raise GraphQLValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        cls.handle_access_code(instance)
        return instance

    @classmethod
    def handle_access_code(cls, instance: Reservation) -> None:
        # Pindora request must succeed, otherwise the reservation is removed.
        # Do this after the second overlapping reservation check, so that we don't need to
        # remove the access code in Pindora from the removed reservation.
        if instance.access_type != AccessType.ACCESS_CODE:
            return

        try:
            PindoraService.create_access_code(obj=instance)
        except ExternalServiceError as error:
            instance.delete()
            raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error
        except Exception as error:
            instance.delete()
            raise GraphQLValidationError(str(error)) from error

    @classmethod
    def get_profile_prefill_info(cls, info: GQLInfo[User]) -> ReservationPrefillInfo | None:
        user = info.context.user
        if user.is_anonymous:
            return None

        id_token = user.id_token
        if id_token is None or id_token.is_ad_login:
            return None

        try:
            prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session=info.context.session)
        except ExternalServiceError:
            prefill_info = None
        except Exception as error:  # noqa: BLE001
            msg = "Unexpected error reading profile data"
            SentryLogger.log_exception(error, details=msg, user=user.pk)
            return None

        # Primarily use the prefill info directly from the profile, but if it is not available,
        # use the prefill info stored in the session.
        return prefill_info or info.context.session.get("reservation_prefill_info")
