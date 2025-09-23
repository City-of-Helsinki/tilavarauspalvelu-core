from __future__ import annotations

import datetime
import enum
import operator
from enum import StrEnum
from inspect import cleandoc
from types import DynamicClassAttribute
from typing import Literal

from django.db import models
from django.utils.functional import classproperty
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy

from tilavarauspalvelu.typing import permission

__all__ = [
    "AccessType",
    "ApplicationRoundReservationCreationStatusChoice",
    "ApplicationRoundStatusChoice",
    "ApplicationSectionStatusChoice",
    "ApplicationStatusChoice",
    "AuthenticationType",
    "BannerNotificationLevel",
    "BannerNotificationState",
    "BannerNotificationTarget",
    "CalendarProperty",
    "EventProperty",
    "HaukiResourceState",
    "Language",
    "MunicipalityChoice",
    "OrderStatus",
    "OrderStatusWithFree",
    "PaymentType",
    "PriceUnit",
    "PricingStatus",
    "PricingType",
    "Priority",
    "RejectionReadinessChoice",
    "ReservationCancelReasonChoice",
    "ReservationKind",
    "ReservationNotification",
    "ReservationStartInterval",
    "ReservationStateChoice",
    "ReservationTypeChoice",
    "ReservationTypeStaffChoice",
    "ReservationUnitImageType",
    "ReservationUnitPublishingState",
    "ReservationUnitReservationState",
    "ResourceLocationType",
    "TermsOfUseTypeChoices",
    "TimezoneProperty",
    "TimezoneRuleProperty",
    "UserPermissionChoice",
    "UserRoleChoice",
    "Weekday",
]


class ReservationNotification(models.TextChoices):
    """When user wants to receive reservation notification emails."""

    ALL = "all"
    ONLY_HANDLING_REQUIRED = "only_handling_required"
    NONE = "none"


class TermsOfUseTypeChoices(models.TextChoices):
    GENERIC = "generic_terms", _("Generic terms")
    PAYMENT = "payment_terms", _("Payment terms")
    CANCELLATION = "cancellation_terms", _("Cancellation terms")
    RECURRING = "recurring_terms", _("Reservation series terms")
    SERVICE = "service_terms", _("Service-specific terms")
    PRICING = "pricing_terms", _("Pricing terms")

    @classmethod
    def specific_terms(cls) -> list[TermsOfUseTypeChoices]:
        return list(set(cls.__members__.values()) - {TermsOfUseTypeChoices.GENERIC})


class Language(models.TextChoices):
    FI = "fi", _("Finnish")
    SV = "sv", _("Swedish")
    EN = "en", _("English")


class OrderStatus(models.TextChoices):
    DRAFT = "DRAFT", pgettext_lazy("OrderStatus", "Draft")  # Unpaid order
    PENDING = "PENDING", pgettext_lazy("OrderStatus", "Pending")  # Unpaid order after handling
    EXPIRED = "EXPIRED", pgettext_lazy("OrderStatus", "Expired")
    CANCELLED = "CANCELLED", pgettext_lazy("OrderStatus", "Cancelled")
    PAID = "PAID", pgettext_lazy("OrderStatus", "Paid")
    PAID_BY_INVOICE = "PAID_BY_INVOICE", pgettext_lazy("OrderStatus", "Paid by invoice")
    PAID_MANUALLY = "PAID_MANUALLY", pgettext_lazy("OrderStatus", "Paid manually")
    REFUNDED = "REFUNDED", pgettext_lazy("OrderStatus", "Refunded")

    @classproperty
    def can_be_marked_paid_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.PENDING,
            OrderStatus.EXPIRED,
            OrderStatus.CANCELLED,
        ]

    @classproperty
    def can_be_cancelled_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.PENDING,
            OrderStatus.EXPIRED,
            OrderStatus.PAID_MANUALLY,
            OrderStatus.PAID_BY_INVOICE,
        ]

    @classproperty
    def can_start_payment_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.PENDING,
        ]

    @classproperty
    def no_payment_from_webshop_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.PENDING,
            OrderStatus.PAID_MANUALLY,
        ]

    @classproperty
    def can_be_refunded_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.PAID,
        ]

    @classproperty
    def finalized(cls) -> list[OrderStatus]:
        """Orders in these statuses should not be updated from webshop."""
        return [
            OrderStatus.REFUNDED,
            OrderStatus.PAID,
            OrderStatus.PAID_BY_INVOICE,
            OrderStatus.PAID_MANUALLY,
        ]

    @classproperty
    def paid_in_webshop(cls) -> list[OrderStatus]:
        """Orders in these statuses are paid in the webshop."""
        return [
            OrderStatus.PAID,
            OrderStatus.PAID_BY_INVOICE,
        ]


