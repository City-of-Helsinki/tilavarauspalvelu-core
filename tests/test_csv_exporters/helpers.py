from dataclasses import dataclass, field
from typing import Any, NamedTuple
from unittest import mock


@dataclass
class Missing:
    deleted: list[str] = field(default_factory=list)
    null: list[str] = field(default_factory=list)
    empty: list[str] = field(default_factory=list)

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


def get_writes(mock_file: mock.MagicMock) -> list[list[str]]:
    return [call[1][0] for call in mock_file.mock_calls if call[0] == "().writerow"]
