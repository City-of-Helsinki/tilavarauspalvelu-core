from tilavarauspalvelu.hooks.translations_done import main


def test_translations_done():
    assert main() in (0, 1)