class OrderStatusWithFree(models.TextChoices):
    """Same as OrderStatus, but includes the 'FREE' option used for filtering reservations without payments."""

    # Note: Enums cannot be subclassed, so we have to redefine all "original" members.
    DRAFT = "DRAFT", pgettext_lazy("OrderStatus", "Draft")
    PENDING = "PENDING", pgettext_lazy("OrderStatus", "Pending")
    EXPIRED = "EXPIRED", pgettext_lazy("OrderStatus", "Expired")
    CANCELLED = "CANCELLED", pgettext_lazy("OrderStatus", "Cancelled")
    PAID = "PAID", pgettext_lazy("OrderStatus", "Paid")
    PAID_MANUALLY = "PAID_MANUALLY", pgettext_lazy("OrderStatus", "Paid manually")
    PAID_BY_INVOICE = "PAID_BY_INVOICE", pgettext_lazy("OrderStatus", "Paid by invoice")
    REFUNDED = "REFUNDED", pgettext_lazy("OrderStatus", "Refunded")

    FREE = "FREE", pgettext_lazy("OrderStatus", "Free")


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
        as well as to view some restricted information on reservation series.
        """
        return [UserRoleChoice.VIEWER, UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_create_staff_reservations(cls) -> list[UserRoleChoice]:
        """
        Permission required to create different types of reservations,
        like those on behalf of another user, or once that block reservable time.,
        or to create or modify reservation series.
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
            key=operator.itemgetter(0),
        )

    @classmethod
    def allowed_roles_for_ad_permissions(cls) -> set[UserRoleChoice]:
        return {
            UserRoleChoice.VIEWER,
            UserRoleChoice.RESERVER,
            UserRoleChoice.HANDLER,
        }


# There is the disadvantage that we don't get autocomplete of permissions like this,
# but we also don't duplicate permissions from the roles above. This should be fine,
# as the enum is not really used in our code but meant for the frontend.
UserPermissionChoice = models.TextChoices("UserPermissionChoice", UserRoleChoice.permission_choices())


class HaukiResourceState(models.TextChoices):
    OPEN = "open", pgettext_lazy("HaukiResourceState", "Open")
    CLOSED = "closed", pgettext_lazy("HaukiResourceState", "Closed")
    UNDEFINED = "undefined", pgettext_lazy("HaukiResourceState", "Undefined")
    SELF_SERVICE = "self_service", pgettext_lazy("HaukiResourceState", "Self service")
    WITH_KEY = "with_key", pgettext_lazy("HaukiResourceState", "With key")
    WITH_RESERVATION = "with_reservation", pgettext_lazy("HaukiResourceState", "With reservation")
    OPEN_AND_RESERVABLE = "open_and_reservable", pgettext_lazy("HaukiResourceState", "Open and reservable")
    WITH_KEY_AND_RESERVATION = (
        "with_key_and_reservation",
        pgettext_lazy("HaukiResourceState", "With key and reservation"),
    )
    ENTER_ONLY = "enter_only", pgettext_lazy("HaukiResourceState", "Enter only")
    EXIT_ONLY = "exit_only", pgettext_lazy("HaukiResourceState", "Exit only")
    WEATHER_PERMITTING = "weather_permitting", pgettext_lazy("HaukiResourceState", "Weather permitting")
    NOT_IN_USE = "not_in_use", pgettext_lazy("HaukiResourceState", "Not in use")
    MAINTENANCE = "maintenance", pgettext_lazy("HaukiResourceState", "Maintenance")

    @classmethod
    def accessible_states(cls) -> list[HaukiResourceState]:
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
    def reservable_states(cls) -> list[HaukiResourceState]:
        """States indicating the space can be reserved in some way."""
        return [
            cls.OPEN_AND_RESERVABLE,
            cls.WITH_KEY_AND_RESERVATION,
            cls.WITH_RESERVATION,
        ]

    @classmethod
    def closed_states(cls) -> list[HaukiResourceState | None]:
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
    def get(cls, state: str) -> HaukiResourceState:
        try:
            return HaukiResourceState(state)
        except ValueError:
            return HaukiResourceState.UNDEFINED


class ReserveeType(models.TextChoices):
    INDIVIDUAL = "INDIVIDUAL", pgettext_lazy("ReserveeType", "Individual")
    COMPANY = "COMPANY", pgettext_lazy("ReserveeType", "Company")
    NONPROFIT = "NONPROFIT", pgettext_lazy("ReserveeType", "Nonprofit")

    @classproperty
    def organisation_types(cls) -> list[str]:
        return [  # type: ignore
            ReserveeType.COMPANY.value,  # type: ignore
            ReserveeType.NONPROFIT.value,  # type: ignore
        ]


