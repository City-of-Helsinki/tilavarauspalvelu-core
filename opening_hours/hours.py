import datetime
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Union

import requests
from django.conf import settings

from opening_hours.enums import State

API_URL = settings.HAUKI_API_URL
REQUESTS_TIMEOUT = 15

logger = logging.getLogger(__name__)


class HaukiError(Exception):
    """Base class for all Hauki client errors"""


class HaukiRequestError(HaukiError):
    """Request to the Hauki API failed"""


class HaukiAPIError(HaukiError):
    """Request succeeded but Hauki API returned an error"""


class HaukiConfigurationError(HaukiError):
    """Request to the Hauki API failed"""


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

    def get_next_day_part(
        self,
    ):  # -> Optional[TimeElement]: # TODO: Causes NameError for some reason
        """Get the next day part of this time span
        Returns a new TimeElement with start time set to midnight, or None if
        this time span doesn't pass midnight."""
        if not self.end_time_on_next_day:
            return None

        return TimeElement(
            start_time=datetime.time(hour=0, minute=0),
            end_time=self.end_time,
            end_time_on_next_day=False,
            resource_state=self.resource_state,
            override=self.override,
            full_day=self.full_day,
            name=self.name,
            description=self.description,
        )


def make_hauki_request(url, params):
    try:
        response = requests.get(url, params=params, timeout=REQUESTS_TIMEOUT)
    except Exception as e:
        logger.error(f"Request to Hauki API failed: {e}")
        raise HaukiRequestError("Resource opening hours request failed")
    try:
        days_data_in = response.json()
    except ValueError as e:
        logger.error(f"Could not read Hauki response as json: {e}")
        raise HaukiRequestError("Resource opening hours response parsing failed")
    if not response.ok:
        if "detail" in days_data_in:
            logger.error(f"Hauki API returned an error: {days_data_in['detail']}")
        else:
            logger.error("Hauki API returned an error")
        raise HaukiAPIError("Hauki API returned an error")
    return days_data_in


def get_opening_hours(
    resource_id: Union[str, int, list],
    start_date: Union[str, datetime.date],
    end_date: Union[str, datetime.date],
) -> List[dict]:
    """Get opening hours for Hauki resource"""
    resource_prefix = f"{settings.HAUKI_ORIGIN_ID}"
    if not (API_URL and resource_prefix):
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

    resource_opening_hours_url = f"{API_URL}/v1/opening_hours/?resource={resource_id}"
    query_params = {
        "start_date": start_date,
        "end_date": end_date,
    }
    days_data_in = make_hauki_request(resource_opening_hours_url, query_params)

    days_data_out = []
    for day_data_in in days_data_in["results"]:
        for opening_hours in day_data_in["opening_hours"]:
            day_data_out = {
                "resource_id": day_data_in["resource"]["id"],
                "date": datetime.datetime.strptime(
                    opening_hours["date"], "%Y-%m-%d"
                ).date(),
                "times": [],
            }
            for time_data_in in opening_hours["times"]:
                day_data_out["times"].append(
                    TimeElement(
                        start_time=datetime.time.fromisoformat(
                            time_data_in.pop("start_time")
                        ),
                        end_time=datetime.time.fromisoformat(
                            time_data_in.pop("end_time")
                        ),
                        **time_data_in,
                    )
                )
            days_data_out.append(day_data_out)
    return days_data_out
