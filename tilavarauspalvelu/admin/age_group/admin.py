from __future__ import annotations

from django.contrib import admin

from tilavarauspalvelu.models import AgeGroup


@admin.register(AgeGroup)
class AgeGroupAdmin(admin.ModelAdmin):
    pass
