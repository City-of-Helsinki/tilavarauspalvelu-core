from django.db import models

__all__ = [
    "PersonalInfoViewLogManager",
    "PersonalInfoViewLogQuerySet",
]


class PersonalInfoViewLogQuerySet(models.QuerySet): ...


class PersonalInfoViewLogManager(models.Manager.from_queryset(PersonalInfoViewLogQuerySet)): ...
