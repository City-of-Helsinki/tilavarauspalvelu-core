from modeltranslation.translator import TranslationOptions, register

from common.models.banner_notification import BannerNotification


@register(BannerNotification)
class BannerNotificationTranslationOptions(TranslationOptions):
    fields = ["message"]
