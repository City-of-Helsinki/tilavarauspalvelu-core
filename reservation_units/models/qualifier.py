from django.db import models

__all__ = [
    "Qualifier",
]


class Qualifier(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self) -> str:
        return self.name
