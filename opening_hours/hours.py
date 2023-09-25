import datetime
from dataclasses import dataclass, field
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils.timezone import get_default_timezone

from opening_hours.enums import State
from opening_hours.errors import HaukiConfigurationError
from opening_hours.utils.hauki_api_client import HaukiAPIClient
from opening_hours.utils.hauki_api_types import HaukiAPIDatePeriod, HaukiAPIOpeningHoursResponse
from tilavarauspalvelu.utils import logging

REQUESTS_TIMEOUT = 15
DEFAULT_TIMEZONE = get_default_timezone()

logger = logging.getLogger(__name__)


@dataclass(order=True, frozen=True)
class TimeElement:
    """
    Represents one time span in a days opening hours

    The "end_time_on_next_day"-attribute is declared between the start and end time to
    allow TimeElements to sort correctly.

    The name, description, and periods attributes are ignored when comparing.
    """

    start_time: datetime.time | None
    end_time_on_next_day: bool
    end_time: datetime.time | None
    resource_state: State = State.UNDEFINED
    override: bool = False
    full_day: bool = False
    name: str = field(default="", compare=False)
    description: str = field(default="", compare=False)
    periods: list | None = field(default=None, compare=False)


@dataclass(order=True, frozen=True)
class TimeSpan:
    """Represents one TimeSpan in Period's time span group's time_spans."""

    id: int
    group: int
    start_time: datetime.time | None
    end_time: datetime.time | None
    end_time_on_next_day: bool
    name: dict[str, str]
    description: dict[str, str]
    created: datetime.datetime | None
    modified: datetime.datetime | None
    resource_state: State = State.UNDEFINED
    full_day: bool = False
    weekdays: list | None = field(default=None, compare=False)


@dataclass(order=True, frozen=True)
class Period:
    """Represents one period in date_period end point"""

    id: int
    resource: str
    name: dict
    description: dict
    start_date: datetime.date | None
    end_date: datetime.date | None
    time_spans: list[TimeSpan]
    resource_state: State = State.UNDEFINED


@dataclass()
class OpeningHoursDayData:
    timezone: ZoneInfo
    resource_id: str
    origin_id: str
    date: datetime.date
    times: list[TimeElement]

    def __getitem__(self, item):
        return getattr(self, item)


def _build_hauki_resource_id(resource_id: str | list[str], hauki_origin_id: str | None) -> str:
    if not hauki_origin_id:
        hauki_origin_id = settings.HAUKI_ORIGIN_ID
    if not hauki_origin_id:
        raise HaukiConfigurationError("HAUKI_ORIGIN_ID environment variable must to be configured.")

    # If resources is a single resource, convert it to a list.
    if not isinstance(resource_id, list):
        resource_id = [resource_id]

    # Build the resource id string, e.g. 'tprek:123,tprek:456'.
    return f"{hauki_origin_id}:{f',{hauki_origin_id}:'.join(resource_id)}"


def get_opening_hours(
    resource_id: str | list[str],
    start_date: str | datetime.date,
    end_date: str | datetime.date,
    hauki_origin_id: str | None = None,
) -> list[OpeningHoursDayData]:
    """Get opening hours for Hauki resource"""
    resource_opening_hours_url = HaukiAPIClient.build_url(endpoint="opening_hours")
    query_params = {
        "resource": _build_hauki_resource_id(resource_id, hauki_origin_id),
        "start_date": start_date.isoformat() if isinstance(start_date, datetime.date) else start_date,
        "end_date": end_date.isoformat() if isinstance(end_date, datetime.date) else end_date,
    }
    days_data_in: HaukiAPIOpeningHoursResponse = HaukiAPIClient.get(url=resource_opening_hours_url, params=query_params)

    days_data_out = []
    for day_data_in in days_data_in["results"]:
        timezone = ZoneInfo(day_data_in.get("resource", {}).get("timezone", DEFAULT_TIMEZONE.key))

        for opening_hours in day_data_in["opening_hours"]:
            day_data_out = OpeningHoursDayData(
                timezone=timezone,
                resource_id=day_data_in["resource"]["id"],
                origin_id=day_data_in["resource"]["origins"][0]["origin_id"],
                date=datetime.datetime.strptime(opening_hours["date"], "%Y-%m-%d").date(),
                times=[],
            )

            for time_data_in in opening_hours["times"]:
                start_time = time_data_in.pop("start_time")
                end_time = time_data_in.pop("end_time")
                state = time_data_in.pop("resource_state", None)

                day_data_out["times"].append(
                    TimeElement(
                        start_time=datetime.time.fromisoformat(start_time) if start_time else None,
                        end_time=datetime.time.fromisoformat(end_time) if end_time else None,
                        resource_state=State.get(state),
                        **time_data_in,
                    )
                )

            days_data_out.append(day_data_out)

    return days_data_out


def get_periods_for_resource(
    resource_id: str,
    hauki_origin_id: str | None = None,
) -> list[Period]:
    """Get periods for a single Hauki resource"""
    resource_periods_url = HaukiAPIClient.build_url(endpoint="date_period")
    periods_data_in: list[HaukiAPIDatePeriod] = HaukiAPIClient.get(
        url=resource_periods_url,
        params={
            "resource": _build_hauki_resource_id(resource_id, hauki_origin_id),
        },
    )

    periods_data_out = []
    for period in periods_data_in:
        period_data_out = {
            "id": period["id"],
            "resource": period["resource"],
            "start_date": datetime.datetime.strptime(period["start_date"], "%Y-%m-%d").date()
            if period["start_date"]
            else None,
            "end_date": datetime.datetime.strptime(period["end_date"], "%Y-%m-%d").date()
            if period["end_date"]
            else None,
            "description": period["description"],
            "name": period["name"],
            "resource_state": period["resource_state"],
            "time_spans": [],
        }

        for time_span_group in period["time_span_groups"]:
            for time_data_in in time_span_group["time_spans"]:
                start_time = time_data_in.pop("start_time")
                end_time = time_data_in.pop("end_time")

                period_data_out["time_spans"].append(
                    TimeSpan(
                        start_time=datetime.time.fromisoformat(start_time) if start_time else None,
                        end_time=datetime.time.fromisoformat(end_time) if end_time else None,
                        **time_data_in,
                    )
                )

            periods_data_out.append(Period(**period_data_out))

    return periods_data_out
