from __future__ import annotations

from .application import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
)
from .permissions import get_context_for_permission_deactivation, get_context_for_user_anonymization
from .reservation import (
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_modified,
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_seasonal_reservation_cancelled_single,
    get_context_for_seasonal_reservation_modified_single,
    get_context_for_seasonal_reservation_rejected_single,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
)

__all__ = [
    "get_context_for_application_handled",
    "get_context_for_application_in_allocation",
    "get_context_for_application_received",
    "get_context_for_permission_deactivation",
    "get_context_for_reservation_approved",
    "get_context_for_reservation_cancelled",
    "get_context_for_reservation_confirmed",
    "get_context_for_reservation_modified",
    "get_context_for_reservation_rejected",
    "get_context_for_reservation_requires_handling",
    "get_context_for_reservation_requires_payment",
    "get_context_for_seasonal_reservation_cancelled_single",
    "get_context_for_seasonal_reservation_modified_single",
    "get_context_for_seasonal_reservation_rejected_single",
    "get_context_for_staff_notification_reservation_made",
    "get_context_for_staff_notification_reservation_requires_handling",
    "get_context_for_user_anonymization",
]