class ReservationStateChoice(models.TextChoices):
    CREATED = "CREATED", pgettext_lazy("ReservationState", "Created")
    CANCELLED = "CANCELLED", pgettext_lazy("ReservationState", "Cancelled")
    REQUIRES_HANDLING = "REQUIRES_HANDLING", pgettext_lazy("ReservationState", "Requires handling")
    WAITING_FOR_PAYMENT = "WAITING_FOR_PAYMENT", pgettext_lazy("ReservationState", "Waiting for payment")
    CONFIRMED = "CONFIRMED", pgettext_lazy("ReservationState", "Confirmed")
    DENIED = "DENIED", pgettext_lazy("ReservationState", "Denied")

    @classproperty
    def states_going_to_occur(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CREATED.value,
            ReservationStateChoice.CONFIRMED.value,
            ReservationStateChoice.WAITING_FOR_PAYMENT.value,
            ReservationStateChoice.REQUIRES_HANDLING.value,
        ]

    @classproperty
    def states_that_can_change_to_handling(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CONFIRMED.value,
            ReservationStateChoice.DENIED.value,
        ]

    @classproperty
    def states_that_can_change_to_deny(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.REQUIRES_HANDLING.value,
            ReservationStateChoice.CONFIRMED.value,
        ]

    @classproperty
    def states_that_can_be_deleted(cls) -> list[str]:
        # "Alustava varaus" / "tentative reservation"
        return [  # type: ignore[return-type]
            ReservationStateChoice.CREATED.value,
            ReservationStateChoice.WAITING_FOR_PAYMENT.value,
        ]

    @classproperty
    def states_that_can_be_edited_by_staff(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CONFIRMED.value,
        ]

    @classproperty
    def states_that_can_be_rescheduled(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CONFIRMED.value,
        ]

    @classproperty
    def states_that_can_be_approved(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.REQUIRES_HANDLING.value,
        ]

    @classproperty
    def states_that_can_be_cancelled(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CONFIRMED.value,
        ]

    @classproperty
    def states_that_can_be_refunded(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CANCELLED.value,
            ReservationStateChoice.DENIED.value,
        ]

    @classproperty
    def states_that_can_change_access_code(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CONFIRMED.value,
        ]

    @classproperty
    def doesnt_block_anonymization(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CANCELLED.value,
            ReservationStateChoice.DENIED.value,
        ]

    @enum.property
    def should_create_payment_order(self) -> bool:
        return self in {
            ReservationStateChoice.CONFIRMED.value,
            ReservationStateChoice.WAITING_FOR_PAYMENT.value,
        }


class ReservationTypeChoice(models.TextChoices):
    NORMAL = "NORMAL", pgettext_lazy("ReservationType", "Normal")
    BLOCKED = "BLOCKED", pgettext_lazy("ReservationType", "Blocked")
    STAFF = "STAFF", pgettext_lazy("ReservationType", "Staff")
    BEHALF = "BEHALF", pgettext_lazy("ReservationType", "Behalf")
    SEASONAL = "SEASONAL", pgettext_lazy("ReservationType", "Seasonal")

    @classproperty
    def types_that_can_be_rescheduled(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.NORMAL.value,
            ReservationTypeChoice.BEHALF.value,
        ]

    @classproperty
    def should_not_anonymize(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.BLOCKED.value,
            ReservationTypeChoice.STAFF.value,
        ]

    @classproperty
    def types_that_can_be_cancelled(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.NORMAL.value,
            ReservationTypeChoice.SEASONAL.value,
        ]

    @classproperty
    def types_created_by_the_reservee(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.NORMAL.value,
            ReservationTypeChoice.SEASONAL.value,
        ]

    @classproperty
    def types_that_staff_can_create(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.BLOCKED.value,
            ReservationTypeChoice.STAFF.value,
            ReservationTypeChoice.BEHALF.value,
            ReservationTypeChoice.SEASONAL.value,
        ]

    @classproperty
    def types_that_can_change_access_code(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.NORMAL.value,
            ReservationTypeChoice.BEHALF.value,
            ReservationTypeChoice.STAFF.value,
            ReservationTypeChoice.SEASONAL.value,
        ]


class ReservationTypeStaffChoice(models.TextChoices):
    # These are the same as the ones above, but for the staff create endpoint
    BLOCKED = "BLOCKED", pgettext_lazy("ReservationTypeStaffChoice", "Blocked")
    STAFF = "STAFF", pgettext_lazy("ReservationTypeStaffChoice", "Staff")
    BEHALF = "BEHALF", pgettext_lazy("ReservationTypeStaffChoice", "Behalf")


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


class TimezoneProperty(StrEnum):
    TZID = "TZID"  # type: str
    """
    The timezone identifier for the time zone of the event.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.2.19
    """


