from __future__ import annotations

from typing import Self

from django.db import models
from lookup_property import L

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.models import ApplicationSection, Reservation
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_datetime
from utils.db import Now
from utils.mixins import SerializableModelManagerMixin

__all__ = [
    "ApplicationSectionManager",
    "ApplicationSectionQuerySet",
]


class ApplicationSectionQuerySet(ModelQuerySet[ApplicationSection]):
    def requiring_access_code(self) -> Self:
        """Return all application sections that should have an access code but don't."""
        return self.alias(
            has_missing_access_codes=models.Exists(
                queryset=(
                    Reservation.objects.all()
                    .for_application_section(models.OuterRef("pk"))
                    .filter(
                        state=ReservationStateChoice.CONFIRMED,
                        access_type=AccessType.ACCESS_CODE,
                        access_code_generated_at=None,
                        ends_at__gt=Now(),
                    )
                ),
            )
        ).filter(has_missing_access_codes=True)

    def has_incorrect_access_code_is_active(self) -> Self:
        """
        Return all application sections where the access code is active
        when it should be inactive, or vice versa.
        """
        return self.alias(
            has_incorrect_access_codes=models.Exists(
                queryset=(
                    Reservation.objects.all()
                    .for_application_section(models.OuterRef("pk"))
                    .filter(
                        (
                            (models.Q(access_code_is_active=True) & L(access_code_should_be_active=False))
                            | (models.Q(access_code_is_active=False) & L(access_code_should_be_active=True))
                        ),
                        access_code_generated_at__isnull=False,
                        ends_at__gt=local_datetime(),
                    )
                ),
            )
        ).filter(has_incorrect_access_codes=True)


class ApplicationSectionManager(
    SerializableModelManagerMixin,
    ModelManager[ApplicationSection, ApplicationSectionQuerySet],
): ...
