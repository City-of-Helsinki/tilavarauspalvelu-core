from datetime import datetime
from typing import Any, NamedTuple

import pytest
from django.db import IntegrityError

from tests.factories import BannerNotificationFactory
from tests.helpers import parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class Params(NamedTuple):
    params: dict[str, Any]


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Missing all": Params(
                params={
                    "active_from": None,
                    "active_until": None,
                    "message": "",
                },
            ),
            "Missing message": Params(
                params={
                    "active_from": datetime(2021, 1, 1),
                    "active_until": datetime(2021, 1, 2),
                    "message": "",
                },
            ),
            "Missing active period": Params(
                params={
                    "active_from": None,
                    "active_until": None,
                    "message": "foo",
                },
            ),
        },
    )
)
def test_constraint_non_draft_notifications_must_have_active_period_and_message(params):
    with pytest.raises(IntegrityError) as error:
        BannerNotificationFactory.create(draft=False, **params)

    msg = (
        'new row for relation "banner_notification" violates '
        'check constraint "non_draft_notifications_must_have_active_period_and_message"'
    )
    assert str(error.value.args[0]).startswith(msg)


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Missing active until": Params(
                params={
                    "active_from": datetime(2021, 1, 1),
                    "active_until": None,
                },
            ),
            "Missing active from": Params(
                params={
                    "active_from": None,
                    "active_until": datetime(2021, 1, 2),
                },
            ),
        },
    )
)
def test_constraint_active_period_not_set_or_active_until_after_active_from(params):
    with pytest.raises(IntegrityError) as error:
        BannerNotificationFactory.create(**params)

    msg = (
        'new row for relation "banner_notification" violates '
        'check constraint "active_period_not_set_or_active_until_after_active_from"'
    )
    assert str(error.value.args[0]).startswith(msg)
