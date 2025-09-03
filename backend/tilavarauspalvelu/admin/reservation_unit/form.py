from __future__ import annotations

import datetime
import json
from typing import Any

from django import forms
from django.core.exceptions import ValidationError
from django.db import transaction
from django.forms.formsets import DELETION_FIELD_NAME
from django.forms.models import BaseInlineFormSet
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationStackedInline
from subforms.fields import DynamicArrayField
from tinymce.widgets import TinyMCE

from tilavarauspalvelu.enums import AccessType, TermsOfUseTypeChoices
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitAccessType, ReservationUnitPricing, TermsOfUse
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date
from utils.external_service.errors import ExternalServiceError
from utils.utils import only_django_validation_errors


class ReservationUnitAccessTypeForm(forms.ModelForm):
    instance: ReservationUnitAccessType

    class Meta:
        model = ReservationUnitAccessType
        fields = ["access_type", "begin_date"]
        labels = {
            "access_type": _("Access type"),
            "begin_date": _("Access type begin date"),
        }
        help_texts = {
            "access_type": _("How is the reservee able to enter the space in their reservation unit?"),
            "begin_date": _("Begin date of this access type"),
        }

    @only_django_validation_errors()
    def clean(self) -> None:
        cleaned_data = super().clean()
        if not cleaned_data:
            return

        editing: bool = getattr(self.instance, "pk", None) is not None

        if editing and cleaned_data.get(DELETION_FIELD_NAME, False):
            self.validate_deletion()
            return

        access_type: str = cleaned_data["access_type"]
        begin_date: datetime.date = cleaned_data["begin_date"]
        reservation_unit: ReservationUnit = cleaned_data["reservation_unit"]

        if editing:
            self.instance.validators.validate_not_past(begin_date)
            self.instance.validators.validate_not_moved_to_past(begin_date)
        else:
            ReservationUnitAccessType.validators.validate_new_not_in_past(begin_date)

        if reservation_unit.pk is None:
            ReservationUnitAccessType.validators.validate_not_access_code(access_type)

        need_to_check_pindora = access_type == AccessType.ACCESS_CODE and (
            not editing or self.instance.access_type != AccessType.ACCESS_CODE
        )

        if need_to_check_pindora:
            try:
                PindoraClient.get_reservation_unit(reservation_unit)
            except ExternalServiceError as error:
                self.add_error("access_type", str(error))
                return

    def validate_deletion(self) -> None:
        self.instance.validators.validate_deleted_not_active_or_past()


class ReservationUnitAccessTypeFormSet(BaseInlineFormSet):
    form = ReservationUnitAccessTypeForm
    instance: ReservationUnit

    def clean(self) -> None:
        today = local_date()
        only_begun = (True for form in self.forms if form.cleaned_data.get("begin_date", datetime.date.max) <= today)
        has_active = next(only_begun, None) is not None
        if not has_active:
            msg = "At least one active access type is required."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MISSING_ACTIVE_ACCESS_TYPE)

    @transaction.atomic
    def save(self, commit: bool = True) -> list[ReservationUnitAccessType]:  # noqa: FBT001, FBT002
        access_types = super().save(commit=commit)
        self.instance.actions.update_access_types_for_reservations()
        return access_types

    def _should_delete_form(self, form: ReservationUnitAccessTypeForm) -> bool:
        # Required so errors from `validate_deletion` are not ignored.
        return (not form.errors) and super()._should_delete_form(form)


