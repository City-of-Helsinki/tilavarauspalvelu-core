from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from applications.models import ApplicationRound, ApplicationRoundBasket

User = get_user_model()


class AllocationRequest(models.Model):

    start_date = models.DateTimeField(
        verbose_name=_("Start time"), null=False, blank=True
    )

    end_date = models.DateTimeField(verbose_name=_("End time"), null=True, blank=True)

    completed = models.BooleanField(
        verbose_name=_("Completed"), null=False, default=False, blank=True
    )

    application_round = models.ForeignKey(
        ApplicationRound,
        verbose_name=_("Application round"),
        null=True,
        blank=False,
        on_delete=models.SET_NULL,
    )

    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    application_round_baskets = models.ManyToManyField(ApplicationRoundBasket)
