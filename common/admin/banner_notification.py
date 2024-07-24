from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TranslationAdmin
from tinymce.widgets import TinyMCE

from common.models import BannerNotification

__all__ = [
    "BannerNotificationAdmin",
]


class BannerNotificationAdminForm(forms.ModelForm):
    class Meta:
        model = BannerNotification
        fields = [
            "name",
            "message",
            "level",
            "target",
            "active_from",
            "active_until",
            "draft",
        ]
        widgets = {
            "message": TinyMCE(),
        }
        help_texts = {
            "name": _("Name of the notification. Should be unique."),
            "message": _("Notification body."),
            "level": _("Level of the notification."),
            "target": _("Target user interface of the notification."),
            "active_from": _("Start date of the notification. If empty, 'active_until' must also be empty."),
            "active_until": _("End date of the notification. If empty, 'active_from' must also be empty."),
            "draft": _(
                "Is the notification a draft. Drafts won't be shown to users, even if they would be active.",
            ),
        }


@admin.register(BannerNotification)
class BannerNotificationAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "level",
        "target",
        "active_from",
        "active_until",
        "is_active",
    ]
    list_filter = [
        "level",
        "target",
    ]

    # Form
    form = BannerNotificationAdminForm

    @admin.display(boolean=True)
    def is_active(self, obj) -> bool:
        return obj.is_active
