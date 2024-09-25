from __future__ import annotations

import enum
from enum import StrEnum
from inspect import cleandoc
from types import DynamicClassAttribute

from django.conf import settings
from django.db import models
from django.utils.functional import classproperty
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy
from enumfields import Enum

from tilavarauspalvelu.typing import permission

__all__ = [
    "RESERVEE_LANGUAGE_CHOICES",
    "CalendarProperty",
    "CustomerTypeChoice",
    "EventProperty",
    "Language",
    "OrderStatus",
    "OrderStatusWithFree",
    "PaymentType",
    "RejectionReadinessChoice",
    "ReservationNotification",
    "ReservationStateChoice",
    "ReservationTypeChoice",
    "ReservationTypeStaffChoice",
    "ResourceLocationType",
    "ServiceTypeChoices",
    "TermsOfUseTypeChoices",
    "UserPermissionChoice",
    "UserRoleChoice",
]


class ReservationNotification(models.TextChoices):
    ALL = "all"
    ONLY_HANDLING_REQUIRED = "only_handling_required"
    NONE = "none"


class ServiceTypeChoices(models.TextChoices):
    INTRODUCTION = "introduction", _("Introduction")
    CATERING = "catering", _("Catering")
    CONFIGURATION = "configuration", _("Configuration")


class TermsOfUseTypeChoices(models.TextChoices):
    GENERIC = "generic_terms", _("Generic terms")
    PAYMENT = "payment_terms", _("Payment terms")
    CANCELLATION = "cancellation_terms", _("Cancellation terms")
    RECURRING = "recurring_terms", _("Recurring reservation terms")
    SERVICE = "service_terms", _("Service-specific terms")
    PRICING = "pricing_terms", _("Pricing terms")


class Language(models.TextChoices):
    FI = "fi", _("Finnish")
    SV = "sv", _("Swedish")
    EN = "en", _("English")


class OrderStatus(models.TextChoices):
    DRAFT = "DRAFT", pgettext_lazy("OrderStatus", "Draft")  # Unpaid order
    EXPIRED = "EXPIRED", pgettext_lazy("OrderStatus", "Expired")
    CANCELLED = "CANCELLED", pgettext_lazy("OrderStatus", "Cancelled")
    PAID = "PAID", pgettext_lazy("OrderStatus", "Paid")
    PAID_MANUALLY = "PAID_MANUALLY", pgettext_lazy("OrderStatus", "Paid manually")
    REFUNDED = "REFUNDED", pgettext_lazy("OrderStatus", "Refunded")

    @classproperty
    def needs_update_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.EXPIRED,
            OrderStatus.CANCELLED,
        ]

    @classproperty
    def can_be_cancelled_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.EXPIRED,
        ]


class OrderStatusWithFree(models.TextChoices):
    """Same as OrderStatus, but includes the 'FREE' option used for filtering reservations without payments."""

    # Note: Enums cannot be subclassed, so we have to redefine all "original" members.
    DRAFT = "DRAFT", pgettext_lazy("OrderStatus", "Draft")
    EXPIRED = "EXPIRED", pgettext_lazy("OrderStatus", "Expired")
    CANCELLED = "CANCELLED", pgettext_lazy("OrderStatus", "Cancelled")
    PAID = "PAID", pgettext_lazy("OrderStatus", "Paid")
    PAID_MANUALLY = "PAID_MANUALLY", pgettext_lazy("OrderStatus", "Paid manually")
    REFUNDED = "REFUNDED", pgettext_lazy("OrderStatus", "Refunded")

    FREE = "FREE", pgettext_lazy("OrderStatus", "Free")


class PaymentType(models.TextChoices):
    ON_SITE = "ON_SITE", pgettext_lazy("PaymentType", "On site")
    ONLINE = "ONLINE", pgettext_lazy("PaymentType", "Online")
    INVOICE = "INVOICE", pgettext_lazy("PaymentType", "Invoice")


class ResourceLocationType(models.TextChoices):
    FIXED = "fixed", pgettext_lazy("ResourceLocationType", "Fixed")
    MOVABLE = "movable", pgettext_lazy("ResourceLocationType", "Movable")


