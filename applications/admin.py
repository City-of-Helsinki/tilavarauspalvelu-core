from django.contrib import admin

from .models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationPeriod,
    ApplicationStatus,
    EventReservationUnit,
    Organisation,
    Person,
    Recurrence,
)


class ApplicationEventInline(admin.TabularInline):
    model = ApplicationEvent


class ApplicationStatusInline(admin.TabularInline):
    model = ApplicationStatus


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    model = Application
    inlines = [ApplicationStatusInline]


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


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    model = Address


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    model = Person


@admin.register(EventReservationUnit)
class EventReservationUnitAdmin(admin.ModelAdmin):
    model = EventReservationUnit
