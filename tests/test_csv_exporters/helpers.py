import dataclasses
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any, NamedTuple
from unittest import mock


@dataclasses.dataclass
class Missing:
    deleted: list[str] = dataclasses.field(default_factory=list)
    null: list[str] = dataclasses.field(default_factory=list)
    empty: list[str] = dataclasses.field(default_factory=list)

    def remove_from_data(self, data: dict[str, Any]) -> None:
        self._delete(data)
        self._set_null(data)
        self._set_empty(data)

    def _delete(self, data: dict[str, Any]) -> None:
        for deleted in self.deleted:
            if deleted in data:
                del data[deleted]
            else:
                for key in list(data.keys()):
                    if key.startswith(deleted):
                        del data[key]

    def _set_null(self, data: dict[str, Any]) -> None:
        for null in self.null:
            if null in data:
                data[null] = None
            else:
                for key in list(data.keys()):
                    if key.startswith(null):
                        del data[key]
                data[null] = None

    def _set_empty(self, data: dict[str, Any]) -> None:
        for empty in self.empty:
            if empty in data:
                data[empty] = ""
            else:
                for key in list(data.keys()):
                    if key.startswith(empty):
                        del data[key]
                data[empty] = ""


class MissingParams(NamedTuple):
    missing: Missing
    column_value_mapping: dict[str, Any]


class CSVWriterMock(mock.MagicMock):
    def get_writes(self) -> list[list[str]]:
        return [call[1][0] for call in self.mock_calls if call[0] == "().writerow"]


@contextmanager
def mock_csv_writer() -> Generator[CSVWriterMock, None, None]:
    path = "tilavarauspalvelu.services.csv_export._base_exporter.csv.writer"
    with mock.patch(path, new_callable=CSVWriterMock) as mock_file:
        yield mock_file
