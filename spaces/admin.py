from typing import Any

from adminsortable2.admin import SortableAdminMixin
from django.conf import settings
from django.contrib import admin, messages
from django.core.management import call_command
from django.forms import IntegerField, ModelForm
from django.utils.translation import gettext_lazy as _
from mptt.admin import MPTTModelAdmin

from common.fields.forms import ModelMultipleChoiceFilteredField
from spaces.models import Building, Location, RealEstate, ServiceSector, Space, Unit, UnitGroup


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
class UnitAdmin(SortableAdminMixin, admin.ModelAdmin):
    model = Unit
    inlines = [LocationInline]
    actions = ["update_from_tprek"]
    search_fields = ["name", "tprek_id"]
    list_display = ("__str__", "payment_merchant", "payment_accounting")
    list_filter = ("payment_merchant", "payment_accounting")

    @admin.action
    def update_from_tprek(self, request, queryset):
        ids = queryset.filter(tprek_id__isnull=False).values_list("tprek_id", flat=True)
        try:
            output = call_command("import_units", settings.TPREK_UNIT_URL, "--ids", *ids)
        except Exception as e:
            self.message_user(request, f"Error while importing units: {e}", level=messages.ERROR)
        else:
            self.message_user(request, output, level=messages.SUCCESS)


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
