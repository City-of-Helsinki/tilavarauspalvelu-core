from django.conf import settings


class LANGUAGES:
    FI: str
    SV: str
    EN: str


def _build_languages():
    for lang in settings.LANGUAGES:
        setattr(LANGUAGES, lang[0].upper(), lang[0])


_build_languages()
