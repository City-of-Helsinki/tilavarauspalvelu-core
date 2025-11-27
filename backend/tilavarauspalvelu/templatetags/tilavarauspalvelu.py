from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from auditlog.render import render_logentry_changes_html as render_changes
from django import template
from django_jinja import library

from utils.decimal_utils import round_decimal

if TYPE_CHECKING:
    from auditlog.models import LogEntry

register = template.Library()


@register.filter(name="currency")
@library.filter(name="currency")
def format_currency(price: Decimal | float) -> str:
    if not isinstance(price, Decimal) and not isinstance(price, int) and not isinstance(price, float):
        msg = f"Error trying to format value as currency. '{price}' is not a number."
        raise TypeError(msg)

    price = round_decimal(Decimal(price), 2)
    return f"{price:,.2f}".replace(",", " ").replace(".", ",")


@register.filter(name="sentence")
@library.filter(name="sentence")
def format_sentence(text: str) -> str:
    text = text.strip()
    if text[-1] in {".", "!", "?", ":"}:
        return text
    return f"{text}."


# Note: Can be removed when a new django-auditlog version is released with a fix for templates missing.
# See: https://github.com/jazzband/django-auditlog/issues/767
# Also templates/auditlog/ templates can be removed then.
@register.filter
def render_logentry_changes_html(log_entry: LogEntry) -> str:
    """
    Format LogEntry changes as HTML.

    Usage in template:
    {{ log_entry_object|render_logentry_changes_html|safe }}
    """
    return render_changes(log_entry)
