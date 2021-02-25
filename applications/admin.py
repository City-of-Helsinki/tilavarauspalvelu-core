from django.contrib import admin

from .models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventStatus,
    ApplicationRound,
    ApplicationRoundBasket,
    ApplicationRoundStatus,
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


@admin.register(ApplicationEvent)
class ApplicationEventAdmin(admin.ModelAdmin):
    model = ApplicationEvent
    inlines = [ApplicationEventStatusInline]


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


@admin.register(ApplicationRound)
class ApplicationRoundAdmin(admin.ModelAdmin):
    model = ApplicationRound
    inlines = [ApplicationRoundStatusInline, ApplicationRoundBasketInline]
