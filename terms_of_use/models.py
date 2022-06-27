from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy

from tilavarauspalvelu.utils.auditlog_util import AuditLogger


class TermsOfUse(models.Model):
    TERMS_TYPE_GENERIC = "generic_terms"
    TERMS_TYPE_PAYMENT = "payment_terms"
    TERMS_TYPE_CANCELLATION = "cancellation_terms"
    TERMS_TYPE_RECURRING = "recurring_terms"
    TERMS_TYPE_SERVICE = "service_terms"
    TERMS_TYPE_PRICING = "pricing_terms"

    TERMS_TYPES = (
        (TERMS_TYPE_GENERIC, _("Generic terms")),
        (TERMS_TYPE_PAYMENT, _("Payment terms")),
        (TERMS_TYPE_CANCELLATION, _("Cancellation terms")),
        (TERMS_TYPE_RECURRING, _("Recurring reservation terms")),
        (TERMS_TYPE_SERVICE, _("Service-specific terms")),
        (TERMS_TYPE_PRICING, _("Pricing terms")),
    )

    id = models.CharField(primary_key=True, max_length=100)
    name = models.CharField(
        verbose_name=_("Name"), max_length=255, null=True, blank=True
    )
    text = models.TextField(verbose_name=_("Text"))
    terms_type = models.CharField(
        blank=False,
        verbose_name=_("Terms type"),
        max_length=40,
        choices=TERMS_TYPES,
        default=TERMS_TYPE_GENERIC,
    )

    class Meta:
        verbose_name = pgettext_lazy("singular", "terms of use")
        verbose_name_plural = pgettext_lazy("plural", "terms of use")

    def __str__(self) -> str:
        return self.name


AuditLogger.register(TermsOfUse)
