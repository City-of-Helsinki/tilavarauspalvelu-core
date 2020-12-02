from django.contrib import admin

from .models import (
    Application,
    ApplicationEvent,
    ApplicationPeriod,
    Organisation,
    Person,
    Recurrence,
)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    model = Application


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    model = Organisation


@admin.register(ApplicationEvent)
class ApplicationEventAdmin(admin.ModelAdmin):
    model = ApplicationEvent


@admin.register(Recurrence)
class RecurrenceAdmin(admin.ModelAdmin):
    model = Recurrence


@admin.register(ApplicationPeriod)
class ApplicationPeriodAdmin(admin.ModelAdmin):
    model = ApplicationPeriod
