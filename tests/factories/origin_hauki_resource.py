from typing import Any

from tilavarauspalvelu.models import OriginHaukiResource

from ._base import GenericDjangoModelFactory

__all__ = [
    "OriginHaukiResourceFactory",
]


class OriginHaukiResourceFactory(GenericDjangoModelFactory[OriginHaukiResource]):
    class Meta:
        model = OriginHaukiResource
        django_get_or_create = ["id"]

    id = None
    opening_hours_hash = ""
    latest_fetched_date = None

    @classmethod
    def create(cls, id: int, **kwargs: Any) -> OriginHaukiResource:  # noqa: A002
        kwargs["id"] = id
        return super().create(**kwargs)
