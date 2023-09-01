from datetime import timedelta
from typing import Any

import factory
from django.utils import timezone
from factory import fuzzy

from common.choices import BannerNotificationLevel, BannerNotificationTarget
from common.models import BannerNotification

from ._base import GenericDjangoModelFactory

__all__ = [
    "BannerNotificationFactory",
]


class BannerNotificationFactory(GenericDjangoModelFactory[BannerNotification]):
    class Meta:
        model = BannerNotification

    name = factory.Faker("text", max_nb_chars=100)
    message = factory.Faker("text", max_nb_chars=1_000)
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
