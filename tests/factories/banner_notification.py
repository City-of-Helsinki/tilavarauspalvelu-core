from datetime import timedelta
from typing import Any

from django.utils import timezone
from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationTarget
from tilavarauspalvelu.models.banner_notification.model import BannerNotification

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory

__all__ = [
    "BannerNotificationFactory",
]


class BannerNotificationFactory(GenericDjangoModelFactory[BannerNotification]):
    class Meta:
        model = BannerNotification

    name = FakerFI("text", max_nb_chars=100)

    message = FakerFI("text", max_nb_chars=1_000)
    message_fi = LazyAttribute(lambda i: i.message)
    message_en = FakerEN("text", max_nb_chars=1_000)
    message_sv = FakerSV("text", max_nb_chars=1_000)

    draft = True
    level = fuzzy.FuzzyChoice(BannerNotificationLevel.values)
    target = fuzzy.FuzzyChoice(BannerNotificationTarget.values)
    active_from = None
    active_until = None

    @classmethod
    def create_active(cls, **kwargs: Any) -> BannerNotification:
        today = timezone.now()
        kwargs.setdefault("draft", False)
        kwargs.setdefault("active_from", today - timedelta(days=1))
        kwargs.setdefault("active_until", today + timedelta(days=1))
        return cls.create(**kwargs)

    @classmethod
    def create_scheduled(cls, **kwargs: Any) -> BannerNotification:
        today = timezone.now()
        kwargs.setdefault("draft", False)
        kwargs.setdefault("active_from", today + timedelta(days=1))
        kwargs.setdefault("active_until", today + timedelta(days=2))
        return cls.create(**kwargs)

    @classmethod
    def create_past(cls, **kwargs: Any) -> BannerNotification:
        today = timezone.now()
        kwargs.setdefault("draft", False)
        kwargs.setdefault("active_from", today - timedelta(days=2))
        kwargs.setdefault("active_until", today - timedelta(days=1))
        return cls.create(**kwargs)
