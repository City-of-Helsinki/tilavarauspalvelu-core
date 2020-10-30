from django.db import models
from django.utils.translation import ugettext_lazy as _


class Service(models.Model):
    TYPE_INTRODUCTION = "introduction"
    TYPE_CATERING = "catering"
    TYPE_CONFIGURATION = "configuration"

    name = models.CharField(verbose_name=_("Name"), max_length=255)
    service_type = models.CharField(verbose_name=_("Service type"), max_length=50)
