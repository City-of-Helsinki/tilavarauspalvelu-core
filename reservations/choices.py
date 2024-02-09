from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomerTypeChoice(models.TextChoices):
    BUSINESS = "business", _("Business")
    NONPROFIT = "nonprofit", _("Nonprofit")
    INDIVIDUAL = "individual", _("Individual")


class ReservationStateChoice(models.TextChoices):
    CREATED = "created", _("Created")
    CANCELLED = "cancelled", _("Cancelled")
    REQUIRES_HANDLING = "requires_handling", _("Requires handling")
    WAITING_FOR_PAYMENT = "waiting_for_payment", _("Waiting for payment")
    CONFIRMED = "confirmed", _("Confirmed")
    DENIED = "denied", _("Denied")


class ReservationTypeChoice(models.TextChoices):
    NORMAL = "normal", _("Normal")
    BLOCKED = "blocked", _("Blocked")
    STAFF = "staff", _("Staff")
    BEHALF = "behalf", _("Behalf")


RESERVEE_LANGUAGE_CHOICES = (*settings.LANGUAGES, ("", ""))
