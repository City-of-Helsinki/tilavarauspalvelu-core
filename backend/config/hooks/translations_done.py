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
    from collections.abc import Collection, Generator

BASE_PATH = Path(__file__).resolve().parent.parent.parent


@dataclass
class TranslationData:
    lang: str
    path: str
    contents: polib.POFile


@dataclass
class MissingTranslations:
    missing_languages: set[str] = field(default_factory=set)
    not_included_previous: set[str] = field(default_factory=set)
    removed: set[str] = field(default_factory=set)
    fuzzy: set[str] = field(default_factory=set)


def main() -> int:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    django.setup()

    items = _get_current_translations()
    _run_translation_command()
    check_swedish_for_contexts = ["Email", "ICAL", "ReservationCancelReason"]
    missing = _find_missing_translations(items, check_swedish_for_contexts=check_swedish_for_contexts)

    if missing:
        _print_errors(missing)
        return 1
    return 0


def _get_languages() -> Generator[str]:
    # Enables adding more languages
    yield from ["fi", "sv"]


def _find_missing_translations(
    translations: list[TranslationData],
    *,
    check_swedish_for_contexts: Collection[str] = (),
) -> dict[str, MissingTranslations]:
    """
    Find missing, removed, or fuzzy translations in the current translations.

    :param translations: Translation data before running the command for this check.
    :params check_swedish_for_contexts: When using `pgettext`, these are the 'contexts' that will
                                        be checked for Swedish translations. Other translations are not checked.
    """
    missing: dict[str, MissingTranslations] = defaultdict(MissingTranslations)
    for prev_translation in translations:
        pofile = polib.pofile(prev_translation.path)
        known: set[str] = set()

        for entry in pofile:
            if prev_translation.lang == "sv" and entry.msgctxt not in check_swedish_for_contexts:
                continue

            key = entry.msgid
            if entry.msgctxt is not None:
                key = f"{entry.msgctxt} | {key}"

            known.add(key)

            if not entry.msgstr:
                missing[key].missing_languages.add(prev_translation.lang)
            if entry not in prev_translation.contents:
                missing[key].not_included_previous.add(prev_translation.lang)
            if "fuzzy" in entry.flags:
                missing[key].fuzzy.add(prev_translation.lang)

        for entry in prev_translation.contents:
            if prev_translation.lang == "sv" and entry.msgctxt not in check_swedish_for_contexts:
                continue

            key = entry.msgid
            if entry.msgctxt is not None:
                key = f"{entry.msgctxt} | {key}"

            if key not in known:
                missing[key].removed.add(prev_translation.lang)

    return missing


def _get_current_translations() -> list[TranslationData]:
    return [
        TranslationData(
            lang=lang,
            path=(path := str(locale_path / lang / "LC_MESSAGES" / "django.po")),
            contents=polib.pofile(path),
        )
        for locale_path in settings.LOCALE_PATHS
        for lang in _get_languages()
    ]


@contextmanager
def working_directory(directory: Path) -> Generator[None]:
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
    print("\nIncomplete translations:")  # noqa: T201, RUF100
    for msg, info in missing.items():
        print(f"  {msg}")  # noqa: T201, RUF100
        if len(info.missing_languages) > 0:
            print("    ↳ Empty:", ", ".join(sorted(info.missing_languages)))  # noqa: T201, RUF100
        if len(info.removed) > 0:
            print("    ↳ Removed:", ", ".join(sorted(info.removed)))  # noqa: T201, RUF100
        if len(info.not_included_previous) > 0:
            print("    ↳ New:", ", ".join(sorted(info.not_included_previous)))  # noqa: T201, RUF100
        if len(info.fuzzy) > 0:
            print("    ↳ Fuzzy:", ", ".join(sorted(info.fuzzy)))  # noqa: T201, RUF100


if __name__ == "__main__":
    raise SystemExit(main())
