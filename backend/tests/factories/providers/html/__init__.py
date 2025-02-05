from __future__ import annotations

from typing import TYPE_CHECKING

from faker.providers.lorem import Provider as LoremProvider

if TYPE_CHECKING:
    from collections.abc import Sequence

localized: bool = True

default_locale: str = "fi_FI"


class Provider(LoremProvider):  # Must be names `Provider` to be found by Faker
    """Provider for generating HTML content."""

    def p_tags(self, nb: int = 3, ext_word_list: Sequence[str] | None = None) -> str:
        return "".join(f"<p>{p}</p>" for p in self.paragraphs(nb=nb, ext_word_list=ext_word_list))
