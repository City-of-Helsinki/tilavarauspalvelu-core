from datetime import timedelta
from typing import Any

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


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

    def get_attribute(self, instance: Any) -> int | None:
        value = super().get_attribute(instance)
        if isinstance(value, timedelta):
            return int(value.total_seconds())
        return value


@deconstructible
class OldChoiceValidator:
    message = _('Choice "%(choice)s" is not allowed. Allowed choices are: %(allowed_choices)s.')
    code = "invalid_choice"

    def __init__(self, allowed_choices) -> None:
        if len(allowed_choices) > 0 and isinstance(allowed_choices[0][0], int):
            self.allowed_choices = [choice[0] for choice in allowed_choices]
        else:
            self.allowed_choices = [choice[0].upper() for choice in allowed_choices]

    def __call__(self, value):
        original_value = value
        if isinstance(value, str):
            value = value.upper()

        if value not in self.allowed_choices:
            raise ValidationError(
                self.message,
                self.code,
                {
                    "choice": original_value,
                    "allowed_choices": ", ".join(self.allowed_choices),
                },
            )


class OldChoiceCharField(serializers.CharField):
    def __init__(self, choices, **kwargs) -> None:
        super().__init__(**kwargs)
        choice_validator = OldChoiceValidator(choices)
        self.validators.append(choice_validator)

    def to_internal_value(self, data):
        if isinstance(data, str):
            data = data.lower()
        return super().to_internal_value(data)

    def get_attribute(self, instance):
        value = super().get_attribute(instance)
        if isinstance(value, str):
            return value.upper()
        return value
