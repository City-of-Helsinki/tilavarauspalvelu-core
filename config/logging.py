from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest

BASE_PATH = str(Path(__file__).resolve().parent.parent)


class TVPFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        extra = {"dotpath": self.get_dotpath(record), "url": "-", "headers": "-", "user_id": "-"}
        if hasattr(record, "request"):
            request: WSGIRequest = record.request
            extra["url"] = request.path
            extra["headers"] = json.dumps(dict(request.headers))
            user = getattr(request, "user", None)
            if user is not None:
                extra["user_id"] = "Anonymous" if getattr(user, "is_anonymous", False) else user.id

        self._style._defaults = extra
        return super().format(record)

    def get_dotpath(self, record: logging.LogRecord) -> str:
        """Try to fetch the full dot import path for the module the log happened at."""
        # For library logs
        split_path = record.pathname.split("site-packages")
        if len(split_path) > 1:
            return self.format_dotpath(split_path[-1][1:])

        # For our logs
        split_path = record.pathname.split(str(BASE_PATH))
        if len(split_path) > 1:
            return self.format_dotpath(split_path[-1][1:])

        # Fall back to the module name, which doesn't include the full path info
        return record.module

    @staticmethod
    def format_dotpath(path: str) -> str:
        return path.removesuffix(".py").replace("/", ".").replace("\\", ".")
