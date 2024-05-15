from typing import Any

from admin_extra_buttons.api import ExtraButtonsMixin, button
from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin, messages
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.forms import IntegerField, ModelForm
from django.utils.translation import gettext_lazy as _
from mptt.admin import MPTTModelAdmin

from common.fields.forms import ModelMultipleChoiceFilteredField
from spaces.importers.tprek_unit_importer import TprekUnitImporter
from spaces.models import Building, Location, RealEstate, ServiceSector, Space, Unit, UnitGroup
from utils.sentry import SentryLogger


class LocationInline(admin.TabularInline):
    model = Location
    fields = ["address_street", "address_zip", "address_city", "coordinates"]


class SpaceInline(admin.TabularInline):
    model = Space


@admin.register(RealEstate)
class RealEstateAdmin(admin.ModelAdmin):
    model = RealEstate
    inlines = [LocationInline]


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    model = Building
    inlines = [LocationInline]


@admin.register(Space)
class SpaceAdmin(MPTTModelAdmin):
    model = Space
    inlines = [LocationInline, SpaceInline]


@admin.register(Unit)
class UnitAdmin(SortableAdminMixin, ExtraButtonsMixin, admin.ModelAdmin):
    model = Unit
    inlines = [LocationInline]
    actions = ["update_from_tprek"]
    search_fields = ["name", "tprek_id"]
    list_display = ("__str__", "payment_merchant", "payment_accounting")
    list_filter = ("payment_merchant", "payment_accounting")
    readonly_fields = ("tprek_last_modified",)

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

    @button(label="Update from TPREK")
    def update_from_tprek_button(self, request: WSGIRequest, pk: int) -> None:
        self.update_from_tprek(request, Unit.objects.filter(pk=pk))


class UnitGroupForm(ModelForm):
    units = ModelMultipleChoiceFilteredField(
        Unit.objects.all(),
        help_text=_("Selected units for this unit group."),
    )

    selected_units = IntegerField(
        required=False,
        disabled=True,
        help_text=_("Previously selected number of units for this unit group."),
    )

    class Meta:
        model = UnitGroup
        fields = [
            "name_fi",
            "name_en",
            "name_sv",
            "units",
        ]
        help_texts = {
            "name_fi": _("Name of the unit group in Finnish."),
            "name_en": _("Name of the unit group in English."),
            "name_sv": _("Name of the unit group in Swedish."),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        instance: UnitGroup | None = kwargs.get("instance", None)
        if instance is not None:
            self.fields["selected_units"].initial = instance.units.count()


@admin.register(UnitGroup)
class UnitGroupAdmin(admin.ModelAdmin):
    model = UnitGroup
    form = UnitGroupForm
    search_fields = ["name"]
    list_display = ("__str__", "number_of_units")

    @staticmethod
    def number_of_units(obj: UnitGroup) -> int:
        return obj.units.count()


class ServiceSectorForm(ModelForm):
    units = ModelMultipleChoiceFilteredField(
        Unit.objects.all(),
        help_text=_("Selected units for this service sector."),
    )

    selected_units = IntegerField(
        required=False,
        disabled=True,
        help_text=_("Previously selected number of units for this service sector."),
    )

    class Meta:
        model = UnitGroup
        fields = [
            "name_fi",
            "name_en",
            "name_sv",
            "units",
        ]
        help_texts = {
            "name_fi": _("Name of the service sector in Finnish."),
            "name_en": _("Name of the service sector in English."),
            "name_sv": _("Name of the service sector in Swedish."),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        instance: ServiceSector | None = kwargs.get("instance", None)
        if instance is not None:
            self.fields["selected_units"].initial = instance.units.count()


@admin.register(ServiceSector)
class ServiceSectorAdmin(admin.ModelAdmin):
    model = ServiceSector
    form = ServiceSectorForm
    list_display = ("__str__", "number_of_units")

    @staticmethod
    def number_of_units(obj: ServiceSector) -> int:
        return obj.units.count()
