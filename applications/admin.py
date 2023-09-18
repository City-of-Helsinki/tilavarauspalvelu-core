from django.contrib import admin, messages
from django.forms.fields import CharField
from django.forms.models import ModelForm
from django.http import FileResponse
from sentry_sdk import capture_exception
from tinymce.widgets import TinyMCE

from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationEventStatus,
    ApplicationRound,
    ApplicationRoundBasket,
    ApplicationRoundStatus,
    ApplicationStatus,
    City,
    EventReservationUnit,
    Organisation,
    Person,
    Recurrence,
)
from applications.utils.export_data import ApplicationDataExporter


class ApplicationStatusInline(admin.TabularInline):
    model = ApplicationStatus


class ApplicationRoundStatusInline(admin.TabularInline):
    model = ApplicationRoundStatus


class ApplicationRoundBasketInline(admin.TabularInline):
    model = ApplicationRoundBasket


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    model = Application
    inlines = [ApplicationStatusInline]

    exclude = ("cached_latest_status",)


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    model = Organisation


class ApplicationEventStatusInline(admin.TabularInline):
    model = ApplicationEventStatus


class ApplicationEventScheduleInline(admin.TabularInline):
    model = ApplicationEventSchedule


@admin.register(ApplicationEvent)
class ApplicationEventAdmin(admin.ModelAdmin):
    model = ApplicationEvent
    inlines = [ApplicationEventScheduleInline, ApplicationEventStatusInline]


@admin.register(Recurrence)
class RecurrenceAdmin(admin.ModelAdmin):
    model = Recurrence


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    model = Address


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    model = Person


@admin.register(EventReservationUnit)
class EventReservationUnitAdmin(admin.ModelAdmin):
    model = EventReservationUnit


class ApplicationRoundAdminForm(ModelForm):
    criteria = CharField(widget=TinyMCE())
    criteria_fi = CharField(widget=TinyMCE())
    criteria_en = CharField(widget=TinyMCE())
    criteria_sv = CharField(widget=TinyMCE())

    class Meta:
        model = ApplicationRound
        fields = [
            "name",
            "name_fi",
            "name_en",
            "name_sv",
            "target_group",
            "allocating",
            "reservation_units",
            "application_period_begin",
            "application_period_end",
            "reservation_period_begin",
            "reservation_period_end",
            "public_display_begin",
            "public_display_end",
            "purposes",
            "service_sector",
            "criteria",
            "criteria_fi",
            "criteria_en",
            "criteria_sv",
        ]


@admin.register(ApplicationRound)
class ApplicationRoundAdmin(admin.ModelAdmin):
    actions = ["export_to_csv"]
    form = ApplicationRoundAdminForm
    model = ApplicationRound
    inlines = [ApplicationRoundStatusInline, ApplicationRoundBasketInline]
    autocomplete_fields = [
        "reservation_units",
    ]

    @admin.action(description="Export first selected reservation unit to CSV")
    def export_to_csv(self, request, queryset):
        try:
            app_round = queryset.first()
            path = ApplicationDataExporter.export_application_data(application_round=app_round)

        except Exception as e:
            self.message_user(
                request,
                f"Error while exporting applications: {e}",
                level=messages.ERROR,
            )

            capture_exception(e)
        else:
            if path:
                with open(path, "rb") as file:
                    return FileResponse(file)

            self.message_user(
                request,
                "No export data in selected application round.",
                level=messages.INFO,
            )


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    model = City
