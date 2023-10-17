from django import forms
from django.utils.translation import gettext_lazy as _

from applications.models import ApplicationEvent, ApplicationEventSchedule

__all__ = [
    "ApplicationEventAdminForm",
    "ApplicationEventScheduleInlineAdminForm",
]


class ApplicationEventAdminForm(forms.ModelForm):
    class Meta:
        model = ApplicationEvent
        fields = [
            "name",
            "num_persons",
            "min_duration",
            "max_duration",
            "begin",
            "end",
            "events_per_week",
            "biweekly",
            "flagged",
            "application",
            "age_group",
            "ability_group",
            "purpose",
            "declined_reservation_units",
        ]
        help_texts = {
            "name": _("Name that describes this event."),
            "num_persons": _("Number of persons that are excepted to attend this event."),
            "min_duration": _("Minimum duration of reservations allocated for this event."),
            "max_duration": _("Maximum duration of reservations allocated for this event."),
            "begin": _("First date on which reservations for this event are created."),
            "end": _("Last date on which reservations for this event are created."),
            "events_per_week": _("Number of reservations created per week (every other week if biweekly)."),
            "biweekly": _("Whether reservations are created every other week."),
            "flagged": _("Whether this event is flagged for manual review."),
            "application": _("Application this event is in."),
            "age_group": _("Age group for this event."),
            "ability_group": _("Ability group for this event."),
            "purpose": _("Purpose for this event."),
            "declined_reservation_units": _("Reservation units that are declined for this event."),
        }


class ApplicationEventScheduleInlineAdminForm(forms.ModelForm):
    class Meta:
        model = ApplicationEventSchedule
        fields = [
            "priority",
            "day",
            "begin",
            "end",
            "declined",
            "allocated_day",
            "allocated_begin",
            "allocated_end",
            "allocated_reservation_unit",
        ]
        help_texts = {
            "priority": _("Priority of event."),
            "day": _("Requested day of the week."),
            "begin": _("Requested start time of event."),
            "end": _("Requested end time of event."),
            "declined": _("Has this event been declined or not."),
            "allocated_day": _("Allocated day of event."),
            "allocated_begin": _("Allocated start time of event."),
            "allocated_end": _("Allocated end time of event."),
            "allocated_reservation_unit": _("Allocated reservation unit."),
        }
