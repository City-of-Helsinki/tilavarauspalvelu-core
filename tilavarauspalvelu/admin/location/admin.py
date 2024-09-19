from django.contrib import admin

from tilavarauspalvelu.models import Location


class LocationInline(admin.StackedInline):
    model = Location
    extra = 0
    show_change_link = True
    fields = [
        "address_street",
        "address_zip",
        "address_city",
        "coordinates",
    ]
