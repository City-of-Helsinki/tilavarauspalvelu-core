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
from tilavarauspalvelu.models import ReservationUnit
from tilavarauspalvelu.translation import get_attr_by_language
from utils.utils import safe_getattr

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "select_tester_form",
]


# --- Widgets -----------------------------------------------------------------------------------------------------

WIDTH = 50

text_widget = forms.TextInput(attrs={"size": WIDTH})
email_widget = forms.EmailInput(attrs={"size": WIDTH})
text_area_widget = forms.Textarea(attrs={"size": WIDTH})
datetime_widget = forms.SplitDateTimeWidget(date_format="%d.%m.%Y", time_format="%H:%M")
date_widget = forms.DateInput(attrs={"size": WIDTH})
number_widget = forms.NumberInput(attrs={"size": WIDTH})

# --- Base forms -------------------------------------------------------------------------------------------------


class BaseEmailTemplateForm(forms.Form):
    """Base form for email template testers, not meant to be used directly."""

    send_to = forms.EmailField(initial="", widget=email_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:  # noqa: ARG003
        """Fill form from model information."""
        return cls()

    def to_context(self) -> EmailContext:
        """Convert form data to email context."""
        raise NotImplementedError


class TemplateSwitcherForm(forms.Form):
    """Allows switching between templates in the email tester."""

    email_type = forms.ChoiceField(
        choices=EmailType.choices,
        widget=forms.Select(attrs={"id": "test_email_template_select"}),
    )


class ReservationUnitSelectForm(forms.Form):
    """Allows pre-filling the email tester from a reservation unit."""

    reservation_unit = forms.ChoiceField(
        widget=forms.Select(attrs={"id": "test_email_reservation_unit_select"}),
    )

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        runit_choices = [(None, "-")] + [
            (runit.pk, f"{runit.name} - {safe_getattr(runit, "unit.name")}")
            for runit in ReservationUnit.objects.select_related("unit").order_by("name_fi")
        ]
        self.fields["reservation_unit"].choices = runit_choices


def select_tester_form(*, email_type: EmailType) -> type[BaseEmailTemplateForm] | None:  # noqa: PLR0912, PLR0911
    """Select email tester form based on email type."""
    match email_type:
        case EmailType.APPLICATION_HANDLED:
            return ApplicationHandledEmailTemplateTesterForm
        case EmailType.APPLICATION_IN_ALLOCATION:
            return ApplicationInAllocationEmailTemplateTesterForm
        case EmailType.APPLICATION_RECEIVED:
            return ApplicationReceivedEmailTemplateTesterForm
        case EmailType.PERMISSION_DEACTIVATION:
            return PermissionDeactivationEmailTemplateTesterForm
        case EmailType.USER_ANONYMIZATION:
            return UserAnonymizationEmailTemplateTesterForm
        case EmailType.RESERVATION_CANCELLED:
            return ReservationCancelledEmailTemplateTesterForm
        case EmailType.RESERVATION_CONFIRMED:
            return ReservationConfirmedEmailTemplateTesterForm
        case EmailType.RESERVATION_APPROVED:
            return ReservationApprovedEmailTemplateTesterForm
        case EmailType.RESERVATION_REQUIRES_HANDLING:
            return ReservationHandlingRequiredEmailTemplateTesterForm
        case EmailType.RESERVATION_MODIFIED:
            return ReservationModifiedEmailTemplateTesterForm
        case EmailType.RESERVATION_REQUIRES_PAYMENT:
            return ReservationNeedsToBePaidEmailTemplateTesterForm
        case EmailType.RESERVATION_REJECTED:
            return ReservationRejectedEmailTemplateTesterForm
        case EmailType.STAFF_NOTIFICATION_RESERVATION_MADE:
            return StaffNotificationReservationMadeEmailTemplateTesterForm
        case EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING:
            return StaffNotificationReservationRequiresHandlingEmailTemplateTesterForm
        case _:
            return None


# --- Partial forms -------------------------------------------------------------------------------------------------


class LanguageFormMixin(forms.Form):
    language = forms.ChoiceField(choices=Language.choices, initial=Language.FI.value)


class EmailRecipientFormMixin(forms.Form):
    email_recipient_name = forms.CharField(initial="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]", widget=text_widget)


class ReservationBasicInfoFormMixin(forms.Form):
    reservation_unit_name = forms.CharField(initial="[VARAUSYKSIKÖN NIMI]", widget=text_widget)
    unit_name = forms.CharField(initial="[TOIMIPISTEEN NIMI]", widget=text_widget)
    unit_location = forms.CharField(initial="[TOIMIPISTEEN OSOITE]", widget=text_widget)
    begin_datetime = forms.SplitDateTimeField(initial=datetime.datetime(2100, 1, 1, 12), widget=datetime_widget)
    end_datetime = forms.SplitDateTimeField(initial=datetime.datetime(2100, 1, 1, 14), widget=datetime_widget)


class ReservationPriceFormMixin(forms.Form):
    price = forms.DecimalField(decimal_places=2, initial=Decimal("5.00"), widget=number_widget)
    tax_percentage = forms.DecimalField(decimal_places=2, initial=Decimal("25.50"), widget=number_widget)
    booking_number = forms.IntegerField(initial=0, widget=number_widget)


class ConfirmedInstructionsFormMixin(forms.Form):
    confirmed_instructions = forms.CharField(initial="[HYVÄKSYTYN VARAUKSEN OHJEET]", widget=text_area_widget)


class CancelledInstructionsFormMixin(forms.Form):
    cancelled_instructions = forms.CharField(initial="[PERUUTETUN VARAUKSEN OHJEET]", widget=text_area_widget)


class PendingInstructionsFormMixin(forms.Form):
    pending_instructions = forms.CharField(initial="[KÄSITELTÄVÄN VARAUKSEN OHJEET]", widget=text_area_widget)


# --- Tester forms --------------------------------------------------------------------------------------------------


class ApplicationHandledEmailTemplateTesterForm(
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    def to_context(self) -> EmailContext:
        return get_context_for_application_handled(language=self.cleaned_data["language"])


class ApplicationInAllocationEmailTemplateTesterForm(
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    def to_context(self) -> EmailContext:
        return get_context_for_application_in_allocation(language=self.cleaned_data["language"])


class ApplicationReceivedEmailTemplateTesterForm(
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    def to_context(self) -> EmailContext:
        return get_context_for_application_received(language=self.cleaned_data["language"])


class PermissionDeactivationEmailTemplateTesterForm(
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    def to_context(self) -> EmailContext:
        return get_context_for_permission_deactivation(language=self.cleaned_data["language"])


class UserAnonymizationEmailTemplateTesterForm(
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    def to_context(self) -> EmailContext:
        return get_context_for_user_anonymization(language=self.cleaned_data["language"])


class ReservationCancelledEmailTemplateTesterForm(
    CancelledInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
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
            booking_number=self.cleaned_data["booking_number"],
            cancelled_instructions=self.cleaned_data["cancelled_instructions"],
        )


class ReservationConfirmedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
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
            booking_number=self.cleaned_data["booking_number"],
            confirmed_instructions=self.cleaned_data["confirmed_instructions"],
        )


class ReservationApprovedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
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
            booking_number=self.cleaned_data["booking_number"],
            confirmed_instructions=self.cleaned_data["confirmed_instructions"],
        )


class ReservationHandlingRequiredEmailTemplateTesterForm(
    PendingInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
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
            booking_number=self.cleaned_data["booking_number"],
            pending_instructions=self.cleaned_data["pending_instructions"],
        )


class ReservationModifiedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
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
            booking_number=self.cleaned_data["booking_number"],
            confirmed_instructions=self.cleaned_data["confirmed_instructions"],
        )


class ReservationNeedsToBePaidEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    payment_due_date = forms.DateField(initial=datetime.date.today(), widget=date_widget)

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
            booking_number=self.cleaned_data["booking_number"],
            confirmed_instructions=self.cleaned_data["confirmed_instructions"],
        )


class ReservationRejectedEmailTemplateTesterForm(
    CancelledInstructionsFormMixin,
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    booking_number = forms.IntegerField(initial=0, widget=number_widget)
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
            booking_number=self.cleaned_data["booking_number"],
            cancelled_instructions=self.cleaned_data["cancelled_instructions"],
        )


class StaffNotificationReservationMadeEmailTemplateTesterForm(
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    reservation_name = forms.CharField(initial="[VARAUKSEN NIMI]", widget=text_widget)
    reservee_name = forms.CharField(initial="[VARAAJAN NIMI]", widget=text_widget)
    booking_number = forms.IntegerField(initial=0, widget=number_widget)

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
            booking_number=self.cleaned_data["booking_number"],
        )


class StaffNotificationReservationRequiresHandlingEmailTemplateTesterForm(
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    LanguageFormMixin,
    BaseEmailTemplateForm,
):
    reservation_name = forms.CharField(initial="[VARAUKSEN NIMI]", widget=text_widget)
    reservee_name = forms.CharField(initial="[VARAAJAN NIMI]", widget=text_widget)
    booking_number = forms.IntegerField(initial=0, widget=number_widget)

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
            booking_number=self.cleaned_data["booking_number"],
        )
