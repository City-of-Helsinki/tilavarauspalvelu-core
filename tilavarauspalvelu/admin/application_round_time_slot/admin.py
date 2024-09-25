from django.contrib import admin

from applications.models import ApplicationRoundTimeSlot

from .form import ApplicationRoundTimeSlotForm


class ApplicationRoundTimeSlotInline(admin.TabularInline):
    model = ApplicationRoundTimeSlot
    form = ApplicationRoundTimeSlotForm
    show_change_link = True
    extra = 0
