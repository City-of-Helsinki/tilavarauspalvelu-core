from django.contrib import admin

from .models import RecurringReservation, Reservation, ReservationPurpose


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    model = Reservation


@admin.register(RecurringReservation)
class RecurringReservationAdmin(admin.ModelAdmin):
    model = RecurringReservation


@admin.register(ReservationPurpose)
class ReservationPurposeAdmin(admin.ModelAdmin):
    model = ReservationPurpose