class UserRoleChoice(models.TextChoices):
    """Which roles a user can have."""

    ADMIN = "ADMIN", _("Admin")
    HANDLER = "HANDLER", _("Handler")
    VIEWER = "VIEWER", _("Viewer")
    RESERVER = "RESERVER", _("Reserver")
    NOTIFICATION_MANAGER = "NOTIFICATION_MANAGER", _("Notification manager")

    @permission
    def can_manage_applications(cls) -> list[UserRoleChoice]:
        """
        This permission is required to modify applications and application sections
        that are not the user's own, as well as any application rounds.
        """
        return [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_view_applications(cls) -> list[UserRoleChoice]:
        """
        Permission required to view applications and application sections
        that are not the user's own.
        """
        return [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservations(cls) -> list[UserRoleChoice]:
        """Permission required to modify reservations that are not the user's own."""
        return [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_view_reservations(cls) -> list[UserRoleChoice]:
        """
        Permission required to view reservation data, and comment on them,
        as well as to view some restricted information on recurring reservations.
        """
        return [UserRoleChoice.VIEWER, UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_create_staff_reservations(cls) -> list[UserRoleChoice]:
        """
        Permission required to create different types of reservations,
        like those on behalf of another user, or once that block reservable time.,
        or to create or modify recurring reservations.
        """
        return [UserRoleChoice.RESERVER, UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservation_units(cls) -> list[UserRoleChoice]:
        """
        Permission required to create and modify data related to reservation units
        like reservation units, images, payment info, units, spaces, and resources.
        """
        return [UserRoleChoice.ADMIN]

    @permission
    def can_view_users(cls) -> list[UserRoleChoice]:
        """Permission required to view user data."""
        return [UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservation_related_data(cls) -> list[UserRoleChoice]:
        """
        Permission required to create and modify data related to reservations,
        like equipment, categories, purposes, and age groups.
        """
        return [UserRoleChoice.ADMIN]

    @permission
    def can_manage_notifications(cls) -> list[UserRoleChoice]:
        """Permission required to manage banner notifications."""
        return [UserRoleChoice.NOTIFICATION_MANAGER, UserRoleChoice.ADMIN]

    @classmethod
    def permission_map(cls) -> dict[UserPermissionChoice, list[UserRoleChoice]]:
        """Maps permissions to roles that have those permissions."""
        return {
            UserPermissionChoice(str(key).upper()): getattr(cls, key)()
            for key, value in cls.__dict__.items()
            if isinstance(value, permission)
        }

    @enum.property
    def permissions(self) -> list[UserPermissionChoice]:
        """List all permissions for a single role. Use like this: `UserRoleChoice.ADMIN.permissions`"""
        return [name for name, roles in UserRoleChoice.permission_map().items() if self in roles]

    @classmethod
    def permission_choices(cls) -> list[tuple[str, tuple[str, str]]]:
        """Choices for UserPermissionChoice."""
        return sorted(
            (
                (
                    str(key).upper(),  # key
                    (
                        str(key).upper(),  # .name
                        cleandoc(getattr(cls, key).__doc__),  # .label
                    ),
                )
                for key, value in cls.__dict__.items()
                if isinstance(value, permission)
            ),
            key=lambda x: x[0],
        )


# There is the disadvantage that we don't get autocomplete of permissions like this,
# but we also don't duplicate permissions from the roles above. This should be fine,
# as the enum is not really used in our code but meant for the frontend.
UserPermissionChoice = models.TextChoices("UserPermissionChoice", UserRoleChoice.permission_choices())


class EmailType(models.TextChoices):
    ACCESS_CODE_FOR_RESERVATION = "access_code_for_reservation"
    APPLICATION_HANDLED = "application_handled"
    APPLICATION_IN_ALLOCATION = "application_in_allocation"
    APPLICATION_RECEIVED = "application_received"
    HANDLING_REQUIRED_RESERVATION = "handling_required_reservation"
    RESERVATION_CANCELLED = "reservation_cancelled"
    RESERVATION_CONFIRMED = "reservation_confirmed"
    RESERVATION_HANDLED_AND_CONFIRMED = "reservation_handled_and_confirmed"
    RESERVATION_MODIFIED = "reservation_modified"
    RESERVATION_NEEDS_TO_BE_PAID = "reservation_needs_to_be_paid"
    RESERVATION_REJECTED = "reservation_rejected"
    RESERVATION_WITH_PIN_CONFIRMED = "reservation_with_pin_confirmed"
    STAFF_NOTIFICATION_RESERVATION_MADE = "staff_notification_reservation_made"
    STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING = "staff_notification_reservation_requires_handling"


class HaukiResourceState(Enum):
    OPEN = "open"
    CLOSED = "closed"
    UNDEFINED = "undefined"
    SELF_SERVICE = "self_service"
    WITH_KEY = "with_key"
    WITH_RESERVATION = "with_reservation"
    OPEN_AND_RESERVABLE = "open_and_reservable"
    WITH_KEY_AND_RESERVATION = "with_key_and_reservation"
    ENTER_ONLY = "enter_only"
    EXIT_ONLY = "exit_only"
    WEATHER_PERMITTING = "weather_permitting"
    NOT_IN_USE = "not_in_use"
    MAINTENANCE = "maintenance"

    class Labels:
        OPEN = pgettext_lazy("HaukiResourceState", "Open")
        CLOSED = pgettext_lazy("HaukiResourceState", "Closed")
        UNDEFINED = pgettext_lazy("HaukiResourceState", "Undefined")
        SELF_SERVICE = pgettext_lazy("HaukiResourceState", "Self service")
        WITH_KEY = pgettext_lazy("HaukiResourceState", "With key")
        WITH_RESERVATION = pgettext_lazy("HaukiResourceState", "With reservation")
        OPEN_AND_RESERVABLE = pgettext_lazy("HaukiResourceState", "Open and reservable")
        WITH_KEY_AND_RESERVATION = pgettext_lazy("HaukiResourceState", "With key and reservation")
        ENTER_ONLY = pgettext_lazy("HaukiResourceState", "Enter only")
        EXIT_ONLY = pgettext_lazy("HaukiResourceState", "Exit only")
        WEATHER_PERMITTING = pgettext_lazy("HaukiResourceState", "Weather permitting")
        NOT_IN_USE = pgettext_lazy("HaukiResourceState", "Not in use")
        MAINTENANCE = pgettext_lazy("HaukiResourceState", "Maintenance")

    @classmethod
    def accessible_states(cls):
        """
        States indicating the space can be accessed in some way,
        whether the access is restricted (e.g. via key or reservation)
        or not.
        """
        return [
            cls.ENTER_ONLY,
            cls.OPEN,
            cls.OPEN_AND_RESERVABLE,
            cls.SELF_SERVICE,
            cls.WITH_KEY,
            cls.WITH_KEY_AND_RESERVATION,
            cls.WITH_RESERVATION,
        ]

    @classmethod
    def reservable_states(cls):
        """States indicating the space can be reserved in some way."""
        return [
            cls.OPEN_AND_RESERVABLE,
            cls.WITH_KEY_AND_RESERVATION,
            cls.WITH_RESERVATION,
        ]

    @classmethod
    def closed_states(cls):
        """States indicating the space is closed and inaccessible."""
        return [
            None,
            cls.CLOSED,
            cls.MAINTENANCE,
            cls.NOT_IN_USE,
            cls.UNDEFINED,
        ]

    @DynamicClassAttribute
    def is_accessible(self) -> bool:
        return self in HaukiResourceState.accessible_states()

    @DynamicClassAttribute
    def is_reservable(self) -> bool:
        return self in HaukiResourceState.reservable_states()

    @DynamicClassAttribute
    def is_closed(self) -> bool:
        return self in HaukiResourceState.closed_states()

    @classmethod
    def get(cls, state):
        try:
            return HaukiResourceState(state)
        except ValueError:
            return HaukiResourceState.UNDEFINED


class CustomerTypeChoice(models.TextChoices):
    BUSINESS = "BUSINESS", pgettext_lazy("CustomerType", "Business")
    NONPROFIT = "NONPROFIT", pgettext_lazy("CustomerType", "Nonprofit")
    INDIVIDUAL = "INDIVIDUAL", pgettext_lazy("CustomerType", "Individual")

    @classproperty
    def organisation(self) -> list[str]:
        return [  # type: ignore[return-value]
            CustomerTypeChoice.BUSINESS.value,
            CustomerTypeChoice.NONPROFIT.value,
        ]


class ReservationStateChoice(models.TextChoices):
    CREATED = "CREATED", pgettext_lazy("ReservationState", "Created")
    CANCELLED = "CANCELLED", pgettext_lazy("ReservationState", "Cancelled")
    REQUIRES_HANDLING = "REQUIRES_HANDLING", pgettext_lazy("ReservationState", "Requires handling")
    WAITING_FOR_PAYMENT = "WAITING_FOR_PAYMENT", pgettext_lazy("ReservationState", "Waiting for payment")
    CONFIRMED = "CONFIRMED", pgettext_lazy("ReservationState", "Confirmed")
    DENIED = "DENIED", pgettext_lazy("ReservationState", "Denied")

    @classproperty
    def states_going_to_occur(self) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CREATED.value,
            ReservationStateChoice.CONFIRMED.value,
            ReservationStateChoice.WAITING_FOR_PAYMENT.value,
            ReservationStateChoice.REQUIRES_HANDLING.value,
        ]

    @classproperty
    def states_that_can_change_to_handling(self) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CONFIRMED.value,
            ReservationStateChoice.DENIED.value,
        ]

    @classproperty
    def states_that_can_change_to_deny(self) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.REQUIRES_HANDLING.value,
            ReservationStateChoice.CONFIRMED.value,
        ]

    @classproperty
    def states_that_can_be_cancelled(self) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CREATED.value,
            ReservationStateChoice.WAITING_FOR_PAYMENT.value,
        ]


class ReservationTypeChoice(models.TextChoices):
    NORMAL = "NORMAL", pgettext_lazy("ReservationType", "Normal")
    BLOCKED = "BLOCKED", pgettext_lazy("ReservationType", "Blocked")
    STAFF = "STAFF", pgettext_lazy("ReservationType", "Staff")
    BEHALF = "BEHALF", pgettext_lazy("ReservationType", "Behalf")
    SEASONAL = "SEASONAL", pgettext_lazy("ReservationType", "Seasonal")

    @classproperty
    def allowed_for_user_time_adjust(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.NORMAL.value,
            ReservationTypeChoice.BEHALF.value,
        ]


class ReservationTypeStaffChoice(models.TextChoices):
    # These are the same as the ones above, but for the staff create endpoint
    BLOCKED = "BLOCKED", pgettext_lazy("ReservationTypeStaffChoice", "Blocked")
    STAFF = "STAFF", pgettext_lazy("ReservationTypeStaffChoice", "Staff")
    BEHALF = "BEHALF", pgettext_lazy("ReservationTypeStaffChoice", "Behalf")


RESERVEE_LANGUAGE_CHOICES = (*settings.LANGUAGES, ("", ""))


class RejectionReadinessChoice(models.TextChoices):
    INTERVAL_NOT_ALLOWED = (
        "INTERVAL_NOT_ALLOWED",
        pgettext_lazy("RejectionReadiness", "Interval not allowed"),
    )
    OVERLAPPING_RESERVATIONS = (
        "OVERLAPPING_RESERVATIONS",
        pgettext_lazy("RejectionReadiness", "Overlapping reservations"),
    )
    RESERVATION_UNIT_CLOSED = (
        "RESERVATION_UNIT_CLOSED",
        pgettext_lazy("RejectionReadiness", "Reservation unit closed"),
    )


class CalendarProperty(StrEnum):
    VERSION = "VERSION"  # type: str
    """
    REQUIRED. Version of the iCalendar specification required to interpret the iCalendar object.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.7.4
    """

    PRODID = "PRODID"  # type: str
    """
    REQUIRED. The identifier for the product that created the iCalendar object.
    See: https://en.wikipedia.org/wiki/Formal_Public_Identifier
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.7.3
    """


class EventProperty(StrEnum):
    UID = "UID"  # type: str
    """
    The unique identifier for the calendar event.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.7
    """

    DTSTAMP = "DTSTAMP"  # type: datetime.datetime
    """
    The date and time that the calendar event was created.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.7.2
    """

    DTSTART = "DTSTART"  # type: datetime.datetime
    """
    The date and time that the calendar event begins.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.2.4
    """

    DTEND = "DTEND"  # type: datetime.datetime
    """
    The date and time that the calendar event ends.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.2.2
    """

    SUMMARY = "SUMMARY"  # type: str
    """
    A short summary or subject for the event.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.12
    """

    DESCRIPTION = "DESCRIPTION"  # type: str
    """
    A more complete description for the event than that provided by "SUMMARY".
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.5
    """

    LOCATION = "LOCATION"  # type: str
    """
    The intended venue for the event.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.7
    """

    GEO = "GEO"  # type: tuple[float, float]
    """
    Global position for the activity specified by a event.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.1.6
    """

    X_ALT_DESC = "X-ALT-DESC"  # type: str
    """
    A more complete description for the event than that provided by "SUMMARY".
    Required for Outlook calendars to display HTML descriptions properly.
    https://learn.microsoft.com/openspecs/exchange_server_protocols/ms-oxcical/d7f285da-9c7a-4597-803b-b74193c898a8
    """
