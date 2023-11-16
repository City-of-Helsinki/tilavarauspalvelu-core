from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from applications.models import ApplicationEvent, ApplicationEventSchedule

from .forms.application_event import ApplicationEventAdminForm, ApplicationEventScheduleInlineAdminForm

__all__ = [
    "ApplicationEventAdmin",
]


class ApplicationEventScheduleInline(admin.StackedInline):
    model = ApplicationEventSchedule
    form = ApplicationEventScheduleInlineAdminForm
    extra = 0


@admin.register(ApplicationEvent)
class ApplicationEventAdmin(TranslationAdmin):
    form = ApplicationEventAdminForm
    list_display = [
        "name",
        "application",
        "begin",
        "end",
        "flagged",
    ]
    list_filter = [
        "events_per_week",
        "biweekly",
        "flagged",
        "age_group",
        "ability_group",
        "purpose",
    ]
    search_fields = [
        "name",
        "application__user__first_name",
        "application__user__last_name",
    ]

    inlines = [ApplicationEventScheduleInline]
