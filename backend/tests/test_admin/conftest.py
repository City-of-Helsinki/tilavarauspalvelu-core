from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from pytest_django import Settings


@pytest.fixture(autouse=True)
def _language_fix(settings: Settings) -> None:
    # Override languages, since TinyMCE can't handle lazy language name translations in tests ¯\_(ツ)_/¯
    settings.LANGUAGES = [("fi", "Finnish"), ("en", "English"), ("sv", "Swedish")]
