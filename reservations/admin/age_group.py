from django.contrib import admin

from reservations.models import AgeGroup

__all__ = [
    "AgeGroupAdmin",
]


@admin.register(AgeGroup)
class AgeGroupAdmin(admin.ModelAdmin):
    pass
