from django.contrib import admin
from .models import FixedResource, MovableResource


@admin.register(MovableResource)
class MovableResourceAdmin(admin.ModelAdmin):
    model = MovableResource


@admin.register(FixedResource)
class FixedResourceAdmin(admin.ModelAdmin):
    model = FixedResource
