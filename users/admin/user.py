from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from permissions.models import GeneralRole, UnitRole
from users.anonymisation import anonymize_user_data
from users.helauth.typing import LoginMethod
from users.models import User

__all__ = [
    "UserAdmin",
]


class GeneralRoleInlineAdmin(admin.TabularInline):
    model = GeneralRole
    extra = 0
    show_change_link = True
    fk_name = "user"
    fields = [
        "role",
    ]
    readonly_fields = [
        "role",
    ]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class UnitRoleInlineAdmin(admin.TabularInline):
    model = UnitRole
    extra = 0
    show_change_link = True
    fk_name = "user"
    fields = [
        "role",
        "units",
        "unit_groups",
    ]
    readonly_fields = [
        "role",
        "units",
        "unit_groups",
    ]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


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
                    "department_name",
                    "profile_id",
                    "date_of_birth",
                ],
            },
        ],
        [
            _("Permissions"),
            {
                "fields": [
                    "is_superuser",
                    "is_staff",
                    "login_method",
                    "is_strong_login",
                    "ad_groups",
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
        "profile_id",
        "date_of_birth",
        "login_method",
        "is_strong_login",
        "general_roles_list",
        "unit_roles_map",
        "unit_group_roles_map",
    ]
    inlines = [
        GeneralRoleInlineAdmin,
        UnitRoleInlineAdmin,
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
