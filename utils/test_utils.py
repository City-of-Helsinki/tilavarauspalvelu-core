from os import getenv


def skip_long_running() -> bool:
    return getenv("SKIP_LONG_RUNNING") is not None
