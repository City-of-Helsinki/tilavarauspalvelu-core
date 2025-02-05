from __future__ import annotations

from typing import TYPE_CHECKING, Any

from tilavarauspalvelu.models import OriginHaukiResource, ReservableTimeSpan

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

if TYPE_CHECKING:
    import datetime

__all__ = [
    "ReservableTimeSpanFactory",
]


class ReservableTimeSpanFactory(GenericDjangoModelFactory[OriginHaukiResource]):
    class Meta:
        model = ReservableTimeSpan

    resource = ForeignKeyFactory("tests.factories.OriginHaukiResourceFactory")

    start_datetime = None  # datetime.datetime
    end_datetime = None  # datetime.datetime

    @classmethod
    def create(
        cls,
        start_datetime: datetime.datetime,
        end_datetime: datetime.datetime,
        **kwargs: Any,
    ) -> ReservableTimeSpan:
        kwargs["start_datetime"] = start_datetime
        kwargs["end_datetime"] = end_datetime
        return super().create(**kwargs)

    @classmethod
    def build(
        cls,
        start_datetime: datetime.datetime,
        end_datetime: datetime.datetime,
        **kwargs: Any,
    ) -> ReservableTimeSpan:
        kwargs["start_datetime"] = start_datetime
        kwargs["end_datetime"] = end_datetime
        return super().build(**kwargs)
