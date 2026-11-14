from django.contrib import admin

from tilavarauspalvelu.models import ReservableTimeSpan


class ReservableTimeSpanInline(admin.TabularInline):
    model = ReservableTimeSpan
    fields = ["time_span_str"]
    readonly_fields = fields
    can_delete = False
    extra = 0

    def has_add_permission(self, request, obj=None) -> bool:
        return False

    def time_span_str(self, obj: ReservableTimeSpan) -> str:
        return obj.get_datetime_str()
