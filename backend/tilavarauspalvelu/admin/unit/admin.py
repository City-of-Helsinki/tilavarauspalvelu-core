from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin, messages
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext
from modeltranslation.admin import TabbedTranslationAdmin

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.tprek.tprek_api_client import TprekLocationData, TprekUnitData
from tilavarauspalvelu.integrations.tprek.tprek_unit_importer import TprekUnitImporter
from tilavarauspalvelu.models import Unit, UnitGroup

from .form import UnitAdminForm

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


# The TPREK import overwrites these fields, so a change by hand would not last.
# The TPREK ID stays editable, so that staff can fix a wrong ID.
TPREK_FIELDS = [
    field.name
    for tprek_data_class in (TprekUnitData, TprekLocationData)
    for field in dataclasses.fields(tprek_data_class)
    if field.name != "tprek_id"
]


class UnitGroupInlineAdmin(admin.TabularInline):
    model = UnitGroup.units.through
    fk_name = "unit"
    fields = ("unitgroup",)
    readonly_fields = fields

    def has_add_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False


@admin.register(Unit)
class UnitAdmin(TVPAuditlogHistoryAdminMixin, SortableAdminMixin, ExtraButtonsMixin, TabbedTranslationAdmin):
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
    formfield_overrides = {
        models.URLField: {"assume_scheme": "https"},
    }
    fieldsets = [
        (
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
        ),
        (
            _("TPRek"),
            {
                "description": _(
                    "When the unit has a TPRek ID, the fields that come from TPRek cannot be changed here. "
                    "Change them in TPRek instead."
                ),
                "fields": [
                    "tprek_id",
                    "tprek_department_id",
                    "tprek_last_modified",
                ],
            },
        ),
        (
            _("Hauki"),
            {
                "fields": [
                    "origin_hauki_resource",
                ],
            },
        ),
        (
            _("Payment information"),
            {
                "fields": [
                    "payment_merchant",
                    "payment_accounting",
                ],
            },
        ),
        (
            _("Permission information"),
            {
                "fields": [
                    "allow_permissions_from_ad_groups",
                ],
            },
        ),
        (
            _("Location"),
            {
                "fields": [
                    "address_street",
                    "address_zip",
                    "address_city",
                    "coordinates",
                ],
            },
        ),
    ]
    readonly_fields = [
        "tprek_last_modified",
    ]
    inlines = [
        UnitGroupInlineAdmin,
    ]

    def get_readonly_fields(self, request: WSGIRequest, obj: Unit | None = None) -> list[str]:
        readonly_fields = list(super().get_readonly_fields(request, obj))
        if obj is not None and obj.tprek_id:
            readonly_fields += self.replace_orig_field(TPREK_FIELDS)
        return readonly_fields

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
            message = _("Could not import the units from TPREK. The error was reported to Sentry.")
            self.message_user(request, message, level=messages.ERROR)
        else:
            if not tprek_unit_importer.updated_units_count:
                self.message_user(request, _("No units were updated."), level=messages.WARNING)
            else:
                updated_count = tprek_unit_importer.updated_units_count
                msg = ngettext("Updated %(count)s unit.", "Updated %(count)s units.", updated_count) % {
                    "count": updated_count,
                }
                not_updated_count = len(queryset) - updated_count
                if not_updated_count:
                    skipped_msg = ngettext("Skipped %(count)s unit.", "Skipped %(count)s units.", not_updated_count) % {
                        "count": not_updated_count,
                    }
                    msg = f"{msg} {skipped_msg}"
                self.message_user(request, msg, level=messages.SUCCESS)

    @button(label=_("Update from TPREK"), change_form=True)
    def update_from_tprek_button(self, request: WSGIRequest, pk: int) -> None:
        self.update_from_tprek(request, Unit.objects.filter(pk=pk))
