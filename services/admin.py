from django.contrib import admin

from services.models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    pass
