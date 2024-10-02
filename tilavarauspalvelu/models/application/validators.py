from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.models import AllocatedTimeSlot

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application


class ApplicationValidator:
    def can_reject_all_options(self, instance: Application) -> None:
        slots_exist = AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section__application=instance,
        ).exists()

        if slots_exist:
            msg = "Application has allocated time slots and cannot be rejected."
            raise ValidationError(msg, code=error_codes.CANNOT_REJECT_APPLICATION_OPTIONS)
