from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import BannerNotification


__all__ = [
    "BannerNotificationValidator",
]


@dataclasses.dataclass
class BannerNotificationValidator:
    banner_notification: BannerNotification
