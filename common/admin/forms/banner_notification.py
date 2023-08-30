from django import forms
from django.utils.translation import gettext_lazy
from tinymce.widgets import TinyMCE

from ...models import BannerNotification


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
            "name": gettext_lazy("Name of the notification. Should be unique."),
            "message": gettext_lazy("Notification body."),
            "level": gettext_lazy("Level of the notification."),
            "target": gettext_lazy("Target user interface of the notification."),
            "active_from": gettext_lazy(
                "Start date of the notification. If empty, 'active_until' must also be empty.",
            ),
            "active_until": gettext_lazy(
                "End date of the notification. If empty, 'active_from' must also be empty.",
            ),
            "draft": gettext_lazy(
                "Is the notification a draft. Drafts won't be shown to users, even if they would be active.",
            ),
        }
