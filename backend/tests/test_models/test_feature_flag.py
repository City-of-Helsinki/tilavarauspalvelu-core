from __future__ import annotations

import datetime

import pytest
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.test import RequestFactory
from freezegun import freeze_time
from waffle import flag_is_active

from tilavarauspalvelu.models import FeatureFlag
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import FeatureFlagFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


@pytest.fixture(autouse=True)
def clear_feature_flag_cache():
    cache.clear()


def anonymous_request():
    request = RequestFactory().get("/")
    request.user = AnonymousUser()
    return request


# ── Missing flag ──


def test_feature_flag__missing_flag__is_off_and_created_with_everyone_unknown():
    request = anonymous_request()

    assert flag_is_active(request, "new_feature") is None

    flag = FeatureFlag.objects.get(name="new_feature")
    assert flag.everyone is None


def test_feature_flag__missing_flag__other_rules_work_after_creation():
    user = UserFactory.create()
    request = RequestFactory().get("/")
    request.user = user

    assert flag_is_active(request, "new_feature") is None

    flag = FeatureFlag.objects.get(name="new_feature")
    flag.users.add(user)

    assert flag_is_active(request, "new_feature") is True


# ── Active for everyone from ──


@freeze_time(local_datetime(2026, 11, 19, 12))
def test_feature_flag__active_for_everyone_from__in_the_past__flag_is_on():
    flag = FeatureFlagFactory.create(
        active_for_everyone_from=datetime.datetime(2026, 11, 19, 11, 59, tzinfo=DEFAULT_TIMEZONE),
    )

    request = anonymous_request()

    assert flag_is_active(request, flag.name) is True


@freeze_time(local_datetime(2026, 11, 19, 12))
def test_feature_flag__active_for_everyone_from__now__flag_is_on():
    flag = FeatureFlagFactory.create(
        active_for_everyone_from=datetime.datetime(2026, 11, 19, 12, tzinfo=DEFAULT_TIMEZONE),
    )

    request = anonymous_request()

    assert flag_is_active(request, flag.name) is True


@freeze_time(local_datetime(2026, 11, 19, 12))
def test_feature_flag__active_for_everyone_from__in_the_future__flag_is_off():
    flag = FeatureFlagFactory.create(
        active_for_everyone_from=datetime.datetime(2026, 11, 19, 12, 1, tzinfo=DEFAULT_TIMEZONE),
    )

    request = anonymous_request()

    assert flag_is_active(request, flag.name) is False


@freeze_time(local_datetime(2026, 11, 19, 12))
def test_feature_flag__active_for_everyone_from__in_the_future__other_rules_decide():
    user = UserFactory.create()
    flag = FeatureFlagFactory.create(
        active_for_everyone_from=datetime.datetime(2026, 11, 19, 12, 1, tzinfo=DEFAULT_TIMEZONE),
    )
    flag.users.add(user)

    request = RequestFactory().get("/")
    request.user = user

    assert flag_is_active(request, flag.name) is True


@freeze_time(local_datetime(2026, 11, 19, 12))
def test_feature_flag__active_for_everyone_from__in_the_past__everyone_no_turns_flag_off():
    flag = FeatureFlagFactory.create(
        everyone=False,
        active_for_everyone_from=datetime.datetime(2026, 11, 19, 11, 59, tzinfo=DEFAULT_TIMEZONE),
    )

    request = anonymous_request()

    assert flag_is_active(request, flag.name) is False


@freeze_time(local_datetime(2026, 11, 19, 12))
def test_feature_flag__active_for_everyone_from__time_passes_while_flag_is_cached():
    flag = FeatureFlagFactory.create(
        active_for_everyone_from=datetime.datetime(2026, 11, 19, 13, tzinfo=DEFAULT_TIMEZONE),
    )

    request = anonymous_request()

    assert flag_is_active(request, flag.name) is False

    with freeze_time(local_datetime(2026, 11, 19, 13)):
        assert flag_is_active(request, flag.name) is True
