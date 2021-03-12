from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class BaseRole(models.Model):
    assigner = models.ForeignKey(
        User,
        verbose_name=_("Assigner"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    created = models.DateTimeField(verbose_name=_("Created"), auto_now_add=True)
    modified = models.DateTimeField(verbose_name=_("Modified"), auto_now=True)

    class Meta:
        abstract = True
