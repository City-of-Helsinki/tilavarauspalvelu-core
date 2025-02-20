from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _language_fix(settings):
    # Override languages, since TinyMCE can't handle lazy language name translations in tests ¯\_(ツ)_/¯
    settings.LANGUAGES = [("fi", "Finnish"), ("en", "English"), ("sv", "Swedish")]
