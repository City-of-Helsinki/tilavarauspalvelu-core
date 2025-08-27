from __future__ import annotations

from typing import TYPE_CHECKING

from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TabbedTranslationAdmin

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.tprek.tprek_unit_importer import TprekUnitImporter
from tilavarauspalvelu.models import Unit, UnitGroup

from .form import UnitAdminForm

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


class UnitGroupInlineAdmin(admin.TabularInline):
    model = UnitGroup.units.through
    fk_name = "unit"
    fields = ["unitgroup"]
    readonly_fields = fields

    def has_add_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False


@admin.register(Unit)
class UnitAdmin(SortableAdminMixin, ExtraButtonsMixin, TabbedTranslationAdmin):
    # Functions
    actions = ["update_from_tprek"]
    search_fields = [
        "name",
        "tprek_id",
    ]
    search_help_text = _("Search by name or TPREK ID")

    # List
    list_display = [
        "rank",
        "__str__",
        "payment_merchant",
        "payment_accounting",
        "tprek_id",
        "allow_permissions_from_ad_groups",
    ]
    list_filter = [
        "payment_merchant",
        "payment_accounting",
        "allow_permissions_from_ad_groups",
    ]
    ordering = ["rank"]

    # Form
    form = UnitAdminForm
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "name",
                    "description",
                    "short_description",
                    "web_page",
                    "email",
                    "phone",
                    "search_terms",
                ],
            },
        ],
        [
            _("TPRek"),
            {
                "fields": [
                    "tprek_id",
                    "tprek_department_id",
                    "tprek_last_modified",
                ],
            },
        ],
        [
            _("Hauki"),
            {
                "fields": [
                    "origin_hauki_resource",
                ],
            },
        ],
        [
            _("Payment information"),
            {
                "fields": [
                    "payment_merchant",
                    "payment_accounting",
                ],
            },
        ],
        [
            _("Permission information"),
            {
                "fields": [
                    "allow_permissions_from_ad_groups",
                ],
            },
        ],
        [
            _("Location"),
            {
                "fields": [
                    "address_street",
                    "address_zip",
                    "address_city",
                    "coordinates",
                ],
            },
        ],
    ]
    readonly_fields = [
        "tprek_last_modified",
    ]
    inlines = [
        UnitGroupInlineAdmin,
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet[Unit]:
        return (
            super()
            .get_queryset(request)
            .select_related(
                "origin_hauki_resource",
                "payment_merchant",
                "payment_accounting",
            )
            .prefetch_related(
                "unit_groups",
            )
        )

    @admin.action
    def update_from_tprek(self, request: WSGIRequest, queryset: QuerySet[Unit]) -> None:
        """
        Update selected units from TPREK data.

        Even if the TPREK data has not changed since the last update, the unit's data is still updated.
        """
        units: QuerySet[Unit] = queryset.exclude(tprek_id__isnull=True)
        tprek_unit_importer = TprekUnitImporter()
        try:
            tprek_unit_importer.update_unit_from_tprek(units, force_update=True)
        except Exception as err:  # noqa: BLE001
            details = f"Tried to import units from TPREK: '{units.values_list('pk', flat=True)}'"
            SentryLogger.log_exception(err, details=details)
            self.message_user(request, f"Error while importing units from TPREK: {err}", level=messages.ERROR)
        else:
            if not tprek_unit_importer.updated_units_count:
                self.message_user(request, "No units were updated.", level=messages.WARNING)
            else:
                msg = f"Updated {tprek_unit_importer.updated_units_count} units."
                not_updated_count = len(queryset) - tprek_unit_importer.updated_units_count
                if not_updated_count:
                    msg += f" Skipped {not_updated_count} units."
                self.message_user(request, msg, level=messages.SUCCESS)

    @button(label="Update from TPREK", change_form=True)
    def update_from_tprek_button(self, request: WSGIRequest, pk: int) -> None:
        self.update_from_tprek(request, Unit.objects.filter(pk=pk))
