from django.db import models
from django.utils.functional import classproperty
from django.utils.translation import gettext_lazy as _

__all__ = [
    "AuthenticationType",
    "PaymentType",
    "PriceUnit",
    "PricingStatus",
    "PricingType",
    "ReservationKind",
    "ReservationStartInterval",
    "ReservationUnitPublishingState",
    "ReservationUnitReservationState",
]


class ReservationUnitPublishingState(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    SCHEDULED_PUBLISHING = "SCHEDULED_PUBLISHING", _("Scheduled publishing")
    SCHEDULED_HIDING = "SCHEDULED_HIDING", _("Scheduled hiding")
    SCHEDULED_PERIOD = "SCHEDULED_PERIOD", _("Scheduled period")
    HIDDEN = "HIDDEN", _("Hidden")
    PUBLISHED = "PUBLISHED", _("Published")
    ARCHIVED = "ARCHIVED", _("Archived")


class ReservationUnitReservationState(models.TextChoices):
    SCHEDULED_RESERVATION = "SCHEDULED_RESERVATION", _("Scheduled reservation")
    SCHEDULED_PERIOD = "SCHEDULED_PERIOD", _("Scheduled period")
    RESERVABLE = "RESERVABLE", _("Reservable")
    SCHEDULED_CLOSING = "SCHEDULED_CLOSING", _("Scheduled closing")
    RESERVATION_CLOSED = "RESERVATION_CLOSED", _("Reservation closed")


class ReservationStartInterval(models.TextChoices):
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
    DIRECT = "direct"
    SEASON = "season"
    DIRECT_AND_SEASON = "direct_and_season"

    @classproperty
    def allows_direct(cls) -> list[str]:
        return [cls.DIRECT.value, cls.DIRECT_AND_SEASON.value]

    @classproperty
    def allows_season(cls) -> list[str]:
        return [cls.SEASON.value, cls.DIRECT_AND_SEASON.value]


class PricingType(models.TextChoices):
    PAID = "paid"
    FREE = "free"


class PaymentType(models.TextChoices):
    ONLINE = "ONLINE"
    INVOICE = "INVOICE"
    ON_SITE = "ON_SITE"


class PriceUnit(models.TextChoices):
    PRICE_UNIT_PER_15_MINS = "per_15_mins", _("per 15 minutes")
    PRICE_UNIT_PER_30_MINS = "per_30_mins", _("per 30 minutes")
    PRICE_UNIT_PER_HOUR = "per_hour", _("per hour")
    PRICE_UNIT_PER_HALF_DAY = "per_half_day", _("per half a day")
    PRICE_UNIT_PER_DAY = "per_day", _("per day")
    PRICE_UNIT_PER_WEEK = "per_week", _("per week")
    PRICE_UNIT_FIXED = "fixed", _("fixed")


class PricingStatus(models.TextChoices):
    PRICING_STATUS_PAST = "past", _("past")
    PRICING_STATUS_ACTIVE = "active", _("active")
    PRICING_STATUS_FUTURE = "future", _("future")


class AuthenticationType(models.TextChoices):
    WEAK = "weak", _("Weak")
    STRONG = "strong", _("Strong")


class ReservationUnitImageType(models.TextChoices):
    MAIN = "main", _("Main image")
    GROUND_PLAN = "ground_plan", _("Ground plan")
    MAP = "map", _("Map")
    OTHER = "other", _("Other")
