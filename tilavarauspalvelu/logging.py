import json
import logging
from pathlib import Path

from django.core.handlers.wsgi import WSGIRequest

BASE_PATH = str(Path(__file__).resolve().parent.parent)


class TVPFormatter(logging.Formatter):
    def format(self, record):
        extra = {"dotpath": self.get_dotpath(record), "url": "-", "headers": "-", "user_id": "-"}
        if hasattr(record, "request"):
            request: WSGIRequest = record.request
            extra["url"] = request.path
            extra["headers"] = json.dumps(dict(request.headers))
            extra["user_id"] = "Anonymous" if request.user.is_anonymous else request.user.id

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
