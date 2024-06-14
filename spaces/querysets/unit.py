from typing import Literal, Self

from django.db import models


class UnitQuerySet(models.QuerySet):
    def order_by_unit_group_name(self, *, language: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        from spaces.models import UnitGroup

        return self.alias(
            **{
                f"unit_group_name_{language}": models.Subquery(
                    queryset=(
                        # Use the name of the linked unit group which is first alphabetically
                        UnitGroup.objects.filter(units=models.OuterRef("pk"))
                        .order_by(f"name_{language}")
                        .values(f"name_{language}")[:1]
                    ),
                )
            }
        ).order_by(models.OrderBy(models.F(f"unit_group_name_{language}"), descending=desc))
