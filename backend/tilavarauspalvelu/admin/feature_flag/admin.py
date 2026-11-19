from __future__ import annotations

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from waffle.admin import FlagAdmin

from tilavarauspalvelu.models import FeatureFlag


@admin.register(FeatureFlag)
class FeatureFlagAdmin(FlagAdmin):
    # List
    list_display = [
        "name",
        "note",
        "everyone",
        "active_for_everyone_from",
        "superusers",
        "staff",
        "authenticated",
        "created",
        "modified",
    ]

    # Form
    # 'percent', 'rollout' and 'testing' need waffle's cookies, which do not reach the browser through the frontend.
    # 'languages' reads 'request.LANGUAGE_CODE', which only 'LocaleMiddleware' sets. The backend does not use it.
    fieldsets = [
        (
            None,
            {
                "fields": [
                    "name",
                    "note",
                    "everyone",
                    "active_for_everyone_from",
                ],
            },
        ),
        (
            _("Users"),
            {
                "fields": [
                    "superusers",
                    "staff",
                    "authenticated",
                    "groups",
                    "users",
                ],
            },
        ),
        (
            None,
            {
                "fields": [
                    "created",
                    "modified",
                ],
            },
        ),
    ]
    readonly_fields = [
        "created",
        "modified",
    ]
