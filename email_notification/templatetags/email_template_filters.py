from decimal import Decimal

from django import template

from utils.decimal_utils import round_decimal

register = template.Library()


def format_currency(price: Decimal):
    price = round_decimal(Decimal(price), 2)
    return f"{price:,.2f}".replace(",", " ").replace(".", ",")


register.filter("currency", format_currency)
