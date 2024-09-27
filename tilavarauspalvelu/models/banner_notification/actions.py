from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import BannerNotification


class BannerNotificationActions:
    def __init__(self, banner_notification: BannerNotification) -> None:
        self.banner_notification = banner_notification
