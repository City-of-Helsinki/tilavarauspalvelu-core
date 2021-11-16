from django.contrib import admin

from .models import (
    AbilityGroup,
    AgeGroup,
    RecurringReservation,
    Reservation,
    ReservationCancelReason,
    ReservationPurpose,
)


class ReservationInline(admin.TabularInline):
    model = Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    model = Reservation


@admin.register(RecurringReservation)
class RecurringReservationAdmin(admin.ModelAdmin):
    model = RecurringReservation
    inlines = [ReservationInline]


@admin.register(ReservationPurpose)
class ReservationPurposeAdmin(admin.ModelAdmin):
    model = ReservationPurpose


@admin.register(AgeGroup)
class AgeGroupAdmin(admin.ModelAdmin):
    model = AgeGroup


@admin.register(AbilityGroup)
class AbilityGroupAdmin(admin.ModelAdmin):
    model = AbilityGroup


@admin.register(ReservationCancelReason)
class ReservationCancelReasonAdmin(admin.ModelAdmin):
    model = ReservationCancelReason
