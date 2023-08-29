from typing import Any

from django.db import models

__all__ = [
    "ChoiceField",
]


class ChoiceField(models.CharField):
    """CharField for TextChoices that automatically sets 'max_length' to the longest choice."""

    def __init__(self, choices: list[tuple[str, Any]], **kwargs: Any) -> None:
        kwargs["max_length"] = max(len(val) for val, _ in choices)
        super().__init__(choices=choices, **kwargs)
