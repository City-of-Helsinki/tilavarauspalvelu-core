import datetime

from django.utils.timezone import get_default_timezone

DEFAULT_TIMEZONE = get_default_timezone()


def datetime_args_to_default_timezone(func: callable):
    def convert_to_utc(*args, **kwargs):
        converted_args = []
        for arg in args:
            if isinstance(arg, datetime.datetime):
                arg = arg.astimezone(DEFAULT_TIMEZONE)
            elif isinstance(arg, datetime.time):
                timezone = arg.tzinfo
                if not timezone:
                    timezone = DEFAULT_TIMEZONE
                dt = datetime.datetime(1977, 1, 1, arg.hour, arg.minute, arg.second, tzinfo=timezone)
                arg = dt.astimezone(DEFAULT_TIMEZONE).time()
            converted_args.append(arg)

        return func(*converted_args, **kwargs)

    return convert_to_utc
