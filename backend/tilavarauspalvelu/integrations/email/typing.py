from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING, Any, ClassVar, Self, TypedDict

from django.utils.functional import classproperty
from django.utils.translation import pgettext_lazy

from .rendering import render_html, render_text
from .template_context import (
    get_context_for_reservation_access_code_added,
    get_context_for_reservation_access_code_changed,
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_confirmed_staff_notification,
    get_context_for_reservation_denied,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_handling_staff_notification,
    get_context_for_reservation_requires_payment,
    get_context_for_reservation_rescheduled,
    get_context_for_seasonal_booking_access_code_added,
    get_context_for_seasonal_booking_access_code_changed,
    get_context_for_seasonal_booking_application_received,
    get_context_for_seasonal_booking_application_round_handled,
    get_context_for_seasonal_booking_application_round_in_allocation,
    get_context_for_seasonal_booking_cancelled_all,
    get_context_for_seasonal_booking_cancelled_all_staff_notification,
    get_context_for_seasonal_booking_cancelled_single,
    get_context_for_seasonal_booking_denied_series,
    get_context_for_seasonal_booking_denied_single,
    get_context_for_seasonal_booking_rescheduled_series,
    get_context_for_seasonal_booking_rescheduled_single,
    get_context_for_user_anonymization,
    get_context_for_user_permissions_deactivation,
)

if TYPE_CHECKING:
    import datetime
    from collections.abc import Callable, Iterable
    from decimal import Decimal

    from django.utils.functional import Promise

    from tilavarauspalvelu.typing import EmailAttachment, EmailContext

__all__ = [
    "EmailData",
    "EmailTemplateType",
    "EmailType",
    "ReservationAccessCodeAddedContext",
    "ReservationAccessCodeChangedContext",
    "ReservationApprovedContext",
    "ReservationCancelledContext",
    "ReservationConfirmedContext",
    "ReservationConfirmedStaffNotificationContext",
    "ReservationDeniedContext",
    "ReservationRequiresHandlingContext",
    "ReservationRequiresHandlingStaffNotificationContext",
    "ReservationRequiresPaymentContext",
    "ReservationRescheduledContext",
    "SeasonalBookingAccessCodeAddedContext",
    "SeasonalBookingAccessCodeChangedContext",
    "SeasonalBookingCancelledAllContext",
    "SeasonalBookingCancelledAllStaffNotificationContext",
    "SeasonalBookingCancelledSingleContext",
    "SeasonalBookingDeniedSeriesContext",
    "SeasonalBookingDeniedSingleContext",
    "SeasonalBookingRescheduledSeriesContext",
    "SeasonalBookingRescheduledSingleContext",
]


@dataclasses.dataclass
class EmailData:
    recipients: Iterable[str]
    subject: str
    text_content: str
    html_content: str
    attachments: Iterable[EmailAttachment] = ()

    @classmethod
    def build(
        cls,
        recipients: Iterable[str],
        context: EmailContext,
        email_type: EmailTemplateType,
        attachment: EmailAttachment | None = None,
    ) -> Self:
        """Helper method to build an EmailData object with the given context and email type."""
        return cls(
            recipients=list(recipients),
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
            attachments=[attachment] if attachment else [],
        )

    def __json__(self) -> dict[str, Any]:  # noqa: PLW3201
        """Make the object JSON serializable to be used in Celery tasks."""
        return dataclasses.asdict(self)


# Contexts


class ReservationAccessCodeAddedContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    price: Decimal
    tax_percentage: Decimal
    reservation_id: int
    instructions_confirmed: str
    access_code_is_used: bool
    access_code: str
    access_code_validity_period: str


class ReservationAccessCodeChangedContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    price: Decimal
    tax_percentage: Decimal
    reservation_id: int
    instructions_confirmed: str
    access_code_is_used: bool
    access_code: str
    access_code_validity_period: str


class ReservationApprovedContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    price: Decimal
    non_subsidised_price: Decimal
    tax_percentage: Decimal
    reservation_id: int
    instructions_confirmed: str
    access_code_is_used: bool
    access_code: str
    access_code_validity_period: str


class ReservationCancelledContext(TypedDict, total=False):
    email_recipient_name: str
    cancel_reason: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    price: Decimal
    tax_percentage: Decimal
    reservation_id: int
    instructions_cancelled: str


class ReservationConfirmedContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    price: Decimal
    tax_percentage: Decimal
    reservation_id: int
    instructions_confirmed: str
    access_code_is_used: bool
    access_code: str
    access_code_validity_period: str


class ReservationConfirmedStaffNotificationContext(TypedDict, total=False):
    reservee_name: str
    reservation_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    reservation_id: int


class ReservationDeniedContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    rejection_reason: str
    reservation_id: int
    instructions_cancelled: str


class ReservationRequiresHandlingContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    price: Decimal
    subsidised_price: Decimal
    applying_for_free_of_charge: bool
    tax_percentage: Decimal
    reservation_id: int
    instructions_pending: str


class ReservationRequiresHandlingStaffNotificationContext(TypedDict, total=False):
    reservee_name: str
    reservation_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    reservation_id: int


class ReservationRequiresPaymentContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    price: Decimal
    tax_percentage: Decimal
    payment_due_date: datetime.date
    reservation_id: int
    instructions_confirmed: str


class ReservationRescheduledContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    price: Decimal
    tax_percentage: Decimal
    reservation_id: int
    instructions_confirmed: str
    access_code_is_used: bool
    access_code: str
    access_code_validity_period: str


class SeasonalBookingAccessCodeAddedContext(TypedDict, total=False):
    email_recipient_name: str
    application_section_name: str
    application_round_name: str
    application_id: int | None
    application_section_id: int | None
    access_code_is_used: bool
    access_code: str
    allocations: list[dict[str, Any]]


class SeasonalBookingAccessCodeChangedContext(TypedDict, total=False):
    email_recipient_name: str
    application_section_name: str
    application_round_name: str
    application_id: int | None
    application_section_id: int | None
    access_code_is_used: bool
    access_code: str
    allocations: list[dict[str, Any]]


class SeasonalBookingCancelledAllContext(TypedDict):
    cancel_reason: str
    email_recipient_name: str
    application_section_name: str
    application_round_name: str
    application_id: int | None
    application_section_id: int | None


class SeasonalBookingCancelledAllStaffNotificationContext(TypedDict, total=False):
    cancel_reason: str
    application_section_name: str
    application_round_name: str
    allocations: list[dict[str, Any]]


class SeasonalBookingCancelledSingleContext(TypedDict, total=False):
    email_recipient_name: str
    cancel_reason: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    application_id: int | None
    application_section_id: int | None


class SeasonalBookingDeniedSeriesContext(TypedDict, total=False):
    rejection_reason: str
    email_recipient_name: str
    application_section_name: str
    application_round_name: str
    application_id: int | None
    application_section_id: int | None
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    weekday_value: str
    time_value: str


class SeasonalBookingDeniedSingleContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    rejection_reason: str
    application_id: int | None
    application_section_id: int | None


class SeasonalBookingRescheduledSeriesContext(TypedDict, total=False):
    email_recipient_name: str
    application_section_name: str
    application_round_name: str
    application_id: int | None
    application_section_id: int | None
    access_code_is_used: bool
    access_code: str
    access_code_validity_period: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    weekday_value: str
    time_value: str


class SeasonalBookingRescheduledSingleContext(TypedDict, total=False):
    email_recipient_name: str
    reservation_unit_name: str
    unit_name: str
    unit_location: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    application_id: int | None
    application_section_id: int | None


# Email template types


@dataclasses.dataclass
class EmailTemplateType:
    label: str | Promise
    value: str = dataclasses.field(init=False)
    get_email_context: Callable
    context_variables: list[str]

    def __set_name__(self, owner: Any, name: str) -> None:
        self.value = name.lower()

    @property
    def html_path(self) -> str:
        return f"email/html/{self.value}.jinja"

    @property
    def text_path(self) -> str:
        return f"email/text/{self.value}.jinja"


class _EmailTypeOptions:
    options: ClassVar[list[EmailTemplateType]]

    def __init_subclass__(cls, **kwargs: Any) -> None:
        """Collect all defined EmailTemplateType attributes in the subclass to options."""
        cls.options = [option for option in cls.__dict__.values() if isinstance(option, EmailTemplateType)]


