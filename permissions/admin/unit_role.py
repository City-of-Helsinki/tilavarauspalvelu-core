from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.utils.translation import gettext_lazy as _

from permissions.models import UnitRole

__all__ = [
    "UnitRoleAdmin",
]


@admin.register(UnitRole)
class UnitRoleAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "unit__name",
        "unit_group__name",
    ]
    search_help_text = _("Search by user's username, email, first name, last name, unit or unit group")

    # List
    list_display = [
        "role_verbose_name",
        "user_email",
        "unit_names",
        "unit_group_names",
    ]
    list_filter = [
        "role",
        "unit",
        "unit_group",
    ]

    # Form
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "role",
                    "user",
                    "assigner",
                    "created",
                    "modified",
                ],
            },
        ],
        [
            _("Roles"),
            {
                "fields": [
                    "unit",
                    "unit_group",
                ],
            },
        ],
    ]
    readonly_fields = [
        "created",
        "modified",
        "assigner",
    ]
    autocomplete_fields = ["user"]
    filter_horizontal = [
        "unit",
        "unit_group",
    ]

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return super().get_queryset(request).select_related("user", "role").prefetch_related("unit", "unit_group")

    def save_model(self, request: WSGIRequest, obj: UnitRole, form, change: bool) -> UnitRole:
        obj.assigner = request.user
        return super().save_model(request, obj, form, change)

    @admin.display(ordering="role__verbose_name")
    def role_verbose_name(self, obj: UnitRole) -> str:
        return obj.role.verbose_name

    @admin.display(ordering="user__email")
    def user_email(self, obj: UnitRole) -> str:
        return obj.user.email

    @admin.display(ordering="unit__name")
    def unit_names(self, obj: UnitRole) -> str:
        return ", ".join([unit.name for unit in obj.unit.all()])

    @admin.display(ordering="unit_group__name")
    def unit_group_names(self, obj: UnitRole) -> str:
        return ", ".join([unit.name for unit in obj.unit_group.all()])
