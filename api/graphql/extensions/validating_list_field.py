from django.core.exceptions import ValidationError
from rest_framework import serializers


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
