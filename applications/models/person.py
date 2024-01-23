from django.db import models
from helsinki_gdpr.models import SerializableMixin

__all__ = [
    "Person",
]


class Person(SerializableMixin, models.Model):
    first_name: str = models.CharField(max_length=50)
    last_name: str = models.CharField(max_length=50)
    email: str | None = models.EmailField(null=True, blank=True)
    phone_number: str | None = models.CharField(null=True, blank=True, max_length=50)

    class Meta:
        db_table = "person"
        base_manager_name = "objects"

    # For GDPR API
    serialize_fields = (
        {"name": "first_name"},
        {"name": "last_name"},
        {"name": "email"},
        {"name": "phone_number"},
    )

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"
