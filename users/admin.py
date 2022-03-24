from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from tilavarauspalvelu.utils.anonymisation import anonymize_user_data

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    actions = ["anonymize_user_data"]

    @admin.action
    def anonymize_user_data(self, request, queryset):
        for user in queryset.all():
            anonymize_user_data(user)
