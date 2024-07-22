from django.contrib import admin

from reservation_units.models import Qualifier


@admin.register(Qualifier)
class QualifierAdmin(admin.ModelAdmin):
    pass
