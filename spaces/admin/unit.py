from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin, messages
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin

from spaces.admin.location import LocationInline
from spaces.importers.tprek_unit_importer import TprekUnitImporter
from spaces.models import Unit
from utils.sentry import SentryLogger


@admin.register(Unit)
class UnitAdmin(SortableAdminMixin, ExtraButtonsMixin, TranslationAdmin):
    list_display = [
        "__str__",
        "payment_merchant",
        "payment_accounting",
        "tprek_id",
    ]
    list_filter = [
        "payment_merchant",
        "payment_accounting",
    ]
    ordering = ["rank"]

    actions = [
        "update_from_tprek",
    ]
    search_fields = [
        "name",
        "tprek_id",
    ]
    search_help_text = _("Search by name or TPREK ID")

    inlines = [
        LocationInline,
    ]
    readonly_fields = [
        "tprek_last_modified",
    ]

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
        except Exception as err:
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
