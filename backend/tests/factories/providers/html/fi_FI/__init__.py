from __future__ import annotations

from faker.providers.lorem.la import Provider as LoremProvider

from tests.factories.providers.html import Provider as HTMLProvider


class Provider(HTMLProvider):  # Must be names `Provider` to be found by Faker
    """Implement lorem provider for `fi_FI` locale."""

    word_list = LoremProvider.word_list
    parts_of_speech = LoremProvider.parts_of_speech
