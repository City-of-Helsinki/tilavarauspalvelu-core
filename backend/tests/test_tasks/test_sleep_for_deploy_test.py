from __future__ import annotations

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.tasks import sleep_for_deploy_test_task

from tests.helpers import as_mock, patch_method


@patch_method(SentryLogger.log_message)
def test_sleep_for_deploy_test__logs_start_and_finish() -> None:
    sleep_for_deploy_test_task(seconds=0)

    assert [call.kwargs for call in as_mock(SentryLogger.log_message).call_args_list] == [
        {"message": "Deploy test task started.", "details": {"seconds": 0}},
        {"message": "Deploy test task finished.", "details": {"seconds": 0}},
    ]
