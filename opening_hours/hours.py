import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Union

import pytz
from django.conf import settings
from django.utils.timezone import get_default_timezone

import tilavarauspalvelu.utils.logging as logging
from opening_hours.enums import State
from opening_hours.errors import HaukiConfigurationError
from opening_hours.hauki_request import make_hauki_get_request

REQUESTS_TIMEOUT = 15
DEFAULT_TIMEZONE = get_default_timezone()

logger = logging.getLogger(__name__)


@dataclass(order=True, frozen=True)
class TimeElement:
    """Represents one time span in a days opening hours

    The "end_time_on_next_day"-attribute is declared between the start and end time to
    allow TimeElements to sort correctly.

    The name, description, and periods attributes are ignored when comparing."""

    start_time: Optional[datetime.time]
    end_time_on_next_day: bool
    end_time: Optional[datetime.time]
    resource_state: State = State.UNDEFINED
    override: bool = False
    full_day: bool = False
    name: str = field(default="", compare=False)
    description: str = field(default="", compare=False)
    periods: Optional[list] = field(default=None, compare=False)


@dataclass(order=True, frozen=True)
class TimeSpan:
    """Represents one TimeSpan in Period's time span group's time_spans."""

    id: int
    group: int
    start_time: Optional[datetime.time]
    end_time: Optional[datetime.time]
    end_time_on_next_day: bool
    name: Dict[str, str]
    description: Dict[str, str]
    created: Optional[datetime.datetime]
    modified: Optional[datetime.datetime]
    resource_state: State = State.UNDEFINED
    full_day: bool = False
    weekdays: Optional[list] = field(default=None, compare=False)


@dataclass(order=True, frozen=True)
class Period:
    """Represents one period in date_period end point"""

    id: int
    resource: str
    name: dict
    description: dict
    start_date: Optional[datetime.date]
    end_date: Optional[datetime.date]
    time_spans: List[TimeSpan]
    resource_state: State = State.UNDEFINED


def get_opening_hours(
    resource_id: Union[str, int, list],
    start_date: Union[str, datetime.date],
    end_date: Union[str, datetime.date],
    hauki_origin_id=None,
) -> List[dict]:
    """Get opening hours for Hauki resource"""
    if hauki_origin_id:
        hauki_origin_id = hauki_origin_id
    else:
        hauki_origin_id = settings.HAUKI_ORIGIN_ID

    resource_prefix = f"{hauki_origin_id}"
    if not (settings.HAUKI_API_URL and resource_prefix):
        raise HaukiConfigurationError(
            "Both hauki api url and hauki origin id need to be configured"
        )
    if isinstance(resource_id, list):
        resource_id = [str(uuid) for uuid in resource_id]
        resource_id = "%s:%s" % (
            resource_prefix,
            f",{resource_prefix}:".join(resource_id),
        )
    else:
        resource_id = f"{resource_prefix}:{resource_id}"
    if isinstance(start_date, datetime.date):
        start_date = start_date.isoformat()
    if isinstance(end_date, datetime.date):
        end_date = end_date.isoformat()

    resource_opening_hours_url = (
        f"{settings.HAUKI_API_URL}/v1/opening_hours/?resource={resource_id}"
    )
    query_params = {
        "start_date": start_date,
        "end_date": end_date,
    }
    days_data_in = make_hauki_get_request(resource_opening_hours_url, query_params)

    days_data_out = []
    for day_data_in in days_data_in["results"]:
        timezone = pytz.timezone(
            day_data_in.get("resource", {}).get("timezone", DEFAULT_TIMEZONE.zone)
        )
        for opening_hours in day_data_in["opening_hours"]:
            day_data_out = {
                "timezone": timezone,
                "resource_id": day_data_in["resource"]["id"],
                "origin_id": day_data_in["resource"]["origins"][0]["origin_id"],
                "date": datetime.datetime.strptime(
                    opening_hours["date"], "%Y-%m-%d"
                ).date(),
                "times": [],
            }
            for time_data_in in opening_hours["times"]:
                start_time = time_data_in.pop("start_time")
                end_time = time_data_in.pop("end_time")
                state = time_data_in.pop("resource_state", None)

                day_data_out["times"].append(
                    TimeElement(
                        start_time=datetime.time.fromisoformat(start_time)
                        if start_time
                        else None,
                        end_time=datetime.time.fromisoformat(end_time)
                        if end_time
                        else None,
                        resource_state=State.get(state),
                        **time_data_in,
                    )
                )
            days_data_out.append(day_data_out)
    return days_data_out


def get_periods_for_resource(
    resource_id: Union[str, int, list], hauki_origin_id=None
) -> List[Period]:
    """Get periods for Hauki resource"""
    if hauki_origin_id:
        hauki_origin_id = hauki_origin_id
    else:
        hauki_origin_id = settings.HAUKI_ORIGIN_ID

    resource_prefix = f"{hauki_origin_id}"
    if not (settings.HAUKI_API_URL and resource_prefix):
        raise HaukiConfigurationError(
            "Both hauki api url and hauki origin id need to be configured"
        )
    if isinstance(resource_id, list):
        resource_id = [str(uuid) for uuid in resource_id]
        resource_id = "%s:%s" % (
            resource_prefix,
            f",{resource_prefix}:".join(resource_id),
        )
    else:
        resource_id = f"{resource_prefix}:{resource_id}"

    resource_periods_url = (
        f"{settings.HAUKI_API_URL}/v1/date_period/?resource={resource_id}"
    )

    periods_data_in = make_hauki_get_request(resource_periods_url, None)

    periods_data_out = []
    for period in periods_data_in:
        period_data_out = {
            "id": period["id"],
            "resource": period["resource"],
            "start_date": datetime.datetime.strptime(
                period["start_date"], "%Y-%m-%d"
            ).date()
            if period["start_date"]
            else None,
            "end_date": datetime.datetime.strptime(
                period["end_date"], "%Y-%m-%d"
            ).date()
            if period["end_date"]
            else None,
            "description": period["description"],
            "name": period["name"],
            "resource_state": period["resource_state"],
            "time_spans": [],
        }
        for time_span_group in period["time_span_groups"]:
            for time_data_in in time_span_group["time_spans"]:
                period_data_out["time_spans"].append(
                    TimeSpan(
                        start_time=datetime.time.fromisoformat(
                            time_data_in.pop("start_time")
                        ),
                        end_time=datetime.time.fromisoformat(
                            time_data_in.pop("end_time")
                        ),
                        **time_data_in,
                    )
                )
            periods_data_out.append(Period(**period_data_out))
    return periods_data_out
