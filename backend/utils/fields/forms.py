from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django import forms

from utils.date_utils import local_end_of_day, local_start_of_day

if TYPE_CHECKING:
    import datetime

    from django.db import models


__all__ = [
    "TextChoicesFormField",
    "TextMultipleChoiceFormField",
    "TimezoneAwareDateField",
]


class TimezoneAwareDateField(forms.DateField):
    def __init__(self, **kwargs: Any) -> None:
        self.use_end_of_day = kwargs.pop("use_end_of_day", False)
        super().__init__(**kwargs)

    def to_python(self, value: datetime.date | datetime.datetime | str | None) -> datetime.datetime | None:
        value: datetime.date | None = super().to_python(value)

        if value is None:
            return value

        if self.use_end_of_day:
            return local_end_of_day(value)
        return local_start_of_day(value)


class TextChoicesFieldMixin:
    def __init__(self, enum: type[models.TextChoices], **kwargs: Any) -> None:
        self.enum = enum
        kwargs["choices"] = enum.choices
        super().__init__(**kwargs)


class TextChoicesFormField(TextChoicesFieldMixin, forms.ChoiceField):
    """Custom field for handling enums better in GraphQL filters."""


class TextMultipleChoiceFormField(TextChoicesFieldMixin, forms.MultipleChoiceField):
    """Same as `TextChoicesField` but supports multiple choices."""
