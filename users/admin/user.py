from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from users.anonymisation import anonymize_user_data
from users.helauth.typing import LoginMethod
from users.models import User

__all__ = [
    "UserAdmin",
]


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    # Functions
    actions = ["anonymize_user_data"]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
    ]
    search_help_text = _("Search by Username, First name, Last name or Email")

    # List
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
    ordering = ["username"]

    # Form
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "username",
                    "email",
                    "first_name",
                    "last_name",
                ],
            },
        ],
        [
            _("Settings"),
            {
                "fields": [
                    "preferred_language",
                    "reservation_notification",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                ],
            },
        ],
        [
            _("Additional information"),
            {
                "fields": [
                    "last_login",
                    "date_joined",
                    "id_token",
                    "tvp_uuid",
                    "ad_groups",
                    "department_name",
                    "has_staff_permissions",
                    "profile_id",
                    "date_of_birth",
                    "login_method",
                    "is_strong_login",
                ],
            },
        ],
    ]
    readonly_fields = [
        "last_login",
        "date_joined",
        "id_token",
        "tvp_uuid",
        "ad_groups",
        "department_name",
        "has_staff_permissions",
        "profile_id",
        "date_of_birth",
        "login_method",
        "is_strong_login",
    ]
    filter_horizontal = ["groups"]

    @admin.action
    def anonymize_user_data(self, request, queryset) -> None:
        for user in queryset.all():
            anonymize_user_data(user)

    def login_method(self, user: User) -> str:
        if user is None:
            return "-"
        if user.id_token is None:
            return LoginMethod.OTHER.value

        login_method = LoginMethod.PROFILE.value if user.id_token.is_profile_login else LoginMethod.AD.value
        return f"{login_method} ({user.id_token.amr})"

    def is_strong_login(self, user: User) -> bool:
        return getattr(user.id_token, "is_strong_login", False)
