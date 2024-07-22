from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest

from reservation_units.models import ReservationUnitHierarchy


@admin.register(ReservationUnitHierarchy)
class ReservationUnitHierarchyAdmin(ExtraButtonsMixin, admin.ModelAdmin):
    readonly_fields = ["reservation_unit", "related_reservation_unit_ids"]
    ordering = ["reservation_unit"]

    @button(label="Refresh reservation unit hierarchy", change_list=True)
    def refresh_data(self, request: WSGIRequest) -> None:
        ReservationUnitHierarchy.refresh()
        self.message_user(request, "Reservation unit hierarchy was refreshed successfully.")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return True
