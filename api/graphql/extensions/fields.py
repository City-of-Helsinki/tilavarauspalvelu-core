from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _
from graphene import Scalar
from rest_framework import serializers


class DecimalField(serializers.FloatField):
    def to_internal_value(self, data):
        return Decimal(str(data))


class Duration(Scalar):
    """
    The `Duration` scalar type represents a duration value as an integer in seconds.
    For example, a value of 900 means a duration of 15 minutes.
    """

    @staticmethod
    def serialize(value: timedelta | None) -> int | None:
        if value is None:
            return None
        return int(value.total_seconds())

    @staticmethod
    def parse_value(value: int | None) -> timedelta | None:
        if value is None:
            return None
        return timedelta(seconds=value)


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


class ValidatingListField(serializers.ListField):
    """
    Default ListField returns extremely unclear error if child items
    do not contain the given value. This class runs a custom validation
    before default implementation and provides better error messages
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def run_child_validation(self, data):
        if self.child and self.child.choices:
            allowed_values = list(self.child.get_choices().values())
            for value in data:
                if value not in allowed_values:
                    if len(allowed_values) <= 5:
                        raise ValidationError(
                            f"{value} is not a valid value. Allowed values: {', '.join(allowed_values)}."
                        )
                    else:
                        raise ValidationError(f"{value} is not a valid value.")
        return super().run_child_validation(data)


@deconstructible
class OldChoiceValidator:
    message = _('Choice "%(choice)s" is not allowed. Allowed choices are: %(allowed_choices)s.')
    code = "invalid_choice"

    def __init__(self, allowed_choices):
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
    def __init__(self, choices, **kwargs):
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


class OldChoiceIntegerField(serializers.IntegerField):
    choices = None

    def __init__(self, choices, **kwargs):
        super().__init__(**kwargs)
        choice_validator = OldChoiceValidator(choices)
        self.validators.append(choice_validator)
