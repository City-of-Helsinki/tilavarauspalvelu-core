from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "Service",
]


class Service(models.Model):
    TYPE_INTRODUCTION = "introduction"
    TYPE_CATERING = "catering"
    TYPE_CONFIGURATION = "configuration"

    SERVICE_TYPES = (
        (TYPE_INTRODUCTION, _("Introduction")),
        (TYPE_CATERING, _("Catering")),
        (TYPE_CONFIGURATION, _("Configuration")),
    )

    name = models.CharField(verbose_name=_("Name"), max_length=255)

    service_type = models.CharField(
        verbose_name=_("Service type"),
        max_length=50,
        choices=SERVICE_TYPES,
        default=TYPE_INTRODUCTION,
    )

    buffer_time_before = models.DurationField(verbose_name=_("Buffer time before"), blank=True, null=True)
    buffer_time_after = models.DurationField(verbose_name=_("Buffer time after"), blank=True, null=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "service"
        base_manager_name = "objects"

    def __str__(self):
        return f"{self.name} ({self.service_type})"
