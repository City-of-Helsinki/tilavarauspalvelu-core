from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


@deconstructible
class ChoiceValidator:
    message = _(
        'Choice "%(choice)s" is not allowed. '
        "Allowed choices are: %(allowed_choices)s."
    )
    code = "invalid_choice"

    def __init__(self, allowed_choices):
        self.allowed_choices = [choice[0].upper() for choice in allowed_choices]

    def __call__(self, value):
        if value.upper() not in self.allowed_choices:
            raise ValidationError(
                self.message,
                self.code,
                {"choice": value, "allowed_choices": ", ".join(self.allowed_choices)},
            )


class ChoiceCharField(serializers.CharField):
    def __init__(self, choices, **kwargs):
        super().__init__(**kwargs)
        choice_validator = ChoiceValidator(choices)
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
