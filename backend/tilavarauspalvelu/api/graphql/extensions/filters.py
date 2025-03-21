from __future__ import annotations

from typing import TYPE_CHECKING, Any

import django_filters
from django import forms

from utils.date_utils import local_end_of_day, local_start_of_day

if TYPE_CHECKING:
    import datetime


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


class TimezoneAwareDateFilter(django_filters.DateFilter):
    """
    DateFilter that allows filtering by date on datetime fields.

    This is useful when you want to filter by date on a DateTimeField in the local timezone.
    The default DateFilter always uses the UTC timezone, which can lead to unexpected results.
    """

    field_class = TimezoneAwareDateField
