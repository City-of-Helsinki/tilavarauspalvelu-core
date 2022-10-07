from datetime import datetime
from typing import Optional


def parse_datetime(string: Optional[str]) -> Optional[datetime]:
    if string is None:
        return None
    return datetime.strptime(string, "%Y-%m-%dT%H:%M:%S.%f")
