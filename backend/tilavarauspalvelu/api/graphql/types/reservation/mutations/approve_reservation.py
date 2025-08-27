import datetime
from decimal import Decimal

from django.conf import settings
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, OrderStatus, PaymentType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.typing import ReservationApproveData, error_codes
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationApproveMutation",
]


class ReservationApproveMutation(MutationType[Reservation], kind="update"):
    """Approve a reservation during handling."""

    pk = Input(required=True)
    price = Input(required=True)
    handling_details = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: ReservationApproveData) -> Reservation:
        user = info.context.user
        if not user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        ):
            msg = "No permission to approve reservation."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_reservation_state_allows_approving()

        new_price = input_data.get("price", instance.price)
        if new_price and settings.PAYMENT_ORDERS_FOR_HANDLED_RESERVATIONS_ENABLED:
            cls.handle_payment_order(instance, new_price=new_price)

        instance.price = new_price
        instance.handling_details = input_data.get("handling_details", instance.handling_details)
        instance.handled_at = local_datetime()
        instance.state = ReservationStateChoice.CONFIRMED
        instance.save()

        cls.handle_access_code(instance)
        cls.send_email(instance)

        return instance

    @classmethod
    def handle_payment_order(cls, instance: Reservation, *, new_price: Decimal) -> None:
        now = local_datetime()
        begins_at = instance.begins_at.astimezone(DEFAULT_TIMEZONE)
        three_days_from_now = now + datetime.timedelta(days=3)
        one_hour_before_begin = begins_at - datetime.timedelta(hours=1)
        begins_soon = begins_at - now < datetime.timedelta(hours=2)

        should_delete_previous_payment_order = False

        # In case reservation is approved -> set back to handled -> approved, there might be an order already.
        # In this case, this order might be in one of the following states:
        # 1. Paid in webshop
        #   - Must reuse the same order, so they cannot have different prices.
        #   - Since reusing the same order, we skip rest of the handling.
        # 2. Paid on site
        #   - No payment has been made yet, so we can replace it.
        # 3. Refunded / Cancelled / Expired
        #   - Should be handled, so we can be replace it.
        if hasattr(instance, "payment_order"):
            payment_order = instance.payment_order

            paid_in_webshop = payment_order.status in OrderStatus.paid_in_webshop
            should_delete_previous_payment_order = not paid_in_webshop

            if paid_in_webshop:
                if payment_order.price_total != new_price:
                    msg = "Reservation already has a paid payment order with a different price."
                    raise GraphQLValidationError(msg, code=error_codes.RESERVATION_PRICE_CANNOT_BE_CHANGED)
                return

        pricing = instance.reservation_unit.actions.get_active_pricing(by_date=begins_at.date())
        if pricing is None:
            msg = "No pricing found for reservation's begin date."
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_NO_ACTIVE_PRICING)

        # Use on-site payment if the reservation is going to begin soon,
        # even if the current pricing payment type is not on-site.
        payment_type: PaymentType = PaymentType.ON_SITE
        if not begins_soon:
            payment_type = pricing.payment_type
            if payment_type != PaymentType.ON_SITE:
                instance.reservation_unit.validators.validate_has_payment_product()

        if should_delete_previous_payment_order:
            instance.payment_order.delete()
            instance.refresh_from_db()

        # If a payment order still exists, it should be paid and have the same price, so don't create a new one.
        if hasattr(instance, "payment_order"):
            return

        # Set price info on instance early so that payment order data is calculated correctly
        instance.price = new_price
        # Tax percentage needs to be updated in case it has changed since the reservation was created
        instance.tax_percentage_value = pricing.tax_percentage.value

        instance.actions.create_payment_order_paid_after_handling(
            payment_type=payment_type,
            handled_payment_due_by=min(three_days_from_now, one_hour_before_begin),
        )

    @classmethod
    def handle_access_code(cls, instance: Reservation) -> None:
        if instance.access_type != AccessType.ACCESS_CODE:
            return

        # Allow activation in Pindora to fail, will be handled by a background task.
        try:
            try:
                PindoraService.activate_access_code(instance)
            except PindoraNotFoundError:
                # If access code has not been generated
                # (e.g. returned to handling after a deny and then approved),
                # create a new active access code in Pindora.
                PindoraService.create_access_code(instance, is_active=True)

        except ExternalServiceError as error:
            SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

    @classmethod
    def send_email(cls, instance: Reservation) -> None:
        if settings.PAYMENT_ORDERS_FOR_HANDLED_RESERVATIONS_ENABLED and instance.is_handled_paid:
            EmailService.send_reservation_requires_payment_email(reservation=instance)
        else:
            EmailService.send_reservation_approved_email(reservation=instance)

        EmailService.send_reservation_confirmed_staff_notification_email(reservation=instance)
