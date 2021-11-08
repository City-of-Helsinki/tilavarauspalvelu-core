from django.contrib import admin

from terms_of_use.models import TermsOfUse


@admin.register(TermsOfUse)
class DistrictAdmin(admin.ModelAdmin):
    model = TermsOfUse
