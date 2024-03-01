import os
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

import django
import polib
from django.core.management import call_command

BASE_PATH = Path(__file__).resolve().parent.parent.parent
LangType = Literal["fi", "sv"]


@dataclass
class MissingTranslations:
    missing_languages: set[LangType] = field(default_factory=set)
    not_included_previous: set[LangType] = field(default_factory=set)
    fuzzy: set[LangType] = field(default_factory=set)


@contextmanager
def working_directory(directory: Path):
    current_path = Path.cwd()
    try:
        os.chdir(directory)
        yield
    finally:
        os.chdir(current_path)


def main() -> int:
    django.setup()
    path_fi = BASE_PATH / "locale" / "fi" / "LC_MESSAGES" / "django.po"
    # path_sv = BASE_PATH / "locale" / "sv" / "LC_MESSAGES" / "django.po"

    missing: dict[str, MissingTranslations] = defaultdict(MissingTranslations)

    contents_before_fi = polib.pofile(str(path_fi))
    # contents_before_sv = polib.pofile(str(path_sv))

    with working_directory(BASE_PATH):
        call_command(
            "maketranslations",
            "-l",
            "fi",
            # "-l",
            # "sv",
            "--no-obsolete",
            "--omit-header",
            "--add-location",
            "file",
        )

    items: list[tuple[LangType, str, polib.POFile]] = [
        ("fi", str(path_fi), contents_before_fi),
        # ("sv", str(path_sv), contents_before_sv),
    ]

    for lang, path, contents_before in items:
        pofile = polib.pofile(path)
        for entry in pofile:
            key = entry.msgid
            if entry.msgctxt is not None:
                key = f"{entry.msgctxt} | {key}"

            if entry.msgstr == "":
                missing[key].missing_languages.add(lang)
            if entry not in contents_before:
                missing[key].not_included_previous.add(lang)
            if "fuzzy" in entry.flags:
                missing[key].fuzzy.add(lang)

    if missing:
        print("\nIncomplete translations:")  # noqa: T201
        for msg, info in missing.items():
            print(f"  {msg}")  # noqa: T201
            if len(info.missing_languages) > 0:
                print("    ↳ Empty:", ", ".join(sorted(info.missing_languages)))  # noqa: T201
            if len(info.not_included_previous) > 0:
                print("    ↳ New:", ", ".join(sorted(info.not_included_previous)))  # noqa: T201
            if len(info.fuzzy) > 0:
                print("    ↳ Fuzzy:", ", ".join(sorted(info.fuzzy)))  # noqa: T201

        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
