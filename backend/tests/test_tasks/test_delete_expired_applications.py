from __future__ import annotations

import datetime

import pytest
from django.test import override_settings

from tilavarauspalvelu.models import Application
from tilavarauspalvelu.tasks import delete_expired_applications
from utils.date_utils import local_datetime

from tests.factories import ApplicationFactory, ApplicationRoundFactory

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(REMOVE_EXPIRED_APPLICATIONS_OLDER_THAN_DAYS=365)
def test_delete_expired_applications():
    now = local_datetime()
    application_round_old = ApplicationRoundFactory.create_in_status_results_sent(
        application_period_begin=now - datetime.timedelta(days=400),
        application_period_end=now - datetime.timedelta(days=365),
    )
    application_sent = ApplicationFactory.create_in_status_results_sent(application_round=application_round_old)  # Kept
    ApplicationFactory.create_in_status_expired(application_round=application_round_old)  # Deleted
    ApplicationFactory.create_in_status_cancelled(application_round=application_round_old)  # Deleted

    application_round_new = ApplicationRoundFactory.create_in_status_results_sent(
        application_period_begin=now - datetime.timedelta(days=400),
        application_period_end=now - datetime.timedelta(days=364),  # Not old enough to delete applications
    )
    application_new = ApplicationFactory.create_in_status_expired(application_round=application_round_new)  # Kept

    delete_expired_applications()

    applications = Application.objects.all().order_by("application_round")
    assert len(applications) == 2
    assert list(applications) == [application_sent, application_new]
