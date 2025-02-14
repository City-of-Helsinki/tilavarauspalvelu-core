from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

from django import forms
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from subforms.fields import DynamicArrayField
from tinymce.widgets import TinyMCE

from tilavarauspalvelu.enums import AccessType, TermsOfUseTypeChoices
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.models import ReservationUnit, TermsOfUse
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    import datetime


class ReservationUnitAdminForm(forms.ModelForm):
    instance: ReservationUnit

    access_type = forms.ChoiceField(choices=AccessType.model_choices, required=False)

    pindora_response = forms.CharField(
        widget=forms.Textarea(attrs={"disabled": True, "cols": "40", "rows": "1"}),
        required=False,
    )

    search_terms = DynamicArrayField(
        required=False,
        default=list,
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
            "terms_of_use": TinyMCE(),
            "reservation_pending_instructions": TinyMCE(),
            "reservation_confirmed_instructions": TinyMCE(),
            "reservation_cancelled_instructions": TinyMCE(),
        }
        labels = {
            "uuid": _("External UUID"),
            "sku": _("SKU"),
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
            "qualifiers": _("Qualifiers"),
            "reservation_unit_type": _("Reservation unit type"),
            "equipments": _("Equipments"),
            "terms_of_use": _("Terms of use"),
            "terms_of_use_fi": _("Terms of use (Finnish)"),
            "terms_of_use_en": _("Terms of use (English)"),
            "terms_of_use_sv": _("Terms of use (Swedish)"),
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
            "reservation_begins": _("Reservation begins"),
            "reservation_ends": _("Reservation ends"),
            "publish_begins": _("Publish begins"),
            "publish_ends": _("Publish ends"),
            "metadata_set": _("Reservation metadata set"),
            "max_reservations_per_user": _("Max reservations per user"),
            "require_adult_reservee": _("Require adult reservee"),
            "require_reservation_handling": _("Require reservation handling"),
            "authentication": _("Authentication"),
            "reservation_kind": _("Reservation kind"),
            "payment_types": _("Payment types"),
            "reservation_block_whole_day": _("Reservation block whole day"),
            "can_apply_free_of_charge": _("Can apply free of charge"),
            "allow_reservations_without_opening_hours": _("Allow reservations without opening hours"),
            "is_archived": _("Is archived"),
            "rank": _("Order number"),
            "payment_merchant": _("Payment merchant"),
            "payment_accounting": _("Payment accounting"),
            "payment_product": _("Payment product"),
            "search_terms": _("Search terms"),
            "access_type": _("Access type"),
            "access_type_start_date": _("Access type start date"),
            "access_type_end_date": _("Access type end date"),
            "pindora_response": _("Pindora API response"),
        }
        help_texts = {
            "uuid": _("ID for external systems to use"),
            "sku": _("SKU"),
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
            "qualifiers": _("Qualifiers"),
            "reservation_unit_type": _("Reservation unit type"),
            "equipments": _("Equipments"),
            "terms_of_use": _("Terms of use"),
            "terms_of_use_fi": _("Terms of use (Finnish)"),
            "terms_of_use_en": _("Terms of use (English)"),
            "terms_of_use_sv": _("Terms of use (Swedish)"),
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
            "reservation_begins": _("Time when making reservations become possible for this reservation unit."),
            "reservation_ends": _("Time when making reservations become not possible for this reservation unit"),
            "publish_begins": _("Time after this reservation unit should be publicly visible in UI."),
            "publish_ends": _("Time after this reservation unit should not be publicly visible in UI."),
            "metadata_set": _(
                "Reservation metadata set that defines the set of supported "
                "and required form fields for this reservation unit."
            ),
            "max_reservations_per_user": _("Maximum number of active reservations per user"),
            "require_adult_reservee": _(
                "Do reservations to this reservation unit require the reservee to be a legal adult?",
            ),
            "require_reservation_handling": _(
                "Do reservations to this reservation unit need to be handled before they're confirmed."
            ),
            "authentication": _("Authentication required for reserving this reservation unit."),
            "reservation_kind": _("What kind of reservations are to be booked with this reservation unit."),
            "payment_types": _("Payment types"),
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
            "access_type": _("How is the reservee able to enter the space in their reservation unit?"),
            "access_type_start_date": _(
                "If set, this is the date from which the access type is used. If current date is "
                "before this date, the access type is 'unrestricted'."
            ),
            "access_type_end_date": _(
                "If set, this is the date before which the access type is used. If current date is "
                "after this date, the access type is 'unrestricted'."
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

        if self.instance and self.instance.access_type == AccessType.ACCESS_CODE:
            pindora_field = self.fields["pindora_response"]
            pindora_field.initial = self.get_pindora_response(self.instance)
            pindora_field.widget.attrs.update({"cols": "100", "rows": "10"})

    def get_pindora_response(self, obj: ReservationUnit) -> str | None:
        if obj.access_type != AccessType.ACCESS_CODE:
            return None

        response = PindoraClient.get_reservation_unit(reservation_unit=obj)

        if response is None:
            return None

        return json.dumps(response, default=str, indent=2)

    def clean(self) -> None:
        cleaned_data = super().clean()
        if not cleaned_data:
            return

        access_type: str | None = cleaned_data.get("access_type")

        # Check if reservation unit has been configured in Pindora.
        # No need to check if access type is already 'ACCESS_CODE'.
        if access_type == AccessType.ACCESS_CODE and self.instance.access_type != AccessType.ACCESS_CODE:
            try:
                PindoraClient.get_reservation_unit(self.instance)
            except ExternalServiceError as error:
                self.add_error("access_type", str(error))
                return

    @transaction.atomic
    def save(self, commit: bool = True) -> ReservationUnit:  # noqa: FBT001, FBT002
        access_type: str = self.cleaned_data.get("access_type")
        access_type_start_date: datetime.date | None = self.cleaned_data.get("access_type_start_date")
        access_type_end_date: datetime.date | None = self.cleaned_data.get("access_type_end_date")

        reservation_unit: ReservationUnit = super().save(commit=commit)
        reservation_unit.actions.update_access_type_for_reservations(
            access_type=AccessType(access_type),
            access_type_start_date=access_type_start_date,
            access_type_end_date=access_type_end_date,
        )
        return reservation_unit
