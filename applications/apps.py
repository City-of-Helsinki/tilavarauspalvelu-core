from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class ApplicationsConfig(AppConfig):
    name = "applications"
    verbose_name = _("Seasonal Booking")
