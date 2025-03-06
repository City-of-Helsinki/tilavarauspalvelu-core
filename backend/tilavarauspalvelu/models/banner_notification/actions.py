from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import BannerNotification


__all__ = [
    "BannerNotificationActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class BannerNotificationActions:
    banner_notification: BannerNotification
