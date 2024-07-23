from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from applications.models import Person

from .forms.person import PersonAdminForm

__all__ = [
    "PersonAdmin",
]


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    form = PersonAdminForm

    list_display = [
        "first_name",
        "last_name",
    ]

    search_fields = [
        "first_name",
        "last_name",
    ]
    search_help_text = _("Search by first name or last name.")
