import re

from django.core.exceptions import ValidationError


def is_numeric(value: str):
    if len(value) > 0 and not re.match("^[0-9]*$", value):
        raise ValidationError("Value must be numeric")


def validate_accounting_project(project_value: str):
    allowed_lengths = [7, 10, 12, 14, 16]
    if len(project_value) not in allowed_lengths:
        raise ValidationError(
            f"Value must be string of one of the following lenghts: {', '.join(map(str, allowed_lengths))}"
        )
