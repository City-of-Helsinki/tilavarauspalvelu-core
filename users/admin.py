from django.contrib import admin

from users.anonymisation import anonymize_user_data
from users.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_superuser",
        "reservation_notification",
        "last_login",
        "date_joined",
    ]
    fields = [
        "username",
        "last_login",
        "date_joined",
        "email",
        "first_name",
        "last_name",
        "is_active",
        "is_staff",
        "is_superuser",
        "preferred_language",
        "reservation_notification",
        "tvp_uuid",
        "profile_id",
        "ad_groups",
        "has_staff_permissions",
        "id_token",
        "groups",
    ]
    readonly_fields = [
        "last_login",
        "date_joined",
        "tvp_uuid",
        "profile_id",
        "ad_groups",
        "has_staff_permissions",
        "id_token",
    ]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
    ]
    ordering = [
        "username",
    ]
    filter_horizontal = ["groups"]

    actions = ["anonymize_user_data"]

    @admin.action
    def anonymize_user_data(self, request, queryset) -> None:
        for user in queryset.all():
            anonymize_user_data(user)
