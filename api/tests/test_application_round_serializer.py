import pytest
from assertpy import assert_that

from api.application_round_api import ApplicationRoundSerializer
from applications.models import ApplicationStatus


@pytest.mark.parametrize(
    "affect_sent_status",
    [ApplicationStatus.IN_REVIEW, ApplicationStatus.REVIEW_DONE],
)
@pytest.mark.django_db
def test_should_not_be_sent_when_one_in_sent_status_affecting_status(
    affect_sent_status, application_round, application, application2
):
    application.status = affect_sent_status
    application2.status = ApplicationStatus.SENT

    serializer = ApplicationRoundSerializer(instance=application_round)

    assert_that(serializer.get_applications_sent(instance=application_round)).is_false()


@pytest.mark.parametrize(
    "does_not_affect_sent_status",
    [
        ApplicationStatus.DRAFT,
        ApplicationStatus.DECLINED,
        ApplicationStatus.CANCELLED,
        ApplicationStatus.SENT,
    ],
)
@pytest.mark.django_db
def test_should_be_sent_when_in_not_affecting_status(
    does_not_affect_sent_status, application_round, application, application2
):
    application.status = does_not_affect_sent_status
    application2.status = ApplicationStatus.SENT

    serializer = ApplicationRoundSerializer(instance=application_round)

    assert_that(serializer.get_applications_sent(instance=application_round)).is_true()
