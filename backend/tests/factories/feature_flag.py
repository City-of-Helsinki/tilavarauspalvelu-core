from __future__ import annotations

import factory

from tilavarauspalvelu.models import FeatureFlag

from ._base import GenericDjangoModelFactory

__all__ = [
    "FeatureFlagFactory",
]


class FeatureFlagFactory(GenericDjangoModelFactory[FeatureFlag]):
    class Meta:
        model = FeatureFlag
        django_get_or_create = ["name"]

    name = factory.Sequence(lambda i: f"feature_flag_{i}")
    everyone = None
    active_for_everyone_from = None
