from decimal import Decimal

from django import template
from django_jinja import library

from utils.decimal_utils import round_decimal

register = template.Library()


@register.filter(name="currency")
@library.filter(name="currency")
def format_currency(price: Decimal | float) -> str:
    if not isinstance(price, Decimal) and not isinstance(price, int) and not isinstance(price, float):
        raise TypeError(f"Error trying to format value as currency. '{price}' is not a number.")

    price = round_decimal(Decimal(price), 2)
    return f"{price:,.2f}".replace(",", " ").replace(".", ",")


@register.filter(name="sentence")
@library.filter(name="sentence")
def format_sentence(text: str) -> str:
    text = text.strip()
    if text[-1] in (".", "!", "?", ":"):
        return text
    return f"{text}."
