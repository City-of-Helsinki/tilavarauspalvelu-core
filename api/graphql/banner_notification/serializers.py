from collections import defaultdict
from datetime import datetime
from types import NoneType
from typing import Any, Optional

from rest_framework import serializers

from common.models import BannerNotification
from common.serializers import TranslatedModelSerializer

__all__ = [
    "BannerNotificationSerializer",
]


class BannerNotificationSerializer(TranslatedModelSerializer):
    class Meta:
        model = BannerNotification
        fields = [
            "pk",
            "name",
            "message",
            "draft",
            "level",
            "target",
            "active_from",
            "active_until",
        ]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        active_from: Optional[datetime] = self.get_or_default("active_from", attrs)
        active_until: Optional[datetime] = self.get_or_default("active_until", attrs)
        draft: bool = self.get_or_default("draft", attrs)
        message: str = self.get_or_default("message", attrs)

        if not isinstance(active_from, type(active_until)) or not isinstance(active_from, (datetime, NoneType)):
            msg = "Both 'active_from' and 'active_until' must be either set or null."
            errors["active_until"].append(msg)
            errors["active_from"].append(msg)

        if active_from and active_until and active_from >= active_until:
            errors["active_from"].append("'active_from' must be before 'active_until'.")

        if not draft:
            if not active_from:
                errors["active_from"].append("Non-draft notifications must set 'active_from'")
            if not active_until:
                errors["active_until"].append("Non-draft notifications must set 'active_until'")
            if not message:
                errors["message"].append("Non-draft notifications must have a message.")

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
