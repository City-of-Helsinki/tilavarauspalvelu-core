import factory

from tilavarauspalvelu.models import OriginHaukiResource, ReservableTimeSpan

from ._base import GenericDjangoModelFactory


class OriginHaukiResourceFactory(GenericDjangoModelFactory[OriginHaukiResource]):
    class Meta:
        model = OriginHaukiResource
        django_get_or_create = ("id",)

    id = None
    opening_hours_hash = ""
    latest_fetched_date = None


class ReservableTimeSpanFactory(GenericDjangoModelFactory[OriginHaukiResource]):
    class Meta:
        model = ReservableTimeSpan

    resource = factory.SubFactory("tests.factories.OriginHaukiResourceFactory")
    start_datetime = None
    end_datetime = None
