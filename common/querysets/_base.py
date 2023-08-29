from typing import Self

from django.db import models


class BaseQuerySet(models.QuerySet):
    def order_by_expression(self, alias: str, expression: models.Expression, *, desc: bool = False) -> Self:
        order_by = models.OrderBy(models.F(alias), descending=desc)
        return self.alias(**{alias: expression}).order_by(order_by)
