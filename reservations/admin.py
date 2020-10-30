from django.contrib import admin
from .models import Reservation, ReservationUnit, Introduction


@admin.register(ReservationUnit)
class ReservationUnitAdmin(admin.ModelAdmin):
    model = ReservationUnit


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    model = Reservation
