from typing import Any

from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin, messages
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.http import FileResponse
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TabbedTranslationAdmin

from applications.models import ApplicationRoundTimeSlot
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from reservation_units.admin.reservation_unit.form import ApplicationRoundTimeSlotForm, ReservationUnitAdminForm
from reservation_units.enums import ReservationKind
from reservation_units.models import ReservationUnit, ReservationUnitImage, ReservationUnitPricing
from reservation_units.utils.export_data import ReservationUnitExporter

__all__ = [
    "ReservationUnitAdmin",
]


class ReservationUnitImageInline(admin.TabularInline):
    model = ReservationUnitImage
    readonly_fields = ["large_url", "medium_url", "small_url"]
    extra = 0


class ReservationUnitPricingInline(admin.TabularInline):
    model = ReservationUnitPricing
    show_change_link = True
    extra = 0


class ApplicationRoundTimeSlotInline(admin.TabularInline):
    model = ApplicationRoundTimeSlot
    form = ApplicationRoundTimeSlotForm
    show_change_link = True
    extra = 0


@admin.register(ReservationUnit)
class ReservationUnitAdmin(SortableAdminMixin, TabbedTranslationAdmin):
    # Functions
    actions = ["export_to_csv"]
    search_fields = [
        # 'id' handled separately in `get_search_results()`
        "name",
        "unit__name",
        "unit__service_sectors__name",
    ]
    search_help_text = _("Search by ID, name, unit name, or service sector name")

    # List
    list_display = [
        "rank",
        "name",
        "unit",
        "origin_hauki_resource",
        "publishing_state",
        "reservation_state",
    ]
    list_filter = [
        "is_archived",
        "is_draft",
    ]
    ordering = ["rank"]

    # Form
    form = ReservationUnitAdminForm
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "id",
                    "name",
                    "description",
                    "unit",
                    "reservation_unit_type",
                    "sku",
                    "contact_information",
                    "max_persons",
                    "min_persons",
                    "surface_area",
                    "cancellation_rule",
                    "metadata_set",
                    "origin_hauki_resource",
                    "allow_reservations_without_opening_hours",
                    "require_introduction",
                    "require_reservation_handling",
                    "reservation_block_whole_day",
                    "is_draft",
                    "is_archived",
                    "publishing_state",
                    "reservation_state",
                ],
            },
        ],
        [
            _("Reservation restrictions"),
            {
                "fields": [
                    "reservation_kind",
                    "authentication",
                    "reservation_start_interval",
                    "min_reservation_duration",
                    "max_reservation_duration",
                    "buffer_time_before",
                    "buffer_time_after",
                    "reservations_min_days_before",
                    "reservations_max_days_before",
                    "reservation_begins",
                    "reservation_ends",
                    "publish_begins",
                    "publish_ends",
                    "max_reservations_per_user",
                ],
            },
        ],
        [
            _("Relations"),
            {
                "fields": [
                    "spaces",
                    "resources",
                    "equipments",
                    "services",
                    "purposes",
                    "keyword_groups",
                    "qualifiers",
                ],
            },
        ],
        [
            _("Payment"),
            {
                "fields": [
                    "payment_merchant",
                    "payment_accounting",
                    "can_apply_free_of_charge",
                    "payment_types",
                ],
            },
        ],
        [
            _("Terms of use"),
            {
                "fields": [
                    "payment_terms",
                    "cancellation_terms",
                    "service_specific_terms",
                    "pricing_terms",
                    "terms_of_use",
                ],
            },
        ],
        [
            _("Instructions"),
            {
                "fields": [
                    "reservation_pending_instructions",
                    "reservation_confirmed_instructions",
                    "reservation_cancelled_instructions",
                ],
            },
        ],
    ]
    filter_horizontal = [
        "spaces",
        "purposes",
        "qualifiers",
        "resources",
        "services",
        "equipments",
        "keyword_groups",
        "payment_types",
    ]
    readonly_fields = [
        "id",
        "uuid",
        "payment_product",
        "publishing_state",
        "reservation_state",
    ]
    inlines = [
        ReservationUnitImageInline,
        ReservationUnitPricingInline,
        ApplicationRoundTimeSlotInline,
    ]

    @admin.display
    def publishing_state(self, obj: ReservationUnit) -> str:
        return obj.state.value

    @admin.display
    def reservation_state(self, obj: ReservationUnit) -> str:
        return obj.reservation_state.value

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("unit", "origin_hauki_resource")

    def get_search_results(
        self,
        request: WSGIRequest,
        queryset: models.QuerySet,
        search_term: Any,
    ) -> tuple[models.QuerySet, bool]:
        queryset, may_have_duplicates = super().get_search_results(request, queryset, search_term)

        if str(search_term).isdigit():
            queryset |= self.model.objects.filter(id__exact=int(search_term))

        model_name = request.GET.get("model_name")
        if model_name == "applicationround":
            queryset = queryset.exclude(reservation_kind=ReservationKind.DIRECT)

        return queryset, may_have_duplicates

    @admin.action(description="Export selected reservation units to CSV")
    def export_to_csv(self, request, queryset):
        try:
            path = ReservationUnitExporter.export_reservation_unit_data(queryset=queryset)
        except Exception as e:
            self.message_user(
                request,
                f"Error while exporting reservation units: {e}",
                level=messages.ERROR,
            )
        else:
            # Filehandler needs to be left open for Django to be able to stream the file
            # Should fix the exporter to use an in-memory stream instead of writing to a file.
            return FileResponse(open(path, "rb"))  # noqa: SIM115

    def save_model(self, request, obj, form, change) -> None:
        super().save_model(request, obj, form, change)

        # Update ReservableTimeSpans for HaukiResource when ReservationUnit is saved
        if obj.origin_hauki_resource_id:
            HaukiResourceHashUpdater(hauki_resource_ids=[obj.origin_hauki_resource.id]).run(force_refetch=True)
