from __future__ import annotations

import csv
import dataclasses
import json
from abc import ABC, abstractmethod
from dataclasses import asdict
from io import StringIO
from itertools import chain, zip_longest
from typing import TYPE_CHECKING, Any, Literal, Self

from django.http import FileResponse

from utils.date_utils import (
    DEFAULT_TIMEZONE,
    local_date_string,
    local_datetime_string,
    local_time_string,
    local_timedelta_string,
)
from utils.utils import to_ascii

if TYPE_CHECKING:
    import datetime
    from collections.abc import Iterable, Iterator

    from django.db import models


@dataclasses.dataclass
class BaseExportRow:
    extra: Iterable[str] = dataclasses.field(default_factory=list, init=False)
    """A dynamic number of columns added to the end of the row."""

    def copy(self) -> Self:
        return dataclasses.replace(self)

    def with_extra(self, extra: Iterable[str]) -> Self:
        self.extra = extra
        return self

    def as_row(self) -> Iterator[Any]:
        """Export the dataclass to an iterable of its values in the order they were defined."""
        data = asdict(self)
        extra_rows: Iterable[str] = data.pop("extra", [])
        return chain(data.values(), extra_rows)

    def as_json(self, *, extra_headers: Iterable[str]) -> dict[str, Any]:
        """Export the dataclass to a json encodable dict."""
        data = asdict(self)

        extra = data.pop("extra", [])
        if extra_headers:
            for extra_header, extra_value in zip_longest(extra_headers, extra, fillvalue=""):
                data[extra_header] = extra_value

        return json.loads(json.dumps(data, default=str))


class BaseCSVExporter(ABC):
    """Base class for CSV exporters."""

    def __init__(
        self,
        *,
        datetime_format: Literal["ISO", "local"] = "local",
    ) -> None:
        self.datetime_format = datetime_format

    def write_csv(self) -> StringIO:
        """Write the CSV to a StringIO object based on the exporter queryset."""
        csv_file = StringIO()
        csv_writer = csv.writer(csv_file, quoting=csv.QUOTE_ALL)

        # Write header rows
        for header_row in self.get_header_rows():
            csv_writer.writerow(list(header_row.as_row()))

        # Write data rows
        for instance in self.queryset:
            for row in self.get_data_rows(instance):
                csv_writer.writerow(list(row.as_row()))

        return csv_file

    def write_json(self) -> list[dict[str, Any]]:
        """Write JSON based on the exporter queryset."""
        extra_headers = [
            to_ascii(string=extra.lower().replace(" ", "_"))
            for header in self.get_header_rows()
            for extra in header.extra
        ]
        return [
            row.as_json(extra_headers=extra_headers)
            for instance in self.queryset
            for row in self.get_data_rows(instance)
        ]

    def to_file_response(self, file_name: str | None = None) -> FileResponse:
        """
        Write the data to a CSV file and return it as a FileResponse.

        :param file_name: The name of the file to be downloaded, without the '.csv' extension.
        """
        if file_name is None:
            file_name = self.default_filename

        csv_file = self.write_csv()
        response = FileResponse(csv_file.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f"attachment;filename={file_name}.csv"
        return response

    def format_datetime(self, value: datetime.datetime | None) -> str | None:
        """Format a datetime as string in the given format."""
        if not value:
            return None
        if self.datetime_format == "ISO":
            return value.astimezone(DEFAULT_TIMEZONE).isoformat(timespec="seconds")
        return local_datetime_string(value)

    def format_date(self, value: datetime.date | None) -> str | None:
        """Format a date as string in the given format."""
        if not value:
            return None
        if self.datetime_format == "ISO":
            return value.isoformat()
        return local_date_string(value)

    def format_time(self, value: datetime.time | None) -> str | None:
        """Format a time as string in the given format."""
        if not value:
            return None
        if self.datetime_format == "ISO":
            return value.replace(tzinfo=DEFAULT_TIMEZONE).isoformat(timespec="seconds")
        return local_time_string(value.replace(tzinfo=DEFAULT_TIMEZONE))

    def format_timedelta(self, value: datetime.timedelta | None) -> str | int | None:
        """Format a timedelta as string in the given format."""
        if not value:
            return None
        if self.datetime_format == "ISO":
            # Time deltas given in minutes to export API as requested
            return int(value.total_seconds() / 60)
        return local_timedelta_string(value)

    @property
    @abstractmethod
    def default_filename(self) -> str:
        """Return the default filename for the CSV file."""

    @property
    @abstractmethod
    def queryset(self) -> models.QuerySet:
        """Return the queryset used to fetch the data for the CSV file."""

    @abstractmethod
    def get_header_rows(self) -> Iterable[BaseExportRow]:
        """Return the header rows for the CSV file."""

    @abstractmethod
    def get_data_rows(self, instance: models.Model) -> Iterable[BaseExportRow]:
        """Process and return the data rows for the CSV file."""
