from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application


class ApplicationActions:
    def __init__(self, application: Application) -> None:
        self.application = application

    def reset_application_allocation(self) -> None:
        """
        Remove application allocations, and unlock locked reservation unit options.
        Rejected options stay rejected.
        """
        from tilavarauspalvelu.models import AllocatedTimeSlot, ReservationUnitOption

        ReservationUnitOption.objects.filter(
            application_section__application=self.application,
        ).update(
            locked=False,
        )

        AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section__application=self.application,
        ).delete()
