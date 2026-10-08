from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from tilavarauspalvelu.models import AllocatedTimeSlot, ReservationUnitOption

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application
    from tilavarauspalvelu.typing import AnyUser


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
        ReservationUnitOption.objects.filter(application_section__application=self.application).update(is_locked=False)

        AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section__application=self.application,
        ).delete()

    def reset_sent_at_if_changed_by_applicant(self, *, user: AnyUser) -> None:
        """
        A sent application must be validated and sent again after the applicant changes it.
        A change by staff keeps the application sent.
        """
        if user.pk != self.application.user_id:
            return

        self.application.sent_at = None
        self.application.save(update_fields=["sent_at", "updated_at"])