class EmailType(_EmailTypeOptions):
    """Defines all possible email types that can be sent from the system."""

    @classmethod
    def get(cls, value: str, /) -> EmailTemplateType:
        return getattr(cls, value.upper())

    @classmethod
    def choices(cls) -> list:
        return [(option.value, option.label) for option in cls.options]

    # Reservation

    RESERVATION_ACCESS_CODE_ADDED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation access code added"),
        get_email_context=get_context_for_reservation_access_code_added,
        context_variables=list(ReservationAccessCodeAddedContext.__annotations__),
    )
    RESERVATION_ACCESS_CODE_CHANGED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation access code changed"),
        get_email_context=get_context_for_reservation_access_code_changed,
        context_variables=list(ReservationAccessCodeChangedContext.__annotations__),
    )
    RESERVATION_APPROVED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation approved"),
        get_email_context=get_context_for_reservation_approved,
        context_variables=list(ReservationApprovedContext.__annotations__),
    )
    RESERVATION_CANCELLED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation cancelled"),
        get_email_context=get_context_for_reservation_cancelled,
        context_variables=list(ReservationCancelledContext.__annotations__),
    )
    RESERVATION_CONFIRMED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation confirmed"),
        get_email_context=get_context_for_reservation_confirmed,
        context_variables=list(ReservationConfirmedContext.__annotations__),
    )
    RESERVATION_CONFIRMED_STAFF_NOTIFICATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation confirmed staff notification"),
        get_email_context=get_context_for_reservation_confirmed_staff_notification,
        context_variables=list(ReservationConfirmedStaffNotificationContext.__annotations__),
    )
    RESERVATION_DENIED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation denied"),
        get_email_context=get_context_for_reservation_denied,
        context_variables=list(ReservationDeniedContext.__annotations__),
    )
    RESERVATION_REQUIRES_HANDLING = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation requires handling"),
        get_email_context=get_context_for_reservation_requires_handling,
        context_variables=list(ReservationRequiresHandlingContext.__annotations__),
    )
    RESERVATION_REQUIRES_HANDLING_STAFF_NOTIFICATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation requires handling staff notification"),
        get_email_context=get_context_for_reservation_requires_handling_staff_notification,
        context_variables=list(ReservationRequiresHandlingStaffNotificationContext.__annotations__),
    )
    RESERVATION_REQUIRES_PAYMENT = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation requires payment"),
        get_email_context=get_context_for_reservation_requires_payment,
        context_variables=list(ReservationRequiresPaymentContext.__annotations__),
    )
    RESERVATION_RESCHEDULED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation rescheduled"),
        get_email_context=get_context_for_reservation_rescheduled,
        context_variables=list(ReservationRescheduledContext.__annotations__),
    )

    # Seasonal booking

    SEASONAL_BOOKING_ACCESS_CODE_ADDED = EmailTemplateType(  # TODO: Only relevant series
        label=pgettext_lazy("EmailType", "Seasonal reservation access code added"),
        get_email_context=get_context_for_seasonal_booking_access_code_added,
        context_variables=list(SeasonalBookingAccessCodeAddedContext.__annotations__),
    )
    SEASONAL_BOOKING_ACCESS_CODE_CHANGED = EmailTemplateType(  # TODO: Only relevant series
        label=pgettext_lazy("EmailType", "Seasonal reservation access code changed"),
        get_email_context=get_context_for_seasonal_booking_access_code_changed,
        context_variables=list(SeasonalBookingAccessCodeChangedContext.__annotations__),
    )
    SEASONAL_BOOKING_APPLICATION_RECEIVED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking application received"),
        get_email_context=get_context_for_seasonal_booking_application_received,
        context_variables=[],
    )
    SEASONAL_BOOKING_APPLICATION_ROUND_HANDLED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking application round handled"),
        get_email_context=get_context_for_seasonal_booking_application_round_handled,
        context_variables=[],
    )
    SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking application round in allocation"),
        get_email_context=get_context_for_seasonal_booking_application_round_in_allocation,
        context_variables=[],
    )
    SEASONAL_BOOKING_CANCELLED_ALL = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking cancelled all"),
        get_email_context=get_context_for_seasonal_booking_cancelled_all,
        context_variables=list(SeasonalBookingCancelledAllContext.__annotations__),
    )
    SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking cancelled all staff notification"),
        get_email_context=get_context_for_seasonal_booking_cancelled_all_staff_notification,
        context_variables=list(SeasonalBookingCancelledAllStaffNotificationContext.__annotations__),
    )
    SEASONAL_BOOKING_CANCELLED_SINGLE = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking cancelled single"),
        get_email_context=get_context_for_seasonal_booking_cancelled_single,
        context_variables=list(SeasonalBookingCancelledSingleContext.__annotations__),
    )
    SEASONAL_BOOKING_DENIED_SERIES = EmailTemplateType(  # TODO: Only relevant series
        label=pgettext_lazy("EmailType", "Seasonal booking denied series"),
        get_email_context=get_context_for_seasonal_booking_denied_series,
        context_variables=list(SeasonalBookingDeniedSeriesContext.__annotations__),
    )
    SEASONAL_BOOKING_DENIED_SINGLE = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking denied single"),
        get_email_context=get_context_for_seasonal_booking_denied_single,
        context_variables=list(SeasonalBookingDeniedSingleContext.__annotations__),
    )
    SEASONAL_BOOKING_RESCHEDULED_SERIES = EmailTemplateType(  # TODO: Only relevant series
        label=pgettext_lazy("EmailType", "Seasonal booking rescheduled series"),
        get_email_context=get_context_for_seasonal_booking_rescheduled_series,
        context_variables=list(SeasonalBookingRescheduledSeriesContext.__annotations__),
    )
    SEASONAL_BOOKING_RESCHEDULED_SINGLE = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking rescheduled single"),
        get_email_context=get_context_for_seasonal_booking_rescheduled_single,
        context_variables=list(SeasonalBookingRescheduledSingleContext.__annotations__),
    )

    # User

    USER_PERMISSIONS_DEACTIVATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "User permissions deactivation"),
        get_email_context=get_context_for_user_permissions_deactivation,
        context_variables=[],
    )
    USER_ANONYMIZATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "User anonymization"),
        get_email_context=get_context_for_user_anonymization,
        context_variables=[],
    )

    @classproperty
    def access_code_always_used(cls) -> list[EmailTemplateType]:
        return [
            cls.RESERVATION_ACCESS_CODE_ADDED,
            cls.RESERVATION_ACCESS_CODE_CHANGED,
            cls.SEASONAL_BOOKING_ACCESS_CODE_ADDED,
            cls.SEASONAL_BOOKING_ACCESS_CODE_CHANGED,
        ]
