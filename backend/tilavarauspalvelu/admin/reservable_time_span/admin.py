from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin

from tilavarauspalvelu.models import ReservableTimeSpan

if TYPE_CHECKING:
    from django.http import HttpRequest

    from tilavarauspalvelu.models import OriginHaukiResource


class ReservableTimeSpanInline(admin.TabularInline):
    model = ReservableTimeSpan
    fields = ("time_span_str",)
    readonly_fields = fields
    can_delete = False
    extra = 0

    def has_add_permission(self, request: HttpRequest, obj: OriginHaukiResource | None = None) -> bool:
        return False

    def time_span_str(self, obj: ReservableTimeSpan) -> str:
        return obj.get_datetime_str()
