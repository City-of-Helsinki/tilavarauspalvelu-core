from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from tilavarauspalvelu.models import AllocatedTimeSlot, ReservationUnitOption

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application


__all__ = [
    "ApplicationActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationActions:
    application: Application

    def reset_application_allocation(self) -> None:
        """
        Remove application allocations, and unlock locked reservation unit options.
        Rejected options stay rejected.
        """
        ReservationUnitOption.objects.filter(application_section__application=self.application).update(locked=False)

        AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section__application=self.application,
        ).delete()
