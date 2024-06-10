from __future__ import annotations

import os
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

import django
import polib
from django.conf import settings
from django.core.management import call_command

if TYPE_CHECKING:
    from collections.abc import Generator

BASE_PATH = Path(__file__).resolve().parent.parent.parent


@dataclass
class TranslationData:
    lang: str
    path: str
    contents_before: polib.POFile


@dataclass
class MissingTranslations:
    missing_languages: set[str] = field(default_factory=set)
    not_included_previous: set[str] = field(default_factory=set)
    fuzzy: set[str] = field(default_factory=set)


def main() -> int:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    django.setup()

    items = _get_current_translations()
    _run_translation_command()
    missing = _find_missing_translations(items)

    if missing:
        _print_errors(missing)
        return 1
    return 0


def _get_languages() -> Generator[str, None, None]:
    # Enables adding more languages
    yield from ["fi"]


def _find_missing_translations(items: list[TranslationData]) -> dict[str, MissingTranslations]:
    missing: dict[str, MissingTranslations] = defaultdict(MissingTranslations)
    for item in items:
        pofile = polib.pofile(item.path)
        for entry in pofile:
            key = entry.msgid
            if entry.msgctxt is not None:
                key = f"{entry.msgctxt} | {key}"

            if entry.msgstr == "":
                missing[key].missing_languages.add(item.lang)
            if entry not in item.contents_before:
                missing[key].not_included_previous.add(item.lang)
            if "fuzzy" in entry.flags:
                missing[key].fuzzy.add(item.lang)
    return missing


def _get_current_translations() -> list[TranslationData]:
    return [
        TranslationData(
            lang=lang,
            path=(path := str(locale_path / lang / "LC_MESSAGES" / "django.po")),
            contents_before=polib.pofile(path),
        )
        for locale_path in settings.LOCALE_PATHS
        for lang in _get_languages()
    ]


@contextmanager
def working_directory(directory: Path) -> Generator[None, None, None]:
    current_path = Path.cwd()
    try:
        os.chdir(directory)
        yield
    finally:
        os.chdir(current_path)


def _run_translation_command() -> None:
    with working_directory(BASE_PATH):
        call_command(
            "maketranslations",
            *(arg for lang in _get_languages() for arg in ["-l", lang]),
            "--no-obsolete",
            "--omit-header",
            "--add-location",
            "file",
        )


def _print_errors(missing: dict[str, MissingTranslations]) -> None:
    print("\nIncomplete translations:")  # noqa: T201
    for msg, info in missing.items():
        print(f"  {msg}")  # noqa: T201
        if len(info.missing_languages) > 0:
            print("    ↳ Empty:", ", ".join(sorted(info.missing_languages)))  # noqa: T201
        if len(info.not_included_previous) > 0:
            print("    ↳ New:", ", ".join(sorted(info.not_included_previous)))  # noqa: T201
        if len(info.fuzzy) > 0:
            print("    ↳ Fuzzy:", ", ".join(sorted(info.fuzzy)))  # noqa: T201


if __name__ == "__main__":
    raise SystemExit(main())
