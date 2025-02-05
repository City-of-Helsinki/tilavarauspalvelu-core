from __future__ import annotations

import unicodedata

from django.core.files.storage import FileSystemStorage


class FileSystemStorageASCII(FileSystemStorage):
    def get_valid_name(self, name: str) -> str:
        name = super().get_valid_name(name)
        # Apply additional normalization to convert non-ASCII characters to ASCII
        return unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
