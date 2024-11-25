from __future__ import annotations

from typing import Any

from django import forms
from django.utils.translation import gettext_lazy as _
from tinymce.widgets import TinyMCE

from tilavarauspalvelu.enums import TermsOfUseTypeChoices
from tilavarauspalvelu.models import ReservationUnit, TermsOfUse


class ReservationUnitAdminForm(forms.ModelForm):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        qs = TermsOfUse.objects.all()
        self.base_fields["pricing_terms"].queryset = qs.filter(terms_type=TermsOfUseTypeChoices.PRICING)
        self.base_fields["payment_terms"].queryset = qs.filter(terms_type=TermsOfUseTypeChoices.PAYMENT)
        self.base_fields["cancellation_terms"].queryset = qs.filter(terms_type=TermsOfUseTypeChoices.CANCELLATION)
        self.base_fields["service_specific_terms"].queryset = qs.filter(terms_type=TermsOfUseTypeChoices.SERVICE)
        super().__init__(*args, **kwargs)

    class Meta:
        model = ReservationUnit
        fields = []  # Use fields from ModelAdmin
        widgets = {
            "description": TinyMCE(),
            "terms_of_use": TinyMCE(),
        }
        labels = {
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
            "keyword_groups": _("Keyword groups"),
            "resources": _("Resources"),
            "services": _("Services"),
            "purposes": _("Purposes"),
            "qualifiers": _("Qualifiers"),
            "reservation_unit_type": _("Reservation unit type"),
            "require_introduction": _("Require introduction"),
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
            "require_reservation_handling": _("Does the reservations of this require a handling"),
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
            "uuid": _("UUID"),
            "payment_product": _("Payment product"),
        }
        help_texts = {
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
            "keyword_groups": _("Keyword gruops"),
            "resources": _("Resources"),
            "services": _("Services"),
            "purposes": _("Purposes"),
            "qualifiers": _("Qualifiers"),
            "reservation_unit_type": _("Reservation unit type"),
            "require_introduction": _("Require introduction"),
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
            "require_reservation_handling": _(
                "Does reservations of this reservation unit need to be handled before they're confirmed."
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
            "uuid": _("UUID"),
            "payment_product": _("Product used for payments"),
        }
