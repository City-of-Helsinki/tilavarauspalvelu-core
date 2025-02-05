from __future__ import annotations

from typing import TYPE_CHECKING

from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django.contrib import admin

from tilavarauspalvelu.models import ReservationUnitHierarchy

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest


@admin.register(ReservationUnitHierarchy)
class ReservationUnitHierarchyAdmin(ExtraButtonsMixin, admin.ModelAdmin):
    # List
    ordering = ["reservation_unit"]

    # Form
    readonly_fields = [
        "reservation_unit",
        "related_reservation_unit_ids",
    ]

    @button(label="Refresh reservation unit hierarchy", change_list=True)
    def refresh_data(self, request: WSGIRequest) -> None:
        ReservationUnitHierarchy.refresh()
        self.message_user(request, "Reservation unit hierarchy was refreshed successfully.")

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_delete_permission(self, request: WSGIRequest, obj=None) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj=None) -> bool:
        return True
