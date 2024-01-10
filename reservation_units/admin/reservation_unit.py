from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin, messages
from django.http import FileResponse

from applications.models import ApplicationRoundTimeSlot
from reservation_units.models import ReservationKind, ReservationUnit, ReservationUnitImage, ReservationUnitPricing
from reservation_units.utils.export_data import ReservationUnitExporter

from .forms.reservation_unit import ApplicationRoundTimeSlotForm, ReservationUnitAdminForm


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
    readonly_fields = [
        "uuid",
        "payment_product",
    ]
    search_fields = [
        "name",
        "unit__name",
        "pk__iexact",
        "unit__service_sectors__name",
    ]
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
