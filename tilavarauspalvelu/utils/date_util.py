import datetime
from typing import Optional

from django.utils.timezone import get_default_timezone


class InvalidWeekdayException(Exception):
    pass


def validate_weekday(weekday: int):
    if weekday < 0 or weekday > 6:
        raise InvalidWeekdayException("Not a valid weekday")


# Finds the next matching weekday after or on given date
# 0 = Monday, 1=Tuesday, 2=Wednesday...
def next_or_current_matching_weekday(d: datetime.date, weekday: int) -> datetime.date:
    validate_weekday(weekday=weekday)

    days_ahead = weekday - d.weekday()
    if days_ahead < 0:  # Target day already happened this week
        days_ahead += 7
    return d + datetime.timedelta(days_ahead)


def previous_or_current_matching_weekday(d: datetime.date, weekday: int) -> datetime.date:
    validate_weekday(weekday=weekday)
    days_ahead = weekday - d.weekday()
    if days_ahead > 0:  # Target day already happened this week
        days_ahead -= 7
    return d + datetime.timedelta(days_ahead)


def localized_short_weekday(weekday: int, lang_code: str) -> str:
    weekdays = {
        "fi": ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"],
        "sv": ["Må", "Ti", "On", "To", "Fr", "Lö", "Sö"],
        "en": ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    }

    if lang_code.lower() not in weekdays:
        lang_code = "fi"

    return weekdays[lang_code][weekday]


def start_of_day(date: Optional[datetime.date]) -> datetime.datetime:
    if date:
        return datetime.datetime.combine(date, datetime.time.min, tzinfo=get_default_timezone())
    return None


def end_of_day(date: Optional[datetime.date]) -> datetime.datetime:
    if date:
        return datetime.datetime.combine(date, datetime.time.max, tzinfo=get_default_timezone())
    return None
