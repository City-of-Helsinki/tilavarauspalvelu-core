from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


@deconstructible
class ChoiceValidator:
    message = _('Choice "%(choice)s" is not allowed. ' "Allowed choices are: %(allowed_choices)s.")
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


class ChoiceIntegerField(serializers.IntegerField):
    choices = None

    def __init__(self, choices, **kwargs):
        super().__init__(**kwargs)
        choice_validator = ChoiceValidator(choices)
        self.validators.append(choice_validator)
