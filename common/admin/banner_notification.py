from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from common.admin.forms import BannerNotificationAdminForm
from common.models import BannerNotification


@admin.register(BannerNotification)
class BannerNotificationAdmin(TranslationAdmin):
    form = BannerNotificationAdminForm
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

    @admin.display(boolean=True)
    def is_active(self, obj) -> bool:
        return obj.is_active
