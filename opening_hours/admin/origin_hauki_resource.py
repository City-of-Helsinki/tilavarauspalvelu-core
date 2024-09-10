from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django import forms
from django.contrib import admin
from django.db.models import Count, QuerySet
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from common.typing import WSGIRequest
from opening_hours.models import OriginHaukiResource, ReservableTimeSpan
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from opening_hours.utils.reservable_time_span_client import NEVER_ANY_OPENING_HOURS_HASH
from reservation_units.models import ReservationUnit

__all__ = [
    "OriginHaukiResourceAdmin",
]


class ReservationUnitInline(admin.TabularInline):
    model = ReservationUnit
    fields = ["id", "reservation_unit_link"]
    readonly_fields = fields
    can_delete = False
    extra = 0

    def has_add_permission(self, request, obj=None) -> bool:
        return False

    def reservation_unit_link(self, obj):
        url = reverse("admin:reservation_units_reservationunit_change", args=(obj.pk,))

        return format_html(f"<a href={url}>{obj.name_fi}</a>")


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


class OriginHaukiResourceAdminForm(forms.ModelForm):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        if self.instance.opening_hours_hash == NEVER_ANY_OPENING_HOURS_HASH:
            self.Meta.help_texts["opening_hours_hash"] += " " + _(
                "OriginHaukiResources with this specific hash never have any opening hours."
            )

    class Meta:
        model = OriginHaukiResource
        fields = []  # Use fields from ModelAdmin
        help_texts = {
            "id": _("ID of the resource in Hauki."),
            "opening_hours_hash": _("Hash of the opening hours. Used to determine if the opening hours have changed."),
            "latest_fetched_date": _(
                "All opening hours have been fetched from Hauki up until this date. "
                "Opening hours are fetched until the last day of the month two years from now."
            ),
        }


@admin.register(OriginHaukiResource)
class OriginHaukiResourceAdmin(ExtraButtonsMixin, admin.ModelAdmin):
    # Functions
    actions = ["update_reservable_time_spans_action"]

    # List
    list_display = [
        "id",
        "linked_reservation_units",
        "reservable_time_spans_count",
        "latest_fetched_date",
    ]
    ordering = ["id"]

    # Form
    form = OriginHaukiResourceAdminForm
    inlines = [
        ReservationUnitInline,
        ReservableTimeSpanInline,
    ]
    readonly_fields = [
        "opening_hours_hash",
        "latest_fetched_date",
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return (
            super()
            .get_queryset(request)
            .annotate(reservable_time_spans_count=Count("reservable_time_spans"))
            .prefetch_related(
                "reservation_units",
                "reservation_units__unit",
                "reservable_time_spans",
            )
        )

    def get_readonly_fields(self, request: WSGIRequest, obj: OriginHaukiResource | None = None) -> list[str]:
        if obj:
            return ["id", *self.readonly_fields]
        return self.readonly_fields

    def reservable_time_spans_count(self, obj: OriginHaukiResource) -> int:
        return getattr(obj, "reservable_time_spans_count", -1)

    def linked_reservation_units(self, obj: OriginHaukiResource) -> str:
        return ", ".join(obj.reservation_units.values_list("name_fi", flat=True))

    @button(label="Update All Reservable Time Spans", change_list=True)
    def update_all_hauki_resources_reservable_time_spans(self, request: WSGIRequest) -> None:
        HaukiResourceHashUpdater().run(force_refetch=True)
        self.message_user(request, _("Reservable Time Spans updated."))

    @button(label="Update Reservable Time Spans", change_form=True)
    def update_single_hauki_resource_reservable_times_pans(self, request: WSGIRequest, pk: int) -> None:
        HaukiResourceHashUpdater([pk]).run(force_refetch=True)
        self.message_user(request, _("Reservable Time Spans updated."))

    def update_reservable_time_spans_action(self, request, queryset: QuerySet[OriginHaukiResource]) -> None:
        ids: list[int] = queryset.values_list("id", flat=True)
        HaukiResourceHashUpdater(ids).run(force_refetch=True)
        self.message_user(request, _("Reservable Time Spans updated."))
