from __future__ import annotations

import datetime
from typing import Self

from django.conf import settings
from django.contrib.postgres.aggregates import ArrayAgg
from django.db import models
from django.db.models.functions import Coalesce
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ApplicationStatusChoice
from tilavarauspalvelu.models import Application, Unit
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_date
from utils.mixins import SerializableModelManagerMixin

__all__ = [
    "ApplicationManager",
    "ApplicationQuerySet",
]


class ApplicationQuerySet(ModelQuerySet[Application]):
    def _fetch_all(self) -> None:
        fetch_permissions = "FETCH_UNITS_FOR_PERMISSIONS_FLAG" in self.query.annotations
        super()._fetch_all()
        if fetch_permissions:
            self._add_units_for_permissions()

    def with_permissions(self) -> Self:
        """Indicates that we need to fetch units for permissions checks when the queryset is evaluated."""
        return self.alias(FETCH_UNITS_FOR_PERMISSIONS_FLAG=models.Value(""))

    def _add_units_for_permissions(self) -> None:
        # This works sort of like a 'prefetch_related', since it makes another query
        # to fetch units and unit groups for the permission checks when the queryset is evaluated,
        # and 'joins' them to the correct model instances in python.

        items = list(self._result_cache)
        if not items:
            return

        units = (
            Unit.objects.prefetch_related("unit_groups")
            .filter(reservation_units__reservation_unit_options__application_section__application__in=items)
            .annotate(
                application_ids=Coalesce(
                    ArrayAgg(
                        "reservation_units__reservation_unit_options__application_section__application",
                        distinct=True,
                        filter=(
                            models.Q(reservation_units__isnull=False)
                            & models.Q(reservation_units__reservation_unit_options__isnull=False)
                        ),
                    ),
                    models.Value([]),
                )
            )
            .distinct()
        )

        for item in items:
            item.units_for_permissions = [unit for unit in units if item.pk in unit.application_ids]

    def should_send_in_allocation_email(self) -> Self:
        """Get all applications that need the "application in allocation" notification to be sent."""
        return self.filter(
            L(application_round__status=ApplicationRoundStatusChoice.IN_ALLOCATION.value),
            L(status=ApplicationStatusChoice.IN_ALLOCATION.value),
            in_allocation_notification_sent_at__isnull=True,
            application_sections__isnull=False,
        )

    def should_send_handled_email(self) -> Self:
        """Get all applications that need the "application handled" notification to be sent."""
        return self.filter(
            L(application_round__status=ApplicationRoundStatusChoice.RESULTS_SENT.value),
            L(status=ApplicationStatusChoice.RESULTS_SENT.value),
            results_ready_notification_sent_at__isnull=True,
            application_sections__isnull=False,
        )

    def delete_expired_applications(self) -> None:
        cutoff_date = local_date() - datetime.timedelta(days=settings.REMOVE_EXPIRED_APPLICATIONS_OLDER_THAN_DAYS)
        self.filter(
            L(status__in=[ApplicationStatusChoice.EXPIRED, ApplicationStatusChoice.CANCELLED])
            & L(application_round__status=ApplicationRoundStatusChoice.RESULTS_SENT)
            & models.Q(application_round__application_period_ends_at__date__lte=cutoff_date)
        ).delete()


class ApplicationManager(SerializableModelManagerMixin, ModelManager[Application, ApplicationQuerySet]): ...