class TimezoneRuleProperty(StrEnum):
    DTSTART = "DTSTART"  # type: int
    """
    Date and time after which this timezone rule is in effect.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.2.4
    """

    RRULE = "RRULE"  # type: str
    """
    Recurrence for the timezone change described by this rule.
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.3
    """

    TZOFFSETFROM = "TZOFFSETFROM"  # type: str
    """
    In which timezone offset (e.g. +0200) the event should be considered in
    before moving to this rule (e.g. from standard to daylight savings time).
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.3.3
    """

    TZOFFSETTO = "TZOFFSETTO"  # type: str
    """
    To which timezone offset (e.g. +0300) the event should be converted to
    when moving to this rule (e.g. from standard to daylight savings time).
    https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.3.4
    """


class ReservationUnitPublishingState(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    SCHEDULED_PUBLISHING = "SCHEDULED_PUBLISHING", _("Scheduled publishing")
    SCHEDULED_HIDING = "SCHEDULED_HIDING", _("Scheduled hiding")
    SCHEDULED_PERIOD = "SCHEDULED_PERIOD", _("Scheduled period")
    HIDDEN = "HIDDEN", _("Hidden")
    PUBLISHED = "PUBLISHED", _("Published")
    ARCHIVED = "ARCHIVED", _("Archived")

    @classproperty
    def states_that_are_visible(cls) -> list[str]:
        return [  # type: ignore[return-type]
            cls.PUBLISHED.value,
            cls.SCHEDULED_HIDING.value,
        ]


class ReservationUnitReservationState(models.TextChoices):
    SCHEDULED_RESERVATION = "SCHEDULED_RESERVATION", _("Scheduled reservation")
    SCHEDULED_PERIOD = "SCHEDULED_PERIOD", _("Scheduled period")
    RESERVABLE = "RESERVABLE", _("Reservable")
    SCHEDULED_CLOSING = "SCHEDULED_CLOSING", _("Scheduled closing")
    RESERVATION_CLOSED = "RESERVATION_CLOSED", _("Reservation closed")


class ReservationStartInterval(models.TextChoices):
    INTERVAL_15_MINUTES = "interval_15_mins", _("15 minutes")
    INTERVAL_30_MINUTES = "interval_30_mins", _("30 minutes")
    INTERVAL_60_MINUTES = "interval_60_mins", _("60 minutes")
    INTERVAL_90_MINUTES = "interval_90_mins", _("90 minutes")
    INTERVAL_120_MINUTES = "interval_120_mins", _("2 hours")
    INTERVAL_180_MINUTES = "interval_180_mins", _("3 hours")
    INTERVAL_240_MINUTES = "interval_240_mins", _("4 hours")
    INTERVAL_300_MINUTES = "interval_300_mins", _("5 hours")
    INTERVAL_360_MINUTES = "interval_360_mins", _("6 hours")
    INTERVAL_420_MINUTES = "interval_420_mins", _("7 hours")

    @enum.property
    def as_number(self) -> int:
        return int(self.value.split("_")[1])

    @enum.property
    def as_timedelta(self) -> datetime.timedelta:
        return datetime.timedelta(minutes=self.as_number)


class ReservationCancelReasonChoice(models.TextChoices):
    """Reasons why user has cancelled their reservation"""

    # Reasons refined in the order they should appear in the the frontend.
    CHANGE_OF_PLANS = (
        "CHANGE_OF_PLANS",
        pgettext_lazy("ReservationCancelReason", "My plans have changed"),
    )
    FOUND_ANOTHER_SPACE_ELSEWHERE = (
        "FOUND_ANOTHER_SPACE_ELSEWHERE",
        pgettext_lazy("ReservationCancelReason", "I found another space somewhere else"),
    )
    FOUND_ANOTHER_SPACE_VARAAMO = (
        "FOUND_ANOTHER_SPACE_VARAAMO",
        pgettext_lazy("ReservationCancelReason", "I found another space through Varaamo"),
    )
    UNSUITABLE_SPACE = (
        "UNSUITABLE_SPACE",
        pgettext_lazy("ReservationCancelReason", "The space is not suitable for my purpose"),
    )
    PROCESSING_TIME_TOO_LONG = (
        "PROCESSING_TIME_TOO_LONG",
        pgettext_lazy("ReservationCancelReason", "The booking processing time is too long"),
    )
    OTHER = (
        "OTHER",
        pgettext_lazy("ReservationCancelReason", "Other reason"),
    )

    # Not selectable by user

    NOT_PAID = (
        "NOT_PAID",
        pgettext_lazy(
            "ReservationCancelReason",
            "The booking was not paid for or invoice was not selected as the payment method by the deadline.",
        ),
    )

    @classproperty
    def user_selectable(cls) -> list[ReservationCancelReasonChoice]:
        """These reasons are selectable by the user"""
        values = list(cls)
        values.remove(cls.NOT_PAID)
        return values  # type: ignore[return-type]


class ReservationKind(models.TextChoices):
    DIRECT = "DIRECT", pgettext_lazy("ReservationKind", "Direct")
    SEASON = "SEASON", pgettext_lazy("ReservationKind", "Season")
    DIRECT_AND_SEASON = "DIRECT_AND_SEASON", pgettext_lazy("ReservationKind", "Direct and season")

    @classproperty
    def allows_direct(cls) -> list[str]:
        return [  # type: ignore[return-type]
            cls.DIRECT.value,
            cls.DIRECT_AND_SEASON.value,
        ]

    @classproperty
    def allows_season(cls) -> list[str]:
        return [  # type: ignore[return-type]
            cls.SEASON.value,
            cls.DIRECT_AND_SEASON.value,
        ]


class ReservationFormType(models.TextChoices):
    """Reservation forms for that are supported by the system."""

    CONTACT_INFO_FORM = (
        "CONTACT_INFO_FORM",
        pgettext_lazy("ReservationFormType", "Contact information only"),
    )
    """Asks for user's contact information."""

    RESERVEE_INFO_FORM = (
        "RESERVEE_INFO_FORM",
        pgettext_lazy("ReservationFormType", "Contact information and event description"),
    )
    """Asks for reservee information depending on the user's reservee type, in addition to contact information."""

    PURPOSE_FORM = (
        "PURPOSE_FORM",
        pgettext_lazy("ReservationFormType", "Purpose of use"),
    )
    """Asks for user's purpose of use, in addition to contact and reservee information."""

    AGE_GROUP_FORM = (
        "AGE_GROUP_FORM",
        pgettext_lazy("ReservationFormType", "Age group"),
    )
    """Asks for user's age group, in addition to contact and reservee information, and purpose of use."""

    PURPOSE_SUBVENTION_FORM = (
        "PURPOSE_SUBVENTION_FORM",
        pgettext_lazy("ReservationFormType", "Purpose of use + discount"),
    )
    """Adds option to apply for subvention to the purpose form."""

    AGE_GROUP_SUBVENTION_FORM = (
        "AGE_GROUP_SUBVENTION_FORM",
        pgettext_lazy("ReservationFormType", "Age group + discount"),
    )
    """Adds option to apply for subvention to the age group form."""


class PricingType(models.TextChoices):
    PAID = "paid", pgettext_lazy("PricingType", "Paid")
    FREE = "free", pgettext_lazy("PricingType", "Free")


class PaymentType(models.TextChoices):
    ON_SITE = "ON_SITE", pgettext_lazy("PaymentType", "On site")
    ONLINE = "ONLINE", pgettext_lazy("PaymentType", "Online")
    ONLINE_OR_INVOICE = "ONLINE_OR_INVOICE", pgettext_lazy("PaymentType", "Online or invoice")

    @classproperty
    def requires_verkkokauppa(cls) -> list[PaymentType]:
        return [
            cls.ONLINE,
            cls.ONLINE_OR_INVOICE,
        ]

    @classproperty
    def types_that_can_be_pending(cls) -> list[PaymentType]:
        return [
            cls.ONLINE,
            cls.ONLINE_OR_INVOICE,
        ]


class PriceUnit(models.TextChoices):
    PER_15_MINS = "per_15_mins", pgettext_lazy("PriceUnit", "per 15 minutes")
    PER_30_MINS = "per_30_mins", pgettext_lazy("PriceUnit", "per 30 minutes")
    PER_HOUR = "per_hour", pgettext_lazy("PriceUnit", "per hour")
    PER_HALF_DAY = "per_half_day", pgettext_lazy("PriceUnit", "per half a day")
    PER_DAY = "per_day", pgettext_lazy("PriceUnit", "per day")
    PER_WEEK = "per_week", pgettext_lazy("PriceUnit", "per week")
    FIXED = "fixed", pgettext_lazy("PriceUnit", "fixed")

    @enum.property
    def is_fixed(self) -> bool:
        return self in {
            PriceUnit.FIXED,
            PriceUnit.PER_HALF_DAY,
            PriceUnit.PER_DAY,
            PriceUnit.PER_WEEK,
        }

    @enum.property
    def in_minutes(self) -> int:
        match self:
            case PriceUnit.PER_15_MINS:
                return 15
            case PriceUnit.PER_30_MINS:
                return 30
            case PriceUnit.PER_HOUR:
                return 60
            case PriceUnit.PER_HALF_DAY:
                return 120
            case PriceUnit.PER_DAY:
                return 1440
            case PriceUnit.PER_WEEK:
                return 10080
            case _:
                msg = f"Price unit {self} cannot be represented in minutes."
                raise ValueError(msg)


class PricingStatus(models.TextChoices):
    PRICING_STATUS_PAST = "past", pgettext_lazy("PricingStatus", "past")
    PRICING_STATUS_ACTIVE = "active", pgettext_lazy("PricingStatus", "active")
    PRICING_STATUS_FUTURE = "future", pgettext_lazy("PricingStatus", "future")


class AuthenticationType(models.TextChoices):
    WEAK = "weak", pgettext_lazy("AuthenticationType", "Weak")
    STRONG = "strong", pgettext_lazy("AuthenticationType", "Strong")


class ReservationUnitImageType(models.TextChoices):
    MAIN = "main", pgettext_lazy("ReservationUnitImageType", "Main image")
    OTHER = "other", pgettext_lazy("ReservationUnitImageType", "Other")


class Weekday(models.TextChoices):
    MONDAY = "MONDAY", _("Monday")
    TUESDAY = "TUESDAY", _("Tuesday")
    WEDNESDAY = "WEDNESDAY", _("Wednesday")
    THURSDAY = "THURSDAY", _("Thursday")
    FRIDAY = "FRIDAY", _("Friday")
    SATURDAY = "SATURDAY", _("Saturday")
    SUNDAY = "SUNDAY", _("Sunday")

    @classmethod
    def from_iso_week_day(cls, weekday: Literal[1, 2, 3, 4, 5, 6, 7]) -> Weekday:
        """ISO weekday number, starting from 1."""
        match weekday:
            case 1:
                return Weekday.MONDAY
            case 2:
                return Weekday.TUESDAY
            case 3:
                return Weekday.WEDNESDAY
            case 4:
                return Weekday.THURSDAY
            case 5:
                return Weekday.FRIDAY
            case 6:
                return Weekday.SATURDAY
            case _:  # pragma: no cover
                msg = f"Invalid weekday: {weekday}."
                raise ValueError(msg)

    @classmethod
    def from_week_day(cls, weekday: Literal[0, 1, 2, 3, 4, 5, 6]) -> Weekday:
        """Weekday number, starting from 0."""
        match weekday:
            case 0:
                return Weekday.MONDAY
            case 1:
                return Weekday.TUESDAY
            case 2:
                return Weekday.WEDNESDAY
            case 3:
                return Weekday.THURSDAY
            case 4:
                return Weekday.FRIDAY
            case 5:
                return Weekday.SATURDAY
            case 6:
                return Weekday.SUNDAY
            case _:  # pragma: no cover
                msg = f"Invalid weekday: {weekday}."
                raise ValueError(msg)

    @enum.property
    def as_iso_weekday_number(self) -> int:
        """ISO weekday number, starting from 1."""
        match self:
            case Weekday.MONDAY:
                return 1
            case Weekday.TUESDAY:
                return 2
            case Weekday.WEDNESDAY:
                return 3
            case Weekday.THURSDAY:
                return 4
            case Weekday.FRIDAY:
                return 5
            case Weekday.SATURDAY:
                return 6
            case Weekday.SUNDAY:
                return 7
            case _:  # pragma: no cover
                msg = f"Invalid weekday {self}"
                raise ValueError(msg)

    @enum.property
    def as_weekday_number(self) -> int:
        """Weekday number, starting from 0."""
        match self:
            case Weekday.MONDAY:
                return 0
            case Weekday.TUESDAY:
                return 1
            case Weekday.WEDNESDAY:
                return 2
            case Weekday.THURSDAY:
                return 3
            case Weekday.FRIDAY:
                return 4
            case Weekday.SATURDAY:
                return 5
            case Weekday.SUNDAY:
                return 6
            case _:  # pragma: no cover
                msg = f"Invalid weekday {self}"
                raise ValueError(msg)


class Priority(models.TextChoices):
    PRIMARY = "PRIMARY", pgettext_lazy("Priority", "Primary")
    SECONDARY = "SECONDARY", pgettext_lazy("Priority", "Secondary")


class MunicipalityChoice(models.TextChoices):
    """Municipality choices"""

    HELSINKI = "HELSINKI", _("Helsinki")
    OTHER = "OTHER", _("Other")

    @enum.property
    def code(self) -> str:
        match self:
            case MunicipalityChoice.HELSINKI:
                return "091"
            case MunicipalityChoice.OTHER:
                return "199"
            case _:
                msg = f"Unknown municipality code for {self}"
                raise ValueError(msg)


class ApplicationRoundStatusChoice(models.TextChoices):
    UPCOMING = "UPCOMING", pgettext_lazy("ApplicationRoundStatus", "Upcoming")
    """Applications cannot yet be made in the round"""

    OPEN = "OPEN", pgettext_lazy("ApplicationRoundStatus", "Open")
    """Applications can be made in the round"""

    IN_ALLOCATION = "IN_ALLOCATION", pgettext_lazy("ApplicationRoundStatus", "In Allocation")
    """Applications in the round are being allocated"""

    HANDLED = "HANDLED", pgettext_lazy("ApplicationRoundStatus", "Handled")
    """All application have been allocated"""

    RESULTS_SENT = "SENT", pgettext_lazy("ApplicationRoundStatus", "Results Sent")
    """All application results have been sent to users"""

    @DynamicClassAttribute
    def is_allocation_upcoming(self) -> bool:
        return self in {
            ApplicationRoundStatusChoice.UPCOMING,
            ApplicationRoundStatusChoice.OPEN,
        }

    @DynamicClassAttribute
    def can_remove_allocations(self) -> bool:
        return self == ApplicationRoundStatusChoice.IN_ALLOCATION

    @DynamicClassAttribute
    def past_allocation(self) -> bool:
        return self in {
            ApplicationRoundStatusChoice.HANDLED,
            ApplicationRoundStatusChoice.RESULTS_SENT,
        }

    @DynamicClassAttribute
    def is_ongoing(self) -> bool:
        return self != ApplicationRoundStatusChoice.RESULTS_SENT

    @DynamicClassAttribute
    def allows_resetting(self) -> bool:
        return self in {
            ApplicationRoundStatusChoice.IN_ALLOCATION,
            ApplicationRoundStatusChoice.HANDLED,
            ApplicationRoundStatusChoice.RESULTS_SENT,
        }


class ApplicationRoundReservationCreationStatusChoice(models.TextChoices):
    NOT_COMPLETED = "NOT_COMPLETED", pgettext_lazy("ApplicationRoundReservationCreationStatus", "Not completed")
    """The ApplicationRound has not been marked as completed yet or the reservations have not been created yet"""

    COMPLETED = "COMPLETED", pgettext_lazy("ApplicationRoundReservationCreationStatus", "Completed")
    """All reservations for the ApplicationRound have been created successfully"""

    FAILED = "FAILED", pgettext_lazy("ApplicationRoundReservationCreationStatus", "Failed")
    """Reservations for the ApplicationRound could not be created successfully or reservation creation has timed out"""


class ApplicationStatusChoice(models.TextChoices):
    DRAFT = "DRAFT", pgettext_lazy("ApplicationStatus", "Draft")
    """Application started but not ready"""

    RECEIVED = "RECEIVED", pgettext_lazy("ApplicationStatus", "Received")
    """Application sent by user"""

    IN_ALLOCATION = "IN_ALLOCATION", pgettext_lazy("ApplicationStatus", "In Allocation")
    """Application's events are being allocated"""

    HANDLED = "HANDLED", pgettext_lazy("ApplicationStatus", "Handled")
    """Application's events have all been allocated"""

    RESULTS_SENT = "RESULT_SENT", pgettext_lazy("ApplicationStatus", "Results Sent")
    """Application's results have been sent to user"""

    EXPIRED = "EXPIRED", pgettext_lazy("ApplicationStatus", "Expired")
    """Application not completed before application round ended"""

    CANCELLED = "CANCELLED", pgettext_lazy("ApplicationStatus", "Cancelled")
    """Application cancelled by user"""

    @DynamicClassAttribute
    def can_decline(self) -> bool:
        return self == ApplicationStatusChoice.IN_ALLOCATION

    @DynamicClassAttribute
    def can_allocate(self) -> bool:
        return self == ApplicationStatusChoice.IN_ALLOCATION

    @DynamicClassAttribute
    def can_send(self) -> bool:
        return self in {
            ApplicationStatusChoice.DRAFT,
            ApplicationStatusChoice.RECEIVED,
        }

    @DynamicClassAttribute
    def can_cancel(self) -> bool:
        return self in {
            ApplicationStatusChoice.DRAFT,
            ApplicationStatusChoice.RECEIVED,
        }

    @DynamicClassAttribute
    def can_flag(self) -> bool:
        return self in {
            ApplicationStatusChoice.IN_ALLOCATION,
            ApplicationStatusChoice.HANDLED,
            ApplicationStatusChoice.RESULTS_SENT,
        }

    @DynamicClassAttribute
    def can_reset(self) -> bool:
        return self in {
            ApplicationStatusChoice.IN_ALLOCATION,
            ApplicationStatusChoice.HANDLED,
        }

    @classproperty
    def blocks_anonymization(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ApplicationStatusChoice.RECEIVED.value,
            ApplicationStatusChoice.IN_ALLOCATION.value,
            ApplicationStatusChoice.HANDLED.value,
        ]


class ApplicationSectionStatusChoice(models.TextChoices):
    UNALLOCATED = "UNALLOCATED", pgettext_lazy("ApplicationSectionStatus", "Unallocated")
    """Application sections has been created by the user, but it hasn't been allocated"""

    IN_ALLOCATION = "IN_ALLOCATION", pgettext_lazy("ApplicationSectionStatus", "In Allocation")
    """Some allocations have been made for the application section, but allocation is not finished"""

    HANDLED = "HANDLED", pgettext_lazy("ApplicationSectionStatus", "Handled")
    """Application section has been handled fully in the allocation process"""

    REJECTED = "REJECTED", pgettext_lazy("ApplicationSectionStatus", "Rejected")
    """All applied slots for this application section have been locked or rejected."""

    @DynamicClassAttribute
    def can_allocate(self) -> bool:
        return self in {
            ApplicationSectionStatusChoice.UNALLOCATED,
            ApplicationSectionStatusChoice.IN_ALLOCATION,
        }

    @DynamicClassAttribute
    def can_delete(self) -> bool:
        return self == ApplicationSectionStatusChoice.UNALLOCATED

    @DynamicClassAttribute
    def can_reset(self) -> bool:
        return self in {
            ApplicationSectionStatusChoice.UNALLOCATED,
            ApplicationSectionStatusChoice.IN_ALLOCATION,
            ApplicationSectionStatusChoice.HANDLED,
        }


class BannerNotificationLevel(models.TextChoices):
    EXCEPTION = "EXCEPTION", pgettext_lazy("BannerNotificationLevel", "Exception")
    WARNING = "WARNING", pgettext_lazy("BannerNotificationLevel", "Warning")
    NORMAL = "NORMAL", pgettext_lazy("BannerNotificationLevel", "Normal")


class BannerNotificationTarget(models.TextChoices):
    ALL = "ALL", pgettext_lazy("BannerNotificationTarget", "All")
    STAFF = "STAFF", pgettext_lazy("BannerNotificationTarget", "Staff")
    USER = "USER", pgettext_lazy("BannerNotificationTarget", "User")


class BannerNotificationState(models.TextChoices):
    DRAFT = "DRAFT", pgettext_lazy("BannerNotificationState", "Draft")
    SCHEDULED = "SCHEDULED", pgettext_lazy("BannerNotificationState", "Scheduled")
    ACTIVE = "ACTIVE", pgettext_lazy("BannerNotificationState", "Active")


class ADLoginAMR(enum.Enum):
    HELSINKI_ADFS = "helsinki_adfs"
    HELSINKIAD = "helsinkiad"
    HELSINKIAZUREAD = "helsinkiazuread"
    EDUAD = "eduad"


class ProfileLoginAMR(enum.Enum):
    SUOMI_FI = "suomi_fi"
    HELTUNNISTUSSUOMIFI = "heltunnistussuomifi"


class LoginMethod(enum.Enum):
    PROFILE = "PROFILE"
    AD = "AD"
    OTHER = "OTHER"


class AccessType(models.TextChoices):
    """How is the reservee able to enter the space in their reservation unit?"""

    ACCESS_CODE = "ACCESS_CODE", pgettext_lazy("AccessType", "access code")
    OPENED_BY_STAFF = "OPENED_BY_STAFF", pgettext_lazy("AccessType", "opened by staff")
    PHYSICAL_KEY = "PHYSICAL_KEY", pgettext_lazy("AccessType", "physical key")
    UNRESTRICTED = "UNRESTRICTED", pgettext_lazy("AccessType", "unrestricted")


class AccessTypeWithMultivalued(models.TextChoices):
    """
    Same as AccessType, but includes the 'MULTIVALUED' option
    for series and seasonal bookings where access type between reservations varies.
    """

    ACCESS_CODE = "ACCESS_CODE", pgettext_lazy("AccessType", "access code")
    OPENED_BY_STAFF = "OPENED_BY_STAFF", pgettext_lazy("AccessType", "opened by staff")
    PHYSICAL_KEY = "PHYSICAL_KEY", pgettext_lazy("AccessType", "physical key")
    UNRESTRICTED = "UNRESTRICTED", pgettext_lazy("AccessType", "unrestricted")

    # Should not be settable to models, only available in API responses.
    MULTIVALUED = "MULTIVALUED", pgettext_lazy("AccessType", "multi-valued")

    @classproperty
    def model_choices(cls) -> list[tuple[str, str]]:
        """Don't allow 'MULTIVALUED' to be set to models."""
        return [(value, label) for value, label in cls.choices if value != cls.MULTIVALUED.value]


class AccessCodeState(models.TextChoices):
    """The state of the access code."""

    ACCESS_CODE_NOT_REQUIRED = "ACCESS_CODE_NOT_REQUIRED", pgettext_lazy("AccessCodeState", "Access code not required")
    ACCESS_CODE_CREATED = "ACCESS_CODE_CREATED", pgettext_lazy("AccessCodeState", "Access code created")
    ACCESS_CODE_PENDING = "ACCESS_CODE_PENDING", pgettext_lazy("AccessCodeState", "Access code pending")
