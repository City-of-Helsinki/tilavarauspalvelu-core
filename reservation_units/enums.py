from enum import Enum

from django.db import models
from django.db.models import TextChoices
from django.utils.functional import classproperty
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy

__all__ = [
    "AuthenticationType",
    "PaymentType",
    "PriceUnit",
    "PricingStatus",
    "PricingType",
    "ReservationKind",
    "ReservationStartInterval",
    "ReservationState",
    "ReservationUnitState",
]


class ReservationUnitState(Enum):
    DRAFT = "DRAFT"
    SCHEDULED_PUBLISHING = "SCHEDULED_PUBLISHING"
    SCHEDULED_HIDING = "SCHEDULED_HIDING"
    SCHEDULED_PERIOD = "SCHEDULED_PERIOD"
    HIDDEN = "HIDDEN"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ReservationState(Enum):
    SCHEDULED_RESERVATION = "SCHEDULED_RESERVATION"
    SCHEDULED_PERIOD = "SCHEDULED_PERIOD"
    RESERVABLE = "RESERVABLE"
    SCHEDULED_CLOSING = "SCHEDULED_CLOSING"
    RESERVATION_CLOSED = "RESERVATION_CLOSED"


class ReservationStartInterval(TextChoices):
    INTERVAL_15_MINUTES = "interval_15_mins", _("15 minutes")
    INTERVAL_30_MINUTES = "interval_30_mins", _("30 minutes")
    INTERVAL_60_MINUTES = "interval_60_mins", _("60 minutes")
    INTERVAL_90_MINUTES = "interval_90_mins", _("90 minutes")
    INTERVAL_120_MINUTES = "interval_120_mins", _("2 hours")
    INTERVAL_180_MINUTES = "interval_180_mins", _("3 hours")
    INTERVAL_240_MINUTES = "interval_240_mins", _("4 hours")
    INTERVAL_300_MINUTES = "interval_300_mins", _("5 hours")
    INTERVAL_360_MINUTES = "interval_360_mins", _("6 hours")
    INTERVAL_420_MINUTES = "interval_420_mins", _("7 hours")

    @property
    def as_number(self) -> int:
        return int(self.value.split("_")[1])


class ReservationKind(models.TextChoices):
    DIRECT = "direct", pgettext_lazy("ReservationKind", "Direct")
    SEASON = "season", pgettext_lazy("ReservationKind", "Season")
    DIRECT_AND_SEASON = "direct_and_season", pgettext_lazy("ReservationKind", "Direct and season")

    @classproperty
    def allows_direct(cls) -> list[str]:
        return [cls.DIRECT.value, cls.DIRECT_AND_SEASON.value]

    @classproperty
    def allows_season(cls) -> list[str]:
        return [cls.SEASON.value, cls.DIRECT_AND_SEASON.value]


class PricingType(models.TextChoices):
    PAID = "paid", pgettext_lazy("PricingType", "Paid")
    FREE = "free", pgettext_lazy("PricingType", "Free")


class PaymentType(models.TextChoices):
    ONLINE = "ONLINE", pgettext_lazy("PaymentType", "Online")
    INVOICE = "INVOICE", pgettext_lazy("PaymentType", "Invoice")
    ON_SITE = "ON_SITE", pgettext_lazy("PaymentType", "On site")


class PriceUnit(models.TextChoices):
    PRICE_UNIT_PER_15_MINS = "per_15_mins", pgettext_lazy("PriceUnit", "per 15 minutes")
    PRICE_UNIT_PER_30_MINS = "per_30_mins", pgettext_lazy("PriceUnit", "per 30 minutes")
    PRICE_UNIT_PER_HOUR = "per_hour", pgettext_lazy("PriceUnit", "per hour")
    PRICE_UNIT_PER_HALF_DAY = "per_half_day", pgettext_lazy("PriceUnit", "per half a day")
    PRICE_UNIT_PER_DAY = "per_day", pgettext_lazy("PriceUnit", "per day")
    PRICE_UNIT_PER_WEEK = "per_week", pgettext_lazy("PriceUnit", "per week")
    PRICE_UNIT_FIXED = "fixed", pgettext_lazy("PriceUnit", "fixed")


class PricingStatus(models.TextChoices):
    PRICING_STATUS_PAST = "past", pgettext_lazy("PricingStatus", "past")
    PRICING_STATUS_ACTIVE = "active", pgettext_lazy("PricingStatus", "active")
    PRICING_STATUS_FUTURE = "future", pgettext_lazy("PricingStatus", "future")


class AuthenticationType(models.TextChoices):
    WEAK = "weak", pgettext_lazy("AuthenticationType", "Weak")
    STRONG = "strong", pgettext_lazy("AuthenticationType", "Strong")


class ReservationUnitImageType(models.TextChoices):
    MAIN = "main", pgettext_lazy("ReservationUnitImageType", "Main image")
    GROUND_PLAN = "ground_plan", pgettext_lazy("ReservationUnitImageType", "Ground plan")
    MAP = "map", pgettext_lazy("ReservationUnitImageType", "Map")
    OTHER = "other", pgettext_lazy("ReservationUnitImageType", "Other")
