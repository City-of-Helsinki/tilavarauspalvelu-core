from collections.abc import Iterable, Iterator
from dataclasses import asdict, dataclass
from io import StringIO

from django.db.models import QuerySet
from django.http import FileResponse


@dataclass
class BaseExportRow:
    def __iter__(self) -> Iterator[str]:
        """Iterate over the values of the dataclass in the order they were defined."""
        return iter(asdict(self).values())


class BaseCSVExporter:
    def export(self, **kwargs) -> StringIO:
        """Write the data to an in-memory CSV file and return it."""
        raise NotImplementedError

    def export_as_file_response(self, file_name: str) -> FileResponse | None:
        """Write the data to a CSV file and return it as a FileResponse."""
        csv_file = self.export()
        if csv_file is None:
            return None

        response = FileResponse(csv_file.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f"attachment;filename={file_name}"
        return response

    def _get_header_rows(self, **kwargs) -> BaseExportRow | tuple:
        """
        Return the header rows for the CSV file.

        Return a BaseExportRow instance if the header is simple and can be written to a single row.
        Return a tuple if the header is complex and needs to be split into multiple rows.
        """
        raise NotImplementedError

    def _get_queryset(self, **kwargs) -> QuerySet:
        """Return the queryset used to fetch the data for the CSV file."""
        raise NotImplementedError

    def _get_single_row_data(self, **kwargs) -> Iterable[BaseExportRow] | list[str]:
        """
        Process and return the data for a single row in the CSV file.

        Return an iterable of BaseExportRow instances if the data is complex and needs to be split into multiple rows.
        Return a list of strings if the data is simple and can be written to a single row.
        """
        raise NotImplementedError
