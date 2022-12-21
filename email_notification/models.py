from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class EmailType(models.TextChoices):
    RESERVATION_CONFIRMED = "reservation_confirmed"
    RESERVATION_WITH_PIN_CONFIRMED = "reservation_with_pin_confirmed"
    HANDLING_REQUIRED_RESERVATION = "handling_required_reservation"
    RESERVATION_HANDLED_AND_CONFIRMED = "reservation_handled_and_confirmed"
    RESERVATION_MODIFIED = "reservation_modified"
    RESERVATION_REJECTED = "reservation_rejected"
    RESERVATION_CANCELLED = "reservation_cancelled"
    ACCESS_CODE_FOR_RESERVATION = "access_code_for_reservation"
    RESERVATION_NEEDS_TO_BE_PAID = "reservation_needs_to_be_paid"
    STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING = (
        "staff_notification_reservation_requires_handling"
    )
    STAFF_NOTIFICATION_RESERVATION_MADE = "staff_notification_reservation_made"


class EmailTemplate(models.Model):
    type = models.CharField(
        max_length=254,
        choices=EmailType.choices,
        unique=True,
        blank=False,
        null=False,
        verbose_name=_("Email type"),
        help_text=_("Only one template per type can be created."),
    )
    name = models.CharField(
        max_length=255,
        unique=True,
        verbose_name=_("Unique name for this content"),
        null=False,
        blank=False,
    )

    subject = models.CharField(max_length=255, null=False, blank=False)
    content = models.TextField(
        verbose_name=_("Content"),
        help_text=_(
            "Email body content. Use curly brackets to indicate data specific fields e.g {{reservee_name}}."
        ),
        null=False,
        blank=False,
    )

    html_content = models.FileField(
        verbose_name=_("HTML content"),
        help_text=_(
            "Email body content as HTML. Use curly brackets to indicate data specific fields e.g {{reservee_name}}."
        ),
        null=True,
        blank=True,
        upload_to=settings.EMAIL_HTML_TEMPLATES_ROOT,
    )

    def __str__(self):
        choices = dict(EmailType.choices)
        label = choices.get(self.type)
        return f"{label}: {self.name}"
