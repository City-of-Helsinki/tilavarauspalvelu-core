from __future__ import annotations

import dataclasses
from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any, Self

from django.utils.translation import pgettext_lazy

from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import (
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
from tilavarauspalvelu.integrations.email.template_context.reservation import (
    get_context_for_seasonal_booking_access_code_changed,
)

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable

    from django.utils.functional import Promise

    from tilavarauspalvelu.typing import EmailAttachment, EmailContext

__all__ = [
    "EmailData",
    "EmailTemplateType",
    "EmailType",
]


@dataclass
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
        attachment: EmailAttachment = None,
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
        return asdict(self)


####


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
    def __init_subclass__(cls, **kwargs: Any) -> None:
        """Collect all defined EmailTemplateType attributes in the subclass to options."""
        cls.options: list[EmailTemplateType] = [
            option for option in cls.__dict__.values() if isinstance(option, EmailTemplateType)
        ]


class EmailType(_EmailTypeOptions):
    options: list[EmailTemplateType]

    @classmethod
    def get(cls, value: str, /) -> EmailTemplateType:
        return getattr(cls, value.upper())

    @classmethod
    def choices(cls) -> list:
        return [(option.value, option.label) for option in cls.options]

    # Reservation

    RESERVATION_ACCESS_CODE_CHANGED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation access code changed"),
        get_email_context=get_context_for_reservation_access_code_changed,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "price",
            "tax_percentage",
            "reservation_id",
            "instructions_confirmed",
            "access_code_is_used",
            "access_code",
            "access_code_validity_period",
        ],
    )
    RESERVATION_APPROVED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation approved"),
        get_email_context=get_context_for_reservation_approved,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "price",
            "non_subsidised_price",
            "tax_percentage",
            "reservation_id",
            "instructions_confirmed",
            "access_code_is_used",
            "access_code",
            "access_code_validity_period",
        ],
    )
    RESERVATION_CANCELLED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation cancelled"),
        get_email_context=get_context_for_reservation_cancelled,
        context_variables=[
            "language",
            "email_recipient_name",
            "cancel_reason",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "price",
            "tax_percentage",
            "reservation_id",
            "instructions_cancelled",
        ],
    )
    RESERVATION_CONFIRMED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation confirmed"),
        get_email_context=get_context_for_reservation_confirmed,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "price",
            "tax_percentage",
            "reservation_id",
            "instructions_confirmed",
            "access_code_is_used",
            "access_code",
            "access_code_validity_period",
        ],
    )
    RESERVATION_CONFIRMED_STAFF_NOTIFICATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation confirmed staff notification"),
        get_email_context=get_context_for_reservation_confirmed_staff_notification,
        context_variables=[
            "language",
            "reservee_name",
            "reservation_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "reservation_id",
        ],
    )
    RESERVATION_DENIED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation denied"),
        get_email_context=get_context_for_reservation_denied,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "rejection_reason",
            "reservation_id",
            "instructions_cancelled",
        ],
    )
    RESERVATION_REQUIRES_HANDLING = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation requires handling"),
        get_email_context=get_context_for_reservation_requires_handling,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "price",
            "subsidised_price",
            "applying_for_free_of_charge",
            "tax_percentage",
            "reservation_id",
            "instructions_pending",
        ],
    )
    RESERVATION_REQUIRES_HANDLING_STAFF_NOTIFICATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation requires handling staff notification"),
        get_email_context=get_context_for_reservation_requires_handling_staff_notification,
        context_variables=[
            "language",
            "reservee_name",
            "reservation_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "reservation_id",
        ],
    )
    RESERVATION_REQUIRES_PAYMENT = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation requires payment"),
        get_email_context=get_context_for_reservation_requires_payment,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "price",
            "tax_percentage",
            "payment_due_date",
            "reservation_id",
            "instructions_confirmed",
        ],
    )
    RESERVATION_RESCHEDULED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation rescheduled"),
        get_email_context=get_context_for_reservation_rescheduled,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "price",
            "tax_percentage",
            "reservation_id",
            "instructions_confirmed",
            "access_code_is_used",
            "access_code",
            "access_code_validity_period",
        ],
    )

    # Seasonal booking

    SEASONAL_BOOKING_ACCESS_CODE_CHANGED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal reservation access code changed"),
        get_email_context=get_context_for_seasonal_booking_access_code_changed,
        context_variables=[
            "language",
            "email_recipient_name",
            "application_section_name",
            "application_round_name",
            "application_id",
            "application_section_id",
            "access_code_is_used",
            "access_code",
            "allocations",
        ],
    )
    SEASONAL_BOOKING_APPLICATION_RECEIVED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking application received"),
        get_email_context=get_context_for_seasonal_booking_application_received,
        context_variables=["language"],
    )
    SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking application round in allocation"),
        get_email_context=get_context_for_seasonal_booking_application_round_in_allocation,
        context_variables=["language"],
    )
    SEASONAL_BOOKING_APPLICATION_ROUND_HANDLED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking application round handled"),
        get_email_context=get_context_for_seasonal_booking_application_round_handled,
        context_variables=["language"],
    )
    SEASONAL_BOOKING_CANCELLED_ALL = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking cancelled all"),
        get_email_context=get_context_for_seasonal_booking_cancelled_all,
        context_variables=[
            "language",
            "cancel_reason",
            "email_recipient_name",
            "application_section_name",
            "application_round_name",
            "application_id",
            "application_section_id",
        ],
    )
    SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking cancelled all staff notification"),
        get_email_context=get_context_for_seasonal_booking_cancelled_all_staff_notification,
        context_variables=[
            "language",
            "cancel_reason",
            "application_section_name",
            "application_round_name",
            "cancelled_reservation_series",
        ],
    )
    SEASONAL_BOOKING_CANCELLED_SINGLE = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking cancelled single"),
        get_email_context=get_context_for_seasonal_booking_cancelled_single,
        context_variables=[
            "language",
            "email_recipient_name",
            "cancel_reason",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "application_id",
            "application_section_id",
        ],
    )
    SEASONAL_BOOKING_DENIED_SERIES = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking denied series"),
        get_email_context=get_context_for_seasonal_booking_denied_series,
        context_variables=[
            "language",
            "rejection_reason",
            "email_recipient_name",
            "application_section_name",
            "application_round_name",
            "application_id",
            "application_section_id",
            "allocations",
        ],
    )
    SEASONAL_BOOKING_DENIED_SINGLE = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking denied single"),
        get_email_context=get_context_for_seasonal_booking_denied_single,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "rejection_reason",
            "application_id",
            "application_section_id",
        ],
    )
    SEASONAL_BOOKING_RESCHEDULED_SERIES = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking rescheduled series"),
        get_email_context=get_context_for_seasonal_booking_rescheduled_series,
        context_variables=[
            "language",
            "email_recipient_name",
            "application_section_name",
            "application_round_name",
            "application_id",
            "application_section_id",
            "access_code_is_used",
            "access_code",
            "allocations",
        ],
    )
    SEASONAL_BOOKING_RESCHEDULED_SINGLE = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Seasonal booking rescheduled single"),
        get_email_context=get_context_for_seasonal_booking_rescheduled_single,
        context_variables=[
            "language",
            "email_recipient_name",
            "reservation_unit_name",
            "unit_name",
            "unit_location",
            "begin_datetime",
            "end_datetime",
            "application_id",
            "application_section_id",
        ],
    )

    # User

    USER_PERMISSIONS_DEACTIVATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "User permissions deactivation"),
        get_email_context=get_context_for_user_permissions_deactivation,
        context_variables=["language"],
    )
    USER_ANONYMIZATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "User anonymization"),
        get_email_context=get_context_for_user_anonymization,
        context_variables=["language"],
    )
