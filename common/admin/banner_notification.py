from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from common.admin.forms import BannerNotificationAdminForm
from common.models import BannerNotification


@admin.register(BannerNotification)
class BannerNotificationAdmin(TranslationAdmin):
    form = BannerNotificationAdminForm
    list_display = [
        "name",
        "type",
        "target",
        "active_from",
        "active_until",
    ]
    list_filter = [
        "type",
        "target",
    ]
