from __future__ import annotations

import dataclasses
from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any, Self

from django.utils.translation import pgettext_lazy

from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
    get_context_for_application_section_cancelled,
    get_context_for_permission_deactivation,
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_modified,
    get_context_for_reservation_modified_access_code,
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_seasonal_reservation_cancelled_single,
    get_context_for_seasonal_reservation_modified_series,
    get_context_for_seasonal_reservation_modified_single,
    get_context_for_seasonal_reservation_rejected_series,
    get_context_for_seasonal_reservation_rejected_single,
    get_context_for_staff_notification_application_section_cancelled,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
    get_context_for_user_anonymization,
)
from tilavarauspalvelu.integrations.email.template_context.reservation import (
    get_context_for_seasonal_reservation_modified_series_access_code,
)

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable

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
    label: str
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

    # Application

    APPLICATION_HANDLED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Application handled"),
        get_email_context=get_context_for_application_handled,
        context_variables=["language"],
    )
    APPLICATION_IN_ALLOCATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Application in allocation"),
        get_email_context=get_context_for_application_in_allocation,
        context_variables=["language"],
    )
    APPLICATION_RECEIVED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Application received"),
        get_email_context=get_context_for_application_received,
        context_variables=["language"],
    )
    APPLICATION_SECTION_CANCELLED = EmailTemplateType(
        # User cancels all reservations in their application section
        label=pgettext_lazy("EmailType", "Application section cancelled"),
        get_email_context=get_context_for_application_section_cancelled,
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

    # Permissions

    PERMISSION_DEACTIVATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Permission deactivation"),
        get_email_context=get_context_for_permission_deactivation,
        context_variables=["language"],
    )
    USER_ANONYMIZATION = EmailTemplateType(
        label=pgettext_lazy("EmailType", "User anonymization"),
        get_email_context=get_context_for_user_anonymization,
        context_variables=["language"],
    )

    # Reservation

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
    RESERVATION_MODIFIED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation modified"),
        get_email_context=get_context_for_reservation_modified,
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
    RESERVATION_MODIFIED_ACCESS_CODE = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation modified access code"),
        get_email_context=get_context_for_reservation_modified_access_code,
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
    RESERVATION_REJECTED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Reservation rejected"),
        get_email_context=get_context_for_reservation_rejected,
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

    # Reservation series

    # Seasonal reservation

    SEASONAL_RESERVATION_CANCELLED_SINGLE = EmailTemplateType(
        # User cancels one of their seasonal reservations
        label=pgettext_lazy("EmailType", "Seasonal reservation cancelled single"),
        get_email_context=get_context_for_seasonal_reservation_cancelled_single,
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
    SEASONAL_RESERVATION_MODIFIED_SERIES = EmailTemplateType(
        # Staff modifies a seasonal reservation series
        label=pgettext_lazy("EmailType", "Seasonal reservation modified series"),
        get_email_context=get_context_for_seasonal_reservation_modified_series,
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
    SEASONAL_RESERVATION_MODIFIED_SERIES_ACCESS_CODE = EmailTemplateType(
        # Staff modifies a seasonal reservation series
        label=pgettext_lazy("EmailType", "Seasonal reservation modified series access code"),
        get_email_context=get_context_for_seasonal_reservation_modified_series_access_code,
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
    SEASONAL_RESERVATION_MODIFIED_SINGLE = EmailTemplateType(
        # Staff modifies a single seasonal reservation
        label=pgettext_lazy("EmailType", "Seasonal reservation modified single"),
        get_email_context=get_context_for_seasonal_reservation_modified_single,
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
    SEASONAL_RESERVATION_REJECTED_SERIES = EmailTemplateType(
        # Staff rejects a seasonal reservation series
        label=pgettext_lazy("EmailType", "Seasonal reservation rejected series"),
        get_email_context=get_context_for_seasonal_reservation_rejected_series,
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
    SEASONAL_RESERVATION_REJECTED_SINGLE = EmailTemplateType(
        # Staff rejects a single reservation in a seasonal reservation series
        label=pgettext_lazy("EmailType", "Seasonal reservation rejected single"),
        get_email_context=get_context_for_seasonal_reservation_rejected_single,
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

    # Staff

    STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Staff notification application section cancelled"),
        get_email_context=get_context_for_staff_notification_application_section_cancelled,
        context_variables=[
            "language",
            "cancel_reason",
            "application_section_name",
            "application_round_name",
            "cancelled_reservation_series",
        ],
    )
    STAFF_NOTIFICATION_RESERVATION_MADE = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Staff notification reservation made"),
        get_email_context=get_context_for_staff_notification_reservation_made,
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
    STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING = EmailTemplateType(
        label=pgettext_lazy("EmailType", "Staff notification reservation requires handling"),
        get_email_context=get_context_for_staff_notification_reservation_requires_handling,
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
