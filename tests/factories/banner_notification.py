from __future__ import annotations

from datetime import timedelta
from typing import Self

from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationTarget
from tilavarauspalvelu.models.banner_notification.model import BannerNotification
from utils.date_utils import local_datetime

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ModelFactoryBuilder

__all__ = [
    "BannerNotificationBuilder",
    "BannerNotificationFactory",
]


class BannerNotificationFactory(GenericDjangoModelFactory[BannerNotification]):
    class Meta:
        model = BannerNotification
        django_get_or_create = ["name"]

    name = FakerFI("text", max_nb_chars=100, unique=True)

    message = FakerFI("sentence")
    message_fi = LazyAttribute(lambda i: i.message)
    message_en = FakerEN("sentence")
    message_sv = FakerSV("sentence")

    draft = True
    level = fuzzy.FuzzyChoice(BannerNotificationLevel.values)
    target = fuzzy.FuzzyChoice(BannerNotificationTarget.values)
    active_from = None
    active_until = None


class BannerNotificationBuilder(ModelFactoryBuilder[BannerNotification]):
    factory = BannerNotificationFactory

    def draft(self) -> Self:
        self.kwargs.setdefault("draft", True)
        self.kwargs.setdefault("active_from", None)
        self.kwargs.setdefault("active_until", None)
        return self

    def active(self) -> Self:
        now = local_datetime()
        self.kwargs.setdefault("draft", False)
        self.kwargs.setdefault("active_from", now - timedelta(days=1))
        self.kwargs.setdefault("active_until", now + timedelta(days=1))
        return self

    def scheduled(self) -> Self:
        now = local_datetime()
        self.kwargs.setdefault("draft", False)
        self.kwargs.setdefault("active_from", now + timedelta(days=1))
        self.kwargs.setdefault("active_until", now + timedelta(days=2))
        return self

    def past(self) -> Self:
        now = local_datetime()
        self.kwargs.setdefault("draft", False)
        self.kwargs.setdefault("active_from", now - timedelta(days=2))
        self.kwargs.setdefault("active_until", now - timedelta(days=1))
        return self

    def bold_messages(self) -> Self:
        message_fi = self.kwargs.get("message", self.kwargs.get("message_fi", self.factory.message.generate()))
        message_en = self.kwargs.get("message_sv", self.factory.message_en.generate())
        message_sv = self.kwargs.get("message_en", self.factory.message_sv.generate())

        message_fi = f"<b>{message_fi}</b>"
        message_en = f"<b>{message_en}</b>"
        message_sv = f"<b>{message_sv}</b>"

        self.kwargs["message"] = message_fi
        self.kwargs["message_fi"] = message_fi
        self.kwargs["message_en"] = message_en
        self.kwargs["message_sv"] = message_sv
        return self

    def messages_are_links(self) -> Self:
        self.kwargs["message"] = "https://www.example.com"
        self.kwargs["message_fi"] = "https://www.example.com"
        self.kwargs["message_en"] = "https://www.example.com"
        self.kwargs["message_sv"] = "https://www.example.com"
        return self
