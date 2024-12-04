from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Self

from django import forms

from tilavarauspalvelu.enums import EmailType, Language
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
    get_context_for_permission_deactivation,
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_modified,
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
    get_context_for_user_anonymization,
)
from tilavarauspalvelu.translation import get_attr_by_language
from utils.date_utils import local_date

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "select_tester_form",
]


def select_tester_form(*, email_type: EmailType) -> type[BaseEmailTemplateForm] | None:  # noqa: PLR0912, PLR0911
    """Select email tester form based on email type."""
    match email_type:
        # Application
        case EmailType.APPLICATION_HANDLED:
            return ApplicationHandledEmailTemplateTesterForm
        case EmailType.APPLICATION_IN_ALLOCATION:
            return ApplicationInAllocationEmailTemplateTesterForm
        case EmailType.APPLICATION_RECEIVED:
            return ApplicationReceivedEmailTemplateTesterForm

        # Permissions
        case EmailType.PERMISSION_DEACTIVATION:
            return PermissionDeactivationEmailTemplateTesterForm
        case EmailType.USER_ANONYMIZATION:
            return UserAnonymizationEmailTemplateTesterForm

        # Reservation
        case EmailType.RESERVATION_APPROVED:
            return ReservationApprovedEmailTemplateTesterForm
        case EmailType.RESERVATION_CANCELLED:
            return ReservationCancelledEmailTemplateTesterForm
        case EmailType.RESERVATION_CONFIRMED:
            return ReservationConfirmedEmailTemplateTesterForm
        case EmailType.RESERVATION_MODIFIED:
            return ReservationModifiedEmailTemplateTesterForm
        case EmailType.RESERVATION_REJECTED:
            return ReservationRejectedEmailTemplateTesterForm
        case EmailType.RESERVATION_REQUIRES_HANDLING:
            return ReservationRequiresHandlingEmailTemplateTesterForm
        case EmailType.RESERVATION_REQUIRES_PAYMENT:
            return ReservationRequiresPaymentEmailTemplateTesterForm

        # Staff
        case EmailType.STAFF_NOTIFICATION_RESERVATION_MADE:
            return StaffNotificationReservationMadeEmailTemplateTesterForm
        case EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING:
            return StaffNotificationReservationRequiresHandlingEmailTemplateTesterForm

        # Error
        case _:
            return None


# --- Widgets -----------------------------------------------------------------------------------------------------

WIDTH = 50

text_widget = forms.TextInput(attrs={"size": WIDTH})
email_widget = forms.EmailInput(attrs={"size": WIDTH})
text_area_widget = forms.Textarea(attrs={"size": WIDTH})
datetime_widget = forms.SplitDateTimeWidget(date_format="%d.%m.%Y", time_format="%H:%M")
date_widget = forms.DateInput(attrs={"size": WIDTH})
number_widget = forms.NumberInput(attrs={"size": WIDTH})


# --- Partial forms -------------------------------------------------------------------------------------------------


class LanguageFormMixin:
    language = forms.ChoiceField(choices=Language.choices, initial=Language.FI.value)


class EmailRecipientFormMixin:
    email_recipient_name = forms.CharField(initial="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]", widget=text_widget)


class ReservationBasicInfoFormMixin:
    reservation_unit_name = forms.CharField(initial="[VARAUSYKSIKÖN NIMI]", widget=text_widget)
    unit_name = forms.CharField(initial="[TOIMIPISTEEN NIMI]", widget=text_widget)
    unit_location = forms.CharField(initial="[TOIMIPISTEEN OSOITE]", widget=text_widget)
    begin_datetime = forms.SplitDateTimeField(initial=datetime.datetime(2100, 1, 1, 12), widget=datetime_widget)
    end_datetime = forms.SplitDateTimeField(initial=datetime.datetime(2100, 1, 1, 14), widget=datetime_widget)


class ReservationPriceFormMixin:
    price = forms.DecimalField(decimal_places=2, initial=Decimal("5.00"), widget=number_widget)
    tax_percentage = forms.DecimalField(decimal_places=2, initial=Decimal("25.50"), widget=number_widget)
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)


class ConfirmedInstructionsFormMixin:
    confirmed_instructions = forms.CharField(initial="[HYVÄKSYTYN VARAUKSEN OHJEET]", widget=text_area_widget)


class CancelledInstructionsFormMixin:
    cancelled_instructions = forms.CharField(initial="[PERUUTETUN VARAUKSEN OHJEET]", widget=text_area_widget)


class PendingInstructionsFormMixin:
    pending_instructions = forms.CharField(initial="[KÄSITELTÄVÄN VARAUKSEN OHJEET]", widget=text_area_widget)


# --- Base forms -------------------------------------------------------------------------------------------------


