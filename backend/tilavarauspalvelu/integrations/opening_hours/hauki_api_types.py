from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, TypedDict

if TYPE_CHECKING:
    from tilavarauspalvelu.enums import HaukiResourceState

##########
# Common #
##########


class HaukiTranslatedField(TypedDict):
    fi: str | None
    sv: str | None
    en: str | None


class HaukiDataSource(TypedDict):
    id: str
    name: HaukiTranslatedField


class HaukiAPIOrigin(TypedDict):
    origin_id: str
    data_source: HaukiDataSource


############
# Resource #
############


class HaukiAPIResource(TypedDict):
    id: int
    name: HaukiTranslatedField
    description: HaukiTranslatedField
    address: HaukiTranslatedField
    resource_type: str
    children: list[int]
    parents: list[int]
    organization: str
    origins: list[HaukiAPIOrigin]
    last_modified_by: Any | None
    created: str  # Timestamp, e.g. "2021-11-10T16:49:49.025469+02:00"
    modified: str  # Timestamp, e.g. "2023-09-13T06:04:34.051926+03:00"
    extra_data: dict[str, str]
    is_public: bool
    timezone: Literal["Europe/Helsinki"]
    date_periods_hash: str
    date_periods_as_text: str


class HaukiAPIResourceListResponse(TypedDict):
    count: int
    next: str | None
    previous: str | None
    results: list[HaukiAPIResource]


###############
# Date Period #
###############


class HaukiTimeSpan(TypedDict):
    id: int
    group: int
    name: HaukiTranslatedField
    description: HaukiTranslatedField
    start_time: str | None  # Time, e.g. "08:00:00"
    end_time: str | None  # Time, e.g. "09:00:00"
    end_time_on_next_day: bool
    full_day: bool
    weekdays: list[int]
    resource_state: HaukiResourceState
    created: str  # Timestamp, e.g. "2023-09-06T09:14:12.834385+03:00"
    modified: str  # Timestamp, e.g. "2023-09-06T09:14:12.834385+03:00"


class HaukiTimeSpanGroup(TypedDict):
    id: int
    period: int
    time_spans: list[HaukiTimeSpan]
    rules: list[Any]
    is_removed: bool


class HaukiAPIDatePeriod(TypedDict):
    id: int  # date period id
    resource: int  # resource id
    name: HaukiTranslatedField
    description: HaukiTranslatedField
    start_date: str | None  # Date, e.g. "2022-09-06"
    end_date: str | None  # Date, e.g. "2022-12-12"
    # `resource_state` is only used when `override=True`, otherwise state is defined for each `time_span_group`
    # When `override=True`, the whole date period is considered to be in the state defined by `resource_state`
    resource_state: HaukiResourceState  # Always `undefined` when `override=False`
    override: bool  # If True, the `time_span_groups` is always empty
    origins: list[HaukiAPIOrigin]
    created: str  # Timestamp, e.g. "2023-09-06T09:14:12.671531+03:00"
    modified: str  # Timestamp, e.g. "2023-09-06T09:14:12.671531+03:00"
    time_span_groups: list[HaukiTimeSpanGroup]


#################
# Opening Hours #
#################


class HaukiAPIOpeningHoursResponseResource(TypedDict):
    id: int
    name: HaukiTranslatedField
    timezone: str  # Most likely "Europe/Helsinki"
    origins: list[HaukiAPIOrigin]


class HaukiAPIOpeningHoursResponseTime(TypedDict):
    name: str
    description: str
    start_time: str | None  # Time, e.g. "08:00:00"
    end_time: str | None  # Time, e.g. "09:00:00"
    end_time_on_next_day: bool  # This can be mostly ignored by us, since the Hauki API already handles it nicely.
    resource_state: HaukiResourceState
    full_day: bool
    periods: list[int]


class HaukiAPIOpeningHoursResponseDate(TypedDict):
    date: str  # Date, e.g. "2023-01-01"
    times: list[HaukiAPIOpeningHoursResponseTime]


class HaukiAPIOpeningHoursResponseItem(TypedDict):
    resource: HaukiAPIOpeningHoursResponseResource
    opening_hours: list[HaukiAPIOpeningHoursResponseDate]


class HaukiAPIOpeningHoursResponse(TypedDict):
    count: int
    next: str | None
    previous: str | None
    results: list[HaukiAPIOpeningHoursResponseItem]
