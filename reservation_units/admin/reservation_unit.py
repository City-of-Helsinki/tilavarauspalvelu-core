from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin, messages
from django.http import FileResponse
from django.utils.translation import gettext_lazy as _

from applications.models import ApplicationRoundTimeSlot
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from reservation_units.enums import ReservationKind
from reservation_units.models import ReservationUnit, ReservationUnitImage, ReservationUnitPricing
from reservation_units.utils.export_data import ReservationUnitExporter

from .forms.application_round_time_slot import ApplicationRoundTimeSlotForm
from .forms.reservation_unit import ReservationUnitAdminForm


class ReservationUnitImageInline(admin.TabularInline):
    model = ReservationUnitImage
    readonly_fields = ["large_url", "medium_url", "small_url"]


class ReservationUnitPricingInline(admin.TabularInline):
    model = ReservationUnitPricing


class ApplicationRoundTimeSlotInline(admin.TabularInline):
    model = ApplicationRoundTimeSlot
    form = ApplicationRoundTimeSlotForm
    extra = 0


@admin.register(ReservationUnit)
class ReservationUnitAdmin(SortableAdminMixin, admin.ModelAdmin):
    model = ReservationUnit
    form = ReservationUnitAdminForm
    actions = [
        "export_to_csv",
    ]
    inlines = [
        ReservationUnitImageInline,
        ReservationUnitPricingInline,
        ApplicationRoundTimeSlotInline,
    ]
    list_filter = ["is_archived", "is_draft"]
    filter_horizontal = [
        "spaces",
        "purposes",
        "resources",
        "services",
        "equipments",
        "keyword_groups",
    ]
    readonly_fields = [
        "uuid",
        "payment_product",
    ]

    search_fields = [
        "pk__iexact",
        "name",
        "unit__name",
        "unit__service_sectors__name",
    ]
    search_help_text = _("Search by ID, name, unit name, or service sector name")

    ordering = ["rank"]

    def get_search_results(self, request, queryset, search_term):
        queryset, may_have_duplicates = super().get_search_results(request, queryset, search_term)

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
