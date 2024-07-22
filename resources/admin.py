from django.contrib import admin

from resources.models import Resource


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    pass
