from django.db import models

__all__ = [
    "Person",
]


class Person(models.Model):
    first_name: str = models.CharField(max_length=50)
    last_name: str = models.CharField(max_length=50)
    email: str | None = models.EmailField(null=True, blank=True)
    phone_number: str | None = models.CharField(null=True, blank=True, max_length=50)

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"
