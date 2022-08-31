from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.utils.anonymisation import anonymize_user_data

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    actions = ["anonymize_user_data"]

    list_display = DjangoUserAdmin.list_display + ("reservation_notification",)
    fieldsets = DjangoUserAdmin.fieldsets + (
        (_("Notifications"), {"fields": ("reservation_notification",)}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        (_("Notifications"), {"fields": ("reservation_notification",)}),
    )

    @admin.action
    def anonymize_user_data(self, request, queryset):
        for user in queryset.all():
            anonymize_user_data(user)
