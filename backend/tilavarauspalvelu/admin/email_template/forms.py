from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Self

from django import forms

from tilavarauspalvelu.enums import Language, WeekdayChoice
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
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_seasonal_reservation_cancelled_single,
    get_context_for_seasonal_reservation_modified_series,
    get_context_for_seasonal_reservation_modified_single,
    get_context_for_seasonal_reservation_rejected_series,
    get_context_for_seasonal_reservation_rejected_single,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
    get_context_for_user_anonymization,
)
from tilavarauspalvelu.integrations.email.template_context.application import (
    get_context_for_staff_notification_application_section_cancelled,
)
from tilavarauspalvelu.integrations.email.template_context.common import get_staff_reservations_ext_link
from tilavarauspalvelu.integrations.email.typing import EmailType
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

        case EmailType.APPLICATION_SECTION_CANCELLED:
            return ApplicationSectionCancelledTemplateTesterForm

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

        case EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE:
            return SeasonalReservationCancelledSingleTemplateTesterForm
        case EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES:
            return SeasonalReservationModifiedSeriesTemplateTesterForm
        case EmailType.SEASONAL_RESERVATION_MODIFIED_SINGLE:
            return SeasonalReservationModifiedSingleTemplateTesterForm
        case EmailType.SEASONAL_RESERVATION_REJECTED_SERIES:
            return SeasonalReservationRejectedSeriesTemplateTesterForm
        case EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE:
            return SeasonalReservationRejectedSingleTemplateTesterForm

        # Staff
        case EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED:
            return StaffNotificationApplicationSectionCancelledTemplateTesterForm
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
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)


class ConfirmedInstructionsFormMixin(forms.Form):
    instructions_confirmed = forms.CharField(initial="[HYVÄKSYTYN VARAUKSEN OHJEET]", widget=text_area_widget)


class CancelledInstructionsFormMixin(forms.Form):
    instructions_cancelled = forms.CharField(initial="[PERUUTETUN VARAUKSEN OHJEET]", widget=text_area_widget)


class PendingInstructionsFormMixin(forms.Form):
    instructions_pending = forms.CharField(initial="[KÄSITELTÄVÄN VARAUKSEN OHJEET]", widget=text_area_widget)


# --- Base forms -------------------------------------------------------------------------------------------------


class BaseEmailTemplateForm(LanguageFormMixin, forms.Form):
    """Base form for email template testers, not meant to be used directly."""

    send_to = forms.EmailField(initial="", widget=email_widget)

    @classmethod
    def from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> Self:
        """Initialise the form with data form from model information."""
        return cls(initial=cls.get_initial_data_from_reservation_unit(instance, language=language))

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:  # noqa: ARG003
        """Get initial data from model information."""
        return {}

    def to_context(self) -> EmailContext:
        """Convert form data to email context."""
        raise NotImplementedError

    def get_context_params(self) -> dict[str, Any]:
        return {
            "language": self.cleaned_data["language"],
        }


class ReservationBaseForm(
    ReservationBasicInfoFormMixin,
    EmailRecipientFormMixin,
    BaseEmailTemplateForm,
):
    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
            "reservation_unit_name": get_attr_by_language(instance, "name", language),
            "unit_name": get_attr_by_language(instance.unit, "name", language),
            "unit_location": instance.actions.get_address(),
        }

    def get_context_params(self) -> dict[str, Any]:
        return {
            **super().get_context_params(),
            "reservation_unit_name": self.cleaned_data["reservation_unit_name"],
            "unit_name": self.cleaned_data["unit_name"],
            "unit_location": self.cleaned_data["unit_location"],
            "begin_datetime": self.cleaned_data["begin_datetime"],
            "end_datetime": self.cleaned_data["end_datetime"],
        }


# --- Tester forms --------------------------------------------------------------------------------------------------


# Application ##########################################################################################################


class ApplicationHandledEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_application_handled(**self.get_context_params())


class ApplicationInAllocationEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_application_in_allocation(**self.get_context_params())


class ApplicationReceivedEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_application_received(**self.get_context_params())


class ApplicationSectionCancelledTemplateTesterForm(EmailRecipientFormMixin, BaseEmailTemplateForm):
    weekday_value = forms.CharField(initial="Maanantai")
    time_value = forms.CharField(initial="13:00-15:00")
    application_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_name = forms.CharField(initial="[HAKEMUKSEN OSAN NIMI]")
    application_round_name = forms.CharField(initial="[KAUSIVARAUSKIERROKSEN NIMI]")
    cancel_reason = forms.CharField(initial="[PERUUTUKSEN SYY]", widget=text_widget)

    def to_context(self) -> EmailContext:
        return get_context_for_application_section_cancelled(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            application_id=self.cleaned_data["application_id"],
            application_section_id=self.cleaned_data["application_section_id"],
            application_section_name=self.cleaned_data["application_section_name"],
            application_round_name=self.cleaned_data["application_round_name"],
            cancel_reason=self.cleaned_data["cancel_reason"],
        )


# Permissions ##########################################################################################################


class PermissionDeactivationEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_permission_deactivation(**self.get_context_params())


class UserAnonymizationEmailTemplateTesterForm(BaseEmailTemplateForm):
    def to_context(self) -> EmailContext:
        return get_context_for_user_anonymization(**self.get_context_params())


# Reservation ##########################################################################################################


class ReservationApprovedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    non_subsidised_price = forms.DecimalField(decimal_places=2, initial=Decimal("10.00"), widget=number_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
            "instructions_confirmed": get_attr_by_language(instance, "reservation_confirmed_instructions", language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_approved(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            price=self.cleaned_data["price"],
            non_subsidised_price=self.cleaned_data["non_subsidised_price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            instructions_confirmed=self.cleaned_data["instructions"],
        )


class ReservationCancelledEmailTemplateTesterForm(
    CancelledInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    cancel_reason = forms.CharField(initial="[PERUUTUKSEN SYY]", widget=text_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
            "instructions_cancelled": get_attr_by_language(instance, "reservation_cancelled_instructions", language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_cancelled(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            cancel_reason=self.cleaned_data["cancel_reason"],
            price=self.cleaned_data["price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            instructions_cancelled=self.cleaned_data["instructions_cancelled"],  # FIXME
        )


class ReservationConfirmedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
            "instructions_confirmed": get_attr_by_language(instance, "reservation_confirmed_instructions", language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_confirmed(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            price=self.cleaned_data["price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            instructions_confirmed=self.cleaned_data["instructions_confirmed"],
        )


class ReservationModifiedEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
            "instructions_confirmed": get_attr_by_language(instance, "reservation_confirmed_instructions", language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_modified(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            price=self.cleaned_data["price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            instructions_confirmed=self.cleaned_data["instructions_confirmed"],
        )


class ReservationRejectedEmailTemplateTesterForm(
    CancelledInstructionsFormMixin,
    ReservationBaseForm,
):
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)
    rejection_reason = forms.CharField(initial="[HYLKÄYKSEN SYY]", widget=text_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
            "instructions_cancelled": get_attr_by_language(instance, "reservation_cancelled_instructions", language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_rejected(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            rejection_reason=self.cleaned_data["rejection_reason"],
            reservation_id=self.cleaned_data["reservation_id"],
            instructions_cancelled=self.cleaned_data["instructions_cancelled"],
        )


class ReservationRequiresHandlingEmailTemplateTesterForm(
    PendingInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    subsidised_price = forms.DecimalField(decimal_places=2, initial=Decimal("10.00"), widget=number_widget)
    applying_for_free_of_charge = forms.BooleanField(initial=False, required=False)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
            "instructions_pending": get_attr_by_language(instance, "reservation_pending_instructions", language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_requires_handling(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            price=self.cleaned_data["price"],
            subsidised_price=self.cleaned_data["subsidised_price"],
            applying_for_free_of_charge=self.cleaned_data["applying_for_free_of_charge"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            reservation_id=self.cleaned_data["reservation_id"],
            instructions_pending=self.cleaned_data["instructions_pending"],
        )


class ReservationRequiresPaymentEmailTemplateTesterForm(
    ConfirmedInstructionsFormMixin,
    ReservationPriceFormMixin,
    ReservationBaseForm,
):
    payment_due_date = forms.DateField(initial=local_date(), widget=date_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
            "instructions_confirmed": get_attr_by_language(instance, "reservation_confirmed_instructions", language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_reservation_requires_payment(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            price=self.cleaned_data["price"],
            tax_percentage=self.cleaned_data["tax_percentage"],
            payment_due_date=self.cleaned_data["payment_due_date"],
            reservation_id=self.cleaned_data["reservation_id"],
            instructions_confirmed=self.cleaned_data["instructions_confirmed"],
        )


class SeasonalReservationCancelledSingleTemplateTesterForm(ReservationBaseForm):
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)
    application_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_id = forms.IntegerField(initial=0, widget=number_widget)
    cancel_reason = forms.CharField(initial="[PERUUTUKSEN SYY]", widget=text_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_seasonal_reservation_cancelled_single(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            application_id=self.cleaned_data["application_id"],
            application_section_id=self.cleaned_data["application_section_id"],
            cancel_reason=self.cleaned_data["cancel_reason"],
        )


class SeasonalReservationModifiedSeriesTemplateTesterForm(EmailRecipientFormMixin, BaseEmailTemplateForm):
    weekday_value = forms.CharField(initial="Maanantai")
    time_value = forms.CharField(initial="13:00-15:00")
    application_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_name = forms.CharField(initial="[HAKEMUKSEN OSAN NIMI]")
    application_round_name = forms.CharField(initial="[KAUSIVARAUSKIERROKSEN NIMI]")

    def to_context(self) -> EmailContext:
        return get_context_for_seasonal_reservation_modified_series(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            weekday_value=self.cleaned_data["weekday_value"],
            time_value=self.cleaned_data["time_value"],
            application_id=self.cleaned_data["application_id"],
            application_section_id=self.cleaned_data["application_section_id"],
            application_section_name=self.cleaned_data["application_section_name"],
            application_round_name=self.cleaned_data["application_round_name"],
        )


class SeasonalReservationModifiedSingleTemplateTesterForm(ReservationBaseForm):
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)
    application_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_id = forms.IntegerField(initial=0, widget=number_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_seasonal_reservation_modified_single(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            application_id=self.cleaned_data["application_id"],
            application_section_id=self.cleaned_data["application_section_id"],
        )


class SeasonalReservationRejectedSeriesTemplateTesterForm(EmailRecipientFormMixin, BaseEmailTemplateForm):
    weekday_value = forms.CharField(initial="Maanantai")
    time_value = forms.CharField(initial="13:00-15:00")
    application_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_name = forms.CharField(initial="[HAKEMUKSEN OSAN NIMI]")
    application_round_name = forms.CharField(initial="[KAUSIVARAUSKIERROKSEN NIMI]")
    rejection_reason = forms.CharField(initial="[HYLKÄYKSEN SYY]", widget=text_widget)

    def to_context(self) -> EmailContext:
        return get_context_for_seasonal_reservation_rejected_series(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            weekday_value=self.cleaned_data["weekday_value"],
            time_value=self.cleaned_data["time_value"],
            application_id=self.cleaned_data["application_id"],
            application_section_id=self.cleaned_data["application_section_id"],
            application_section_name=self.cleaned_data["application_section_name"],
            application_round_name=self.cleaned_data["application_round_name"],
            rejection_reason=self.cleaned_data["rejection_reason"],
        )


class SeasonalReservationRejectedSingleTemplateTesterForm(ReservationBaseForm):
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)
    application_id = forms.IntegerField(initial=0, widget=number_widget)
    application_section_id = forms.IntegerField(initial=0, widget=number_widget)
    rejection_reason = forms.CharField(initial="[HYLKÄYKSEN SYY]", widget=text_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_seasonal_reservation_rejected_single(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            application_id=self.cleaned_data["application_id"],
            application_section_id=self.cleaned_data["application_section_id"],
            rejection_reason=self.cleaned_data["rejection_reason"],
        )


# Staff ################################################################################################################


class StaffNotificationApplicationSectionCancelledTemplateTesterForm(EmailRecipientFormMixin, BaseEmailTemplateForm):
    application_section_name = forms.CharField(initial="[HAKEMUKSEN OSAN NIMI]")
    application_round_name = forms.CharField(initial="[KAUSIVARAUSKIERROKSEN NIMI]")
    cancel_reason = forms.CharField(initial="[PERUUTUKSEN SYY]", widget=text_widget)

    def to_context(self) -> EmailContext:
        return get_context_for_staff_notification_application_section_cancelled(
            **self.get_context_params(),
            email_recipient_name=self.cleaned_data["email_recipient_name"],
            application_section_name=self.cleaned_data["application_section_name"],
            application_round_name=self.cleaned_data["application_round_name"],
            cancel_reason=self.cleaned_data["cancel_reason"],
            cancelled_reservation_series=[  # Hard to enter in a form, so we just hardcode these.
                {
                    "weekday": WeekdayChoice.MONDAY.label,
                    "time": "13:00-15:00",
                    "url": get_staff_reservations_ext_link(reservation_id=1234),
                },
                {
                    "weekday": WeekdayChoice.TUESDAY.label,
                    "time": "21:00-22:00",
                    "url": get_staff_reservations_ext_link(reservation_id=5678),
                },
            ],
        )


class StaffNotificationReservationMadeEmailTemplateTesterForm(ReservationBaseForm):
    reservation_name = forms.CharField(initial="[VARAUKSEN NIMI]", widget=text_widget)
    reservee_name = forms.CharField(initial="[VARAAJAN NIMI]", widget=text_widget)
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_staff_notification_reservation_made(
            **self.get_context_params(),
            reservee_name=self.cleaned_data["reservee_name"],
            reservation_name=self.cleaned_data["reservation_name"],
            reservation_id=self.cleaned_data["reservation_id"],
        )


class StaffNotificationReservationRequiresHandlingEmailTemplateTesterForm(ReservationBaseForm):
    reservation_name = forms.CharField(initial="[VARAUKSEN NIMI]", widget=text_widget)
    reservee_name = forms.CharField(initial="[VARAAJAN NIMI]", widget=text_widget)
    reservation_id = forms.IntegerField(initial=0, widget=number_widget)

    @classmethod
    def get_initial_data_from_reservation_unit(cls, instance: ReservationUnit, *, language: Lang) -> dict[str, Any]:
        return {
            **super().get_initial_data_from_reservation_unit(instance, language=language),
        }

    def to_context(self) -> EmailContext:
        return get_context_for_staff_notification_reservation_requires_handling(
            **self.get_context_params(),
            reservee_name=self.cleaned_data["reservee_name"],
            reservation_name=self.cleaned_data["reservation_name"],
            reservation_id=self.cleaned_data["reservation_id"],
        )
