from django.db import models

__all__ = [
    "City",
]


class City(models.Model):
    name = models.CharField(max_length=100)
    municipality_code = models.CharField(default="", max_length=30)

    class Meta:
        db_table = "city"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.name
