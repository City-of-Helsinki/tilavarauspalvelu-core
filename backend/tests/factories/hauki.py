from __future__ import annotations

import factory

from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import (
    HaukiAPIOrigin,
    HaukiAPIResource,
    HaukiAPIResourceListResponse,
    HaukiDataSource,
    HaukiTranslatedField,
)

from ._base import GenericListFactory, ValidatedGenericFactory

__all__ = [
    "HaukiAPIOriginFactory",
    "HaukiAPIResourceFactory",
    "HaukiAPIResourceListResponseFactory",
    "HaukiDataSourceFactory",
    "HaukiTranslatedFieldFactory",
]


class HaukiTranslatedFieldFactory(ValidatedGenericFactory[HaukiTranslatedField]):
    class Meta:
        model = HaukiTranslatedField

    fi = "fi"
    sv = "sv"
    en = "en"


class HaukiDataSourceFactory(ValidatedGenericFactory[HaukiDataSource]):
    class Meta:
        model = HaukiDataSource

    id = ""
    name = factory.SubFactory(HaukiTranslatedFieldFactory)


class HaukiAPIOriginFactory(ValidatedGenericFactory[HaukiAPIOrigin]):
    class Meta:
        model = HaukiAPIOrigin

    origin_id = ""
    data_source = factory.SubFactory(HaukiDataSourceFactory)


class HaukiAPIResourceFactory(ValidatedGenericFactory[HaukiAPIResource]):
    class Meta:
        model = HaukiAPIResource

    id = factory.Sequence(lambda n: n)
    name = factory.SubFactory(HaukiTranslatedFieldFactory)
    description = factory.SubFactory(HaukiTranslatedFieldFactory)
    address = factory.SubFactory(HaukiTranslatedFieldFactory)
    resource_type = ""
    children: list[int] = []
    parents: list[int] = []
    organization = "org"
    origins = GenericListFactory(HaukiAPIOriginFactory)
    last_modified_by = None
    created = "2021-11-10T16:49:49.025469+02:00"
    modified = "2023-09-13T06:04:34.051926+03:00"
    extra_data: dict[str, str] = {}
    is_public = True
    timezone = "Europe/Helsinki"
    date_periods_hash = ""
    date_periods_as_text = ""


class HaukiAPIResourceListResponseFactory(ValidatedGenericFactory[HaukiAPIResourceListResponse]):
    class Meta:
        model = HaukiAPIResourceListResponse

    count = 0
    next = None
    previous = None
    results = GenericListFactory(HaukiAPIResourceFactory)
