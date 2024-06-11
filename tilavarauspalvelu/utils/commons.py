from typing import Literal

from django.conf import settings
from django.utils.translation import gettext_lazy as _

type LanguageType = Literal["fi", "en", "sv"]


class LANGUAGES:
    FI: str
    SV: str
    EN: str


def _build_languages() -> None:
    for lang in settings.LANGUAGES:
        setattr(LANGUAGES, lang[0].upper(), lang[0])


_build_languages()


class WEEKDAYS:
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6

    CHOICES = (
        (MONDAY, _("Monday")),
        (TUESDAY, _("Tuesday")),
        (WEDNESDAY, _("Wednesday")),
        (THURSDAY, _("Thursday")),
        (FRIDAY, _("Friday")),
        (SATURDAY, _("Saturday")),
        (SUNDAY, _("Sunday")),
    )

    VALUES = (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY)
