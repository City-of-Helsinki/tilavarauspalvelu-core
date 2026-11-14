import pytest

from config.hooks.translations_done import main


@pytest.mark.slow
def test_translations_done():
    assert main() in {0, 1}