class ReservationUnitAdminForm(forms.ModelForm):
    instance: ReservationUnit

    access_type = forms.ChoiceField(choices=AccessType.choices, required=False)

    pindora_response = forms.CharField(
        widget=forms.Textarea(attrs={"disabled": True, "cols": "40", "rows": "1"}),
        required=False,
    )

    search_terms = DynamicArrayField(
        required=False,
        label=_("Search terms"),
        help_text=_(
            "Additional search terms that will bring up this reservation unit when making text searches "
            "in the customer UI. These terms should be added to make sure search results using text search in "
            "links from external sources work regardless of the UI language."
        ),
    )

    class Meta:
        model = ReservationUnit
        fields = []  # Use fields from ModelAdmin
        widgets = {
            "description": TinyMCE(),
            "notes_when_applying": TinyMCE(),
            "reservation_pending_instructions": TinyMCE(),
            "reservation_confirmed_instructions": TinyMCE(),
            "reservation_cancelled_instructions": TinyMCE(),
        }
        labels = {
            "ext_uuid": _("External UUID"),
            "name": _("Name"),
            "name_fi": _("Name (Finnish)"),
            "name_en": _("Name (English)"),
            "name_sv": _("Name (Swedish)"),
            "description": _("Description"),
            "description_fi": _("Description (Finnish)"),
            "description_en": _("Description (English)"),
            "description_sv": _("Description (Swedish)"),
            "spaces": _("Spaces"),
            "resources": _("Resources"),
            "purposes": _("Purposes"),
            "reservation_unit_type": _("Reservation unit type"),
            "equipments": _("Equipments"),
            "notes_when_applying": _("Notes when applying"),
            "notes_when_applying_fi": _("Notes when applying (Finnish)"),
            "notes_when_applying_en": _("Notes when applying (English)"),
            "notes_when_applying_sv": _("Notes when applying (Swedish)"),
            "payment_terms": _("Payment terms"),
            "cancellation_terms": _("Cancellation terms"),
            "service_specific_terms": _("Service specific terms"),
            "pricing_terms": _("Pricing terms"),
            "reservation_pending_instructions": _("Reservation pending instructions"),
            "reservation_pending_instructions_fi": _("Reservation pending instructions (Finnish)"),
            "reservation_pending_instructions_en": _("Reservation pending instructions (English)"),
            "reservation_pending_instructions_sv": _("Reservation pending instructions (Swedish)"),
            "reservation_confirmed_instructions": _("Reservation confirmed instructions"),
            "reservation_confirmed_instructions_fi": _("Reservation confirmed instructions (Finnish)"),
            "reservation_confirmed_instructions_en": _("Reservation confirmed instructions (English)"),
            "reservation_confirmed_instructions_sv": _("Reservation confirmed instructions (Swedish)"),
            "reservation_cancelled_instructions": _("Reservation cancelled instructions"),
            "reservation_cancelled_instructions_fi": _("Reservation cancelled instructions (Finnish)"),
            "reservation_cancelled_instructions_en": _("Reservation cancelled instructions (English)"),
            "reservation_cancelled_instructions_sv": _("Reservation cancelled instructions (Swedish)"),
            "unit": _("Unit"),
            "contact_information": _("Contact information"),
            "max_reservation_duration": _("Max reservation duration"),
            "min_reservation_duration": _("Min reservation duration"),
            "is_draft": _("Is draft"),
            "max_persons": _("Max persons"),
            "min_persons": _("Min persons"),
            "surface_area": _("Surface area"),
            "buffer_time_before": _("Buffer time before"),
            "buffer_time_after": _("Buffer time after"),
            "origin_hauki_resource": _("Origin hauki resource"),
            "cancellation_rule": _("Cancellation rule"),
            "reservation_start_interval": _("Reservation start interval"),
            "reservations_max_days_before": _("Reservations max days before"),
            "reservations_min_days_before": _("Reservations min days before"),
            "reservation_begins_at": _("Reservation begins"),
            "reservation_ends_at": _("Reservation ends"),
            "publish_begins_at": _("Publish begins"),
            "publish_ends_at": _("Publish ends"),
            "metadata_set": _("Reservation metadata set"),
            "reservation_form": _("Reservation form"),
            "max_reservations_per_user": _("Max reservations per user"),
            "require_adult_reservee": _("Require adult reservee"),
            "require_reservation_handling": _("Require reservation handling"),
            "authentication": _("Authentication"),
            "reservation_kind": _("Reservation kind"),
            "reservation_block_whole_day": _("Reservation block whole day"),
            "can_apply_free_of_charge": _("Can apply free of charge"),
            "allow_reservations_without_opening_hours": _("Allow reservations without opening hours"),
            "is_archived": _("Is archived"),
            "rank": _("Order number"),
            "payment_merchant": _("Payment merchant"),
            "payment_accounting": _("Payment accounting"),
            "payment_product": _("Payment product"),
            "search_terms": _("Search terms"),
            "pindora_response": _("Pindora API response"),
        }
        help_texts = {
            "ext_uuid": _("ID for external systems to use"),
            "name": _("Name"),
            "name_fi": _("Name (Finnish)"),
            "name_en": _("Name (English)"),
            "name_sv": _("Name (Swedish)"),
            "description": _("Description"),
            "description_fi": _("Description (Finnish)"),
            "description_en": _("Description (English)"),
            "description_sv": _("Description (Swedish)"),
            "spaces": _("Spaces"),
            "resources": _("Resources"),
            "purposes": _("Purposes"),
            "reservation_unit_type": _("Reservation unit type"),
            "equipments": _("Equipments"),
            "notes_when_applying": _("Notes when applying"),
            "notes_when_applying_fi": _("Notes when applying (Finnish)"),
            "notes_when_applying_en": _("Notes when applying (English)"),
            "notes_when_applying_sv": _("Notes when applying (Swedish)"),
            "payment_terms": _("Payment terms for the reservation unit."),
            "cancellation_terms": _("Cancellation terms for the reservation unit."),
            "service_specific_terms": _("Service specific terms for the reservation unit."),
            "pricing_terms": _("Pricing terms for the reservation unit."),
            "reservation_pending_instructions": _("Additional instructions for pending reservation"),
            "reservation_pending_instructions_fi": _("Additional instructions for pending reservation (Finnish)"),
            "reservation_pending_instructions_en": _("Additional instructions for pending reservation (English)"),
            "reservation_pending_instructions_sv": _("Additional instructions for pending reservation (Swedish)"),
            "reservation_confirmed_instructions": _("Additional instructions for confirmed reservation"),
            "reservation_confirmed_instructions_fi": _("Additional instructions for confirmed reservation (Finnish)"),
            "reservation_confirmed_instructions_en": _("Additional instructions for confirmed reservation (English)"),
            "reservation_confirmed_instructions_sv": _("Additional instructions for confirmed reservation (Swedish)"),
            "reservation_cancelled_instructions": _("Additional instructions for cancelled reservation"),
            "reservation_cancelled_instructions_fi": _("Additional instructions for cancelled reservations (Finnish)"),
            "reservation_cancelled_instructions_en": _("Additional instructions for cancelled reservations (English)"),
            "reservation_cancelled_instructions_sv": _("Additional instructions for cancelled reservations (Swedish)"),
            "unit": _("Unit"),
            "contact_information": _("Contact information"),
            "max_reservation_duration": _("Max reservation duration"),
            "min_reservation_duration": _("Min reservation duration"),
            "is_draft": _("Is this in draft state"),
            "max_persons": _("Maximum number of persons"),
            "min_persons": _("Minimum number of persons"),
            "surface_area": _("Surface area"),
            "buffer_time_before": _("Buffer time before reservation"),
            "buffer_time_after": _("Buffer time after reservation"),
            "origin_hauki_resource": _("Origin hauki resource"),
            "cancellation_rule": _("Cancellation rule"),
            "reservation_start_interval": _(
                "Determines the interval for the start time of the reservation. "
                "For example an interval of 15 minutes means a reservation can "
                "begin at minutes 15, 30, 60, or 90."
            ),
            "reservations_max_days_before": _("Minimum days before reservations can be made"),
            "reservations_min_days_before": _("Maximum number of days before reservations can be made"),
            "reservation_begins_at": _("Time when making reservations become possible for this reservation unit."),
            "reservation_ends_at": _("Time when making reservations become not possible for this reservation unit"),
            "publish_begins_at": _("Time after this reservation unit should be publicly visible in UI."),
            "publish_ends_at": _("Time after this reservation unit should not be publicly visible in UI."),
            "metadata_set": _(
                "Reservation metadata set that defines the set of supported "
                "and required form fields for this reservation unit."
            ),
            "reservation_form": _("Which reservation form is used for this reservation unit?"),
            "max_reservations_per_user": _("Maximum number of active reservations per user"),
            "require_adult_reservee": _(
                "Do reservations to this reservation unit require the reservee to be a legal adult?",
            ),
            "require_reservation_handling": _(
                "Do reservations to this reservation unit need to be handled before they're confirmed."
            ),
            "authentication": _("Authentication required for reserving this reservation unit."),
            "reservation_kind": _("What kind of reservations are to be booked with this reservation unit."),
            "reservation_block_whole_day": _("Reservation block whole day"),
            "can_apply_free_of_charge": _("Can reservations to this reservation unit be able to apply free of charge."),
            "allow_reservations_without_opening_hours": _(
                "Is it possible to reserve this reservation unit when opening hours are not defined."
            ),
            "is_archived": _("Is reservation unit archived."),
            "rank": _("Order number to be use in api sorting."),
            "payment_merchant": _("Merchant used for payments"),
            "payment_accounting": _("Payment accounting information"),
            "payment_product": _("Product used for payments"),
            "search_terms": _(
                "Additional search terms that will bring up this reservation unit when making text searches "
                "in the customer UI. These terms should be added to make sure search results using text search in "
                "links from external sources work regardless of the UI language."
            ),
            "pindora_response": _("Response from Pindora API"),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        qs = TermsOfUse.objects.all()
        self.base_fields["pricing_terms"].queryset = qs.filter(terms_type=TermsOfUseTypeChoices.PRICING)
        self.base_fields["payment_terms"].queryset = qs.filter(terms_type=TermsOfUseTypeChoices.PAYMENT)
        self.base_fields["cancellation_terms"].queryset = qs.filter(terms_type=TermsOfUseTypeChoices.CANCELLATION)
        self.base_fields["service_specific_terms"].queryset = qs.filter(terms_type=TermsOfUseTypeChoices.SERVICE)

        super().__init__(*args, **kwargs)

        editing: bool = getattr(self.instance, "pk", None) is not None
        if not editing:
            return

        if self.instance.access_types.active_or_future().filter(access_type=AccessType.ACCESS_CODE).exists():
            pindora_field = self.fields["pindora_response"]
            pindora_field.initial = self.get_pindora_response(self.instance)
            pindora_field.widget.attrs.update({"cols": "100", "rows": "10"})

    def get_pindora_response(self, obj: ReservationUnit) -> str | None:
        try:
            response = PindoraClient.get_reservation_unit(reservation_unit=obj)
        except ExternalServiceError as error:
            return str(error)

        return json.dumps(response, default=str, indent=2)


class ReservationUnitPricingInline(TranslationStackedInline):
    model = ReservationUnitPricing
    fields = [
        "begins",
        "is_activated_on_begins",
        "lowest_price",
        "highest_price",
        "price_unit",
        "payment_type",
        "tax_percentage",
        "material_price_description",
    ]
    show_change_link = True
    extra = 0
