from __future__ import annotations

import factory

from tilavarauspalvelu.models import OriginHaukiResource

from ._base import GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "OriginHaukiResourceFactory",
]


class OriginHaukiResourceFactory(GenericDjangoModelFactory[OriginHaukiResource]):
    class Meta:
        model = OriginHaukiResource
        django_get_or_create = ["id"]

    id = factory.Sequence(int)
    opening_hours_hash = ""
    latest_fetched_date = None

    reservable_time_spans = ReverseForeignKeyFactory("tests.factories.ReservableTimeSpanFactory")
