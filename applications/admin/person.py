from django.contrib import admin

from applications.models import Person

from .forms.person import PersonAdminForm

__all__ = [
    "PersonAdmin",
]


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    model = PersonAdminForm