class BaseEmailTemplateForm(LanguageFormMixin, forms.Form):
    """Base form for email template testers, not meant to be used directly."""

    send_to = forms.EmailField(initial="", widget=email_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:  # noqa: ARG003
        """Fill form from model information."""
        return cls()

    def to_context(self) -> EmailContext:
        """Convert form data to email context."""
        raise NotImplementedError


class ReservationBaseForm(
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    BaseEmailTemplateForm,
): ...


# --- Tester forms --------------------------------------------------------------------------------------------------


# Application ##########################################################################################################


class ApplicationHandledEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_application_handled(language=self.cleaned_data["language"])


class ApplicationInAllocationEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_application_in_allocation(language=self.cleaned_data["language"])


class ApplicationReceivedEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_application_received(language=self.cleaned_data["language"])


# Permissions ##########################################################################################################


class PermissionDeactivationEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_permission_deactivation(language=self.cleaned_data["language"])


class UserAnonymizationEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_user_anonymization(language=self.cleaned_data["language"])


# Reservation ##########################################################################################################


class ReservationApprovedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    non_subsidised_price = forms.DecimalField(decimal_places=2, initial=Decimal("10.00"), widget=number_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
                "confirmed_instructions": get_attr_by_language(
                    instance, "reservation_confirmed_instructions", language
                ),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_approved(
            language=self.cleaned_data["language"],
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            price=self.cleaned_data["price"],
            non_subsidised_price=self.cleaned_data["non_subsidised_price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            confirmed_instructions=self.cleaned_data["confirmed_instructions"],
        )


class ReservationCancelledEmailTemplateTesterForm(
    CancelledInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    cancel_reason = forms.CharField(initial="[PERUUTUKSEN SYY]", widget=text_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
                "cancelled_instructions": get_attr_by_language(
                    instance, "reservation_cancelled_instructions", language
                ),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_cancelled(
            language=self.cleaned_data["language"],
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            cancel_reason=self.cleaned_data["cancel_reason"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            price=self.cleaned_data["price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            cancelled_instructions=self.cleaned_data["cancelled_instructions"],
        )


class ReservationConfirmedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
                "confirmed_instructions": get_attr_by_language(
                    instance, "reservation_confirmed_instructions", language
                ),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_confirmed(
            language=self.cleaned_data["language"],
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            price=self.cleaned_data["price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            confirmed_instructions=self.cleaned_data["confirmed_instructions"],
        )


class ReservationModifiedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
                "confirmed_instructions": get_attr_by_language(
                    instance, "reservation_confirmed_instructions", language
                ),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_modified(
            language=self.cleaned_data["language"],
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            price=self.cleaned_data["price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            confirmed_instructions=self.cleaned_data["confirmed_instructions"],
        )


class ReservationRejectedEmailTemplateTesterForm(
    CancelledInstructionsFormMixin,
    ReservationBaseForm,
):
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)
    rejection_reason = forms.CharField(initial="[HYLKÄYKSEN SYY]", widget=text_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
                "cancelled_instructions": get_attr_by_language(
                    instance, "reservation_cancelled_instructions", language
                ),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_rejected(
            language=self.cleaned_data["language"],
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            rejection_reason=self.cleaned_data["rejection_reason"],
            reservation_id=self.cleaned_data["reservation_id"],
            cancelled_instructions=self.cleaned_data["cancelled_instructions"],
        )


class ReservationRequiresHandlingEmailTemplateTesterForm(
    PendingInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    subsidised_price = forms.DecimalField(decimal_places=2, initial=Decimal("10.00"), widget=number_widget)
    applying_for_free_of_charge = forms.BooleanField(initial=False, required=False)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
                "pending_instructions": get_attr_by_language(instance, "reservation_pending_instructions", language),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_requires_handling(
            language=self.cleaned_data["language"],
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            price=self.cleaned_data["price"],
            subsidised_price=self.cleaned_data["subsidised_price"],
            applying_for_free_of_charge=self.cleaned_data["applying_for_free_of_charge"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            pending_instructions=self.cleaned_data["pending_instructions"],
        )


class ReservationRequiresPaymentEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    payment_due_date = forms.DateField(initial=local_date(), widget=date_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
                "confirmed_instructions": get_attr_by_language(
                    instance, "reservation_confirmed_instructions", language
                ),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_requires_payment(
            language=self.cleaned_data["language"],
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            price=self.cleaned_data["price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            payment_due_date=self.cleaned_data["payment_due_date"],
            reservation_id=self.cleaned_data["reservation_id"],
            confirmed_instructions=self.cleaned_data["confirmed_instructions"],
        )


# Staff ################################################################################################################


class StaffNotificationReservationMadeEmailTemplateTesterForm(ReservationBaseForm):
    reservation_name = forms.CharField(initial="[VARAUKSEN NIMI]", widget=text_widget)
    reservee_name = forms.CharField(initial="[VARAAJAN NIMI]", widget=text_widget)
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_staff_notification_reservation_made(
            language=self.cleaned_data["language"],
            reservee_name=self.cleaned_data["reservee_name"],
            reservation_name=self.cleaned_data["reservation_name"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            reservation_id=self.cleaned_data["reservation_id"],
        )


class StaffNotificationReservationRequiresHandlingEmailTemplateTesterForm(ReservationBaseForm):
    reservation_name = forms.CharField(initial="[VARAUKSEN NIMI]", widget=text_widget)
    reservee_name = forms.CharField(initial="[VARAAJAN NIMI]", widget=text_widget)
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        return cls(
            initial={
                "reservation_unit_name": get_attr_by_language(instance, "name", language),
                "unit_name": get_attr_by_language(instance.unit, "name", language),
                "unit_location": instance.actions.get_address(),
            },
        )

    def to_context(self) -> EmailContext:
        return get_context_for_staff_notification_reservation_requires_handling(
            language=self.cleaned_data["language"],
            reservee_name=self.cleaned_data["reservee_name"],
            reservation_name=self.cleaned_data["reservation_name"],
            reservation_unit_name=self.cleaned_data["reservation_unit_name"],
            unit_name=self.cleaned_data["unit_name"],
            unit_location=self.cleaned_data["unit_location"],
            begin_datetime=self.cleaned_data["begin_datetime"],
            end_datetime=self.cleaned_data["end_datetime"],
            reservation_id=self.cleaned_data["reservation_id"],
        )
