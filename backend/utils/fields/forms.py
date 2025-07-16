from __future__ import annotations

from django import forms

__all__ = [
    "disabled_widget",
]


disabled_widget = forms.TextInput(attrs={"class": "readonly", "disabled": True, "required": False})
