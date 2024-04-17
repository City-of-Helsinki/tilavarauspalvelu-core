from decimal import Decimal

import jinja2
from django import template

from utils.decimal_utils import round_decimal

register = template.Library()


def format_currency(price: Decimal | float) -> str:
    if not isinstance(price, Decimal) and not isinstance(price, int) and not isinstance(price, float):
        raise jinja2.TemplateError(f"Error trying to format value as currency. '{price}' is not a number.")

    price = round_decimal(Decimal(price), 2)
    return f"{price:,.2f}".replace(",", " ").replace(".", ",")


register.filter("currency", format_currency)
