from datetime import timedelta
from typing import Any, Optional

from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from graphene.types.scalars import Scalar
from rest_framework import serializers


class Duration(Scalar):
    """
    The `Duration` scalar type represents a duration value as an integer in seconds.
    For example, a value of 900 means a duration of 15 minutes.
    """

    @staticmethod
    def serialize(value: timedelta) -> int:
        return int(value.total_seconds())

    @staticmethod
    def parse_value(value: Any) -> Optional[timedelta]:
        try:
            return timedelta(seconds=value)
        except ValueError:
            return None


class MinDurationValidator(MinValueValidator):
    def clean(self, x: timedelta) -> int:
        return int(x.total_seconds())


class DurationField(serializers.IntegerField):
    default_error_messages = {"invalid": _("A valid integer is required.")}

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self.validators.append(MinDurationValidator(0))

    def to_internal_value(self, data) -> timedelta:
        try:
            return timedelta(seconds=int(data))
        except ValueError:
            self.fail("invalid")

    def to_representation(self, value) -> int:
        return int(value.total_seconds())

    def get_attribute(self, instance: Any) -> Optional[int]:
        value = super().get_attribute(instance)
        if isinstance(value, timedelta):
            return int(value.total_seconds())
        return value
